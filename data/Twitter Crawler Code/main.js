const Apify = require('apify');
const _ = require('lodash');
const {
    infiniteScroll,
    requestCounter,
    minMaxDates,
    createAddEvent,
    createAddProfile,
    createAddSearch,
    createAddThread,
    createAddTopic,
    extendFunction,
    categorizeUrl,
    tweetToUrl,
    deferred,
    getEntities,
    proxyConfiguration,
    blockPatterns,
    filterCookies,
    getTimelineInstructions,
} = require('./helpers');
const { LABELS, USER_OMIT_FIELDS } = require('./constants');

const { log } = Apify.utils;

Apify.main(async () => {
    /** @type {any} */
    const input = await Apify.getInput();

    const proxyConfig = await proxyConfiguration({
        proxyConfig: input.proxyConfig,
    });

    const {
        tweetsDesired = 100,
        mode = 'replies',
        addUserInfo = true,
        maxRequestRetries = 3,
        maxIdleTimeoutSecs = 30,
        debugLog = false,
    } = input;

    if (debugLog) {
        log.setLevel(log.LEVELS.DEBUG);
    }

    log.info(`Limiting tweet counts to ${tweetsDesired}...`);

    const requestQueue = await Apify.openRequestQueue();
    const requestCounts = await requestCounter(tweetsDesired);
    const pushedItems = new Set(await Apify.getValue('PUSHED'));

    Apify.events.on('migrating', async () => {
        await Apify.setValue('PUSHED', [...pushedItems.values()]);
    });

    const addProfile = createAddProfile(requestQueue);
    const addSearch = createAddSearch(requestQueue);
    const addEvent = createAddEvent(requestQueue);
    const addThread = createAddThread(requestQueue);
    const addTopic = createAddTopic(requestQueue);

    const dates = minMaxDates({
        min: input.toDate,
        max: input.fromDate,
    });

    if (dates.maxDate) {
        log.info(`\n\nGetting tweets older than ${dates.maxDate.toLocaleString()}\n`);
    }

    if (dates.minDate) {
        log.info(`\n\nGetting tweets newer than ${dates.minDate.toLocaleString()}\n`);
    }

    const extendOutputFunction = await extendFunction({
        map: async (data) => {
            if (!data.tweets) {
                return [];
            }

            return Object.entries(data.tweets).reduce((/** @type {any[]} */out, [sortIndex, tweet]) => {
                log.debug('Tweet data', tweet);

                const user = data.users[
                    _.get(
                        tweet,
                        ['user_id_str'],
                        _.get(tweet, ['user', 'id_str']),
                    )
                ];

                out.push({
                    user: addUserInfo ? {
                        ..._.omit(user, USER_OMIT_FIELDS),
                        created_at: new Date(user.created_at).toISOString(),
                    } : undefined,
                    id: tweet.id_str,
                    conversation_id: tweet.conversation_id_str,
                    ..._.pick(tweet, [
                        'full_text',
                        'reply_count',
                        'retweet_count',
                        'favorite_count',
                    ]),
                    ...getEntities(tweet),
                    url: tweetToUrl(user, tweet.id_str),
                    created_at: new Date(tweet.created_at).toISOString(),
                    '#sort_index': sortIndex,
                });

                return out;
            }, []);
        },
        filter: async ({ item }) => {
            return dates.compare(item.created_at);
        },
        output: async (output, { request, item }) => {
            if (!requestCounts.isDone(request)) {
                if (item.id) {
                    if (pushedItems.has(item.id)) {
                        return;
                    }
                    pushedItems.add(item.id);
                }

                await Apify.pushData(output);
                requestCounts.increaseCount(request);
            }
        },
        input,
        key: 'extendOutputFunction',
        helpers: {
            _,
        },
    });

    const extendScraperFunction = await extendFunction({
        output: async () => {}, // no-op
        input,
        key: 'extendScraperFunction',
        helpers: {
            addProfile,
            addSearch,
            addEvent,
            addTopic,
            addThread,
            pushedItems,
            extendOutputFunction,
            requestQueue,
            _,
        },
    });

    if (input.startUrls && input.startUrls.length) {
        // parse requestsFromUrl
        const requestList = await Apify.openRequestList('STARTURLS', input.startUrls || []);

        let req;

        while (req = await requestList.fetchNextRequest()) { // eslint-disable-line no-cond-assign
            const categorized = categorizeUrl(req.url);

            switch (categorized) {
                case LABELS.EVENTS:
                    await addEvent(req.url);
                    break;
                case LABELS.HANDLE:
                    await addProfile(req.url, mode === 'replies');
                    break;
                case LABELS.STATUS:
                    await addThread(req.url);
                    break;
                case LABELS.TOPIC:
                    await addTopic(req.url);
                    break;
                case LABELS.SEARCH:
                    await addSearch(req.url, input.searchMode);
                    break;
                default:
                    throw new Error(`Unknown format ${categorized}`);
            }
        }
    }

    if (input.handle && input.handle.length) {
        for (const handle of input.handle) {
            await addProfile(handle, mode === 'replies');
        }
    }

    if (input.searchTerms && input.searchTerms.length) {
        for (const searchTerm of input.searchTerms) {
            await addSearch(searchTerm, input.searchMode);
        }
    }

    const isLoggingIn = input.initialCookies && input.initialCookies.length > 0;

    await extendScraperFunction(undefined, {
        label: 'setup',
        isLoggingIn,
    });

    if (await requestQueue.isEmpty()) {
        throw new Error('You need to provide something to be extracted');
    }

    const crawler = new Apify.PuppeteerCrawler({
        handlePageTimeoutSecs: input.handlePageTimeoutSecs || 5000,
        requestQueue,
        proxyConfiguration: proxyConfig,
        maxConcurrency: 1,
        launchContext: {
            useIncognitoPages: true,
        },
        browserPoolOptions: {
            useFingerprints: true,
        },
        sessionPoolOptions: {
            createSessionFunction: async (sessionPool) => {
                const session = new Apify.Session({
                    sessionPool,
                    maxUsageCount: isLoggingIn ? 5000 : 50,
                    maxErrorScore: 1,
                });

                return session;
            },
        },
        useSessionPool: true,
        maxRequestRetries,
        persistCookiesPerSession: false,
        postNavigationHooks: [async ({ page }) => {
            await page.bringToFront();
        }],
        preNavigationHooks: [async ({ page }, gotoOptions) => {
            gotoOptions.waitUntil = 'domcontentloaded';
            gotoOptions.timeout = 30000;

            await page.setBypassCSP(true);

            await Apify.utils.puppeteer.blockRequests(page, {
                urlPatterns: blockPatterns,
            });

            await page.setViewport({
                height: 1080,
                width: 1920,
                deviceScaleFactor: 1.5,
            });

            if (input.extendOutputFunction || input.extendScraperFunction) {
                // insert jQuery only when the user have an output function
                await Apify.utils.puppeteer.injectJQuery(page);
            }

            const filteredCookies = filterCookies(input.initialCookies);

            if (isLoggingIn && filteredCookies.length) {
                await page.setCookie(...filteredCookies);
            }
        }],
        handleFailedRequestFunction: async ({ request }) => {
            log.error(`${request.url} failed ${request.retryCount} times and won't be retried anymore...`);

            await Apify.pushData({
                '#failed': true,
                '#debug': Apify.utils.createRequestDebugInfo(request),
            });
        },
        handlePageFunction: async ({ request, session, page, response }) => {
            const retire = async () => {
                // TODO: need to force retiring both, the SDK sticks with forever failing sessions even with errorScore >= 1
                log.warning('Retiring session...');
                session.retire();
            };

            const signal = deferred();
            const isUserSearch = page.url().includes('f=user'); // user search doesn't contain tweets

            page.on('response', async (res) => {
                try {
                    const contentType = res.headers()['content-type'];

                    if (!contentType || !`${contentType}`.includes('application/json')) {
                        return;
                    }

                    const url = res.url();

                    if (!res.ok()) {
                        if (!url.includes('/friends/') && !url.includes('list.json')) {
                            signal.reject(new Error(`Status ${res.status()}`));
                        }
                        return;
                    }

                    if (!url.includes('twitter.com')) {
                        log.debug('Non twitter.com url', { url, contentType });
                        return;
                    }

                    if (!url) {
                        signal.reject(new Error('response url is null'));
                        return;
                    }

                    /** @type {any} */
                    const data = (await res.json());

                    if (!data) {
                        signal.reject(new Error('data is invalid'));
                        return;
                    }

                    /**
                     * @type {any}
                     */
                    let payload = null;

                    if (
                        (url.includes('/search/adaptive')
                        || url.includes('/timeline/profile')
                        || url.includes('/live_event/timeline')
                        || url.includes('/topics/')
                        || url.includes('/timeline/conversation'))
                        && data.globalObjects
                    ) {
                        payload = data.globalObjects;
                    }

                    const timeline = data?.data?.user?.result?.timeline_v2?.timeline
                        ?? data?.data?.user?.result?.timeline?.timeline;

                    if (url.includes('/UserTweets') && timeline?.instructions?.length) {
                        payload = getTimelineInstructions(timeline.instructions);
                    }

                    if (url.includes('/TweetDetail') && data?.data?.threaded_conversation_with_injections?.instructions?.length) {
                        payload = getTimelineInstructions(data.data.threaded_conversation_with_injections.instructions);
                    }

                    if (url.includes('/live_event/') && data.twitter_objects) {
                        payload = data.twitter_objects;
                    }

                    if (url.includes('/TopicLandingPage') && data?.data?.topic_by_rest_id?.topic_page?.body?.timeline?.instructions?.length) {
                        payload = getTimelineInstructions(data.data.topic_by_rest_id.topic_page.body.timeline.instructions);
                    }

                    if (payload) {
                        if (!isUserSearch) {
                            await extendOutputFunction(payload, {
                                request,
                                page,
                                isUserSearch,
                            });
                        } else if (request.userData.label === LABELS.SEARCH && payload?.users) {
                            const users = Object.values(payload.users);

                            let count = 0;
                            /* eslint-disable camelcase */
                            for (const { screen_name } of users) {
                                if (screen_name) {
                                    const req = await addProfile(screen_name, mode === 'replies');

                                    if (!req?.wasAlreadyPresent) {
                                        count++;
                                    }
                                }
                            }
                            /* eslint-enable camelcase */
                            if (count) {
                                log.info(`Added ${count} profiles to scrape, extracting ${input.tweetsDesired} tweets from each`);
                            }
                        }
                    }

                    await extendScraperFunction(payload, {
                        request,
                        page,
                        response,
                        url,
                        label: 'response',
                        signal,
                        isUserSearch,
                    });

                    // ignore the terminate command if not related to tweets
                    if (payload) {
                        const instructions = _.get(data, 'timeline.instructions', []);

                        for (const i of instructions) {
                            if (i && i.terminateTimeline === true) {
                                signal.resolve();
                                break;
                            }
                        }
                    }
                } catch (err) {
                    log.debug(err.message, { request: request.userData });

                    signal.reject(err);
                }
            });

            try {
                await page.waitForFunction(() => {
                    return typeof window.__SCRIPTS_LOADED__ === 'object'
                        && Object.values(window.__SCRIPTS_LOADED__).length
                        && Object.values(window.__SCRIPTS_LOADED__).every((e) => e === true);
                }, {
                    timeout: 30000,
                });

                await page.waitForSelector('header', {
                    timeout: 30000,
                });
            } catch (e) {
                log.debug(e.message, { url: request.url });

                throw new Error('Scripts did not load properly');
            }

            // move the layout away so it doesn't hover over the scrolling items
            await page.evaluate(() => {
                const header = document.querySelector('header');
                if (header) {
                    header.style.width = '100px !important';
                    header.style.flexGrow = '0';
                }
            });

            let lastCount = requestCounts.currentCount(request);

            const intervalFn = (withCount = -1) => {
                if (lastCount === withCount || lastCount !== requestCounts.currentCount(request)) {
                    lastCount = requestCounts.currentCount(request);
                    log.info(`Extracted ${lastCount} tweets from ${request.url}`);
                }
            };

            const displayStatus = setInterval(intervalFn, 5000);

            try {
                if (!response || !response.ok()) {
                    await retire();
                    throw new Error('Page response is invalid');
                }

                if (await page.$('[name="failedScript"]')) {
                    await retire();
                    throw new Error('Failed to load page scripts, retrying...');
                }

                const failedToLoad = await page.$$eval('[data-testid="primaryColumn"] svg ~ span:not(:empty)', (els) => {
                    return els.some((el) => el.innerHTML.includes('Try again'));
                });

                if (failedToLoad) {
                    await retire();
                    throw new Error('Failed to load page tweets, retrying...');
                }

                await extendScraperFunction(undefined, {
                    page,
                    request,
                    label: 'before',
                    signal,
                });

                await Promise.race([
                    infiniteScroll({
                        page,
                        maxIdleTimeoutSecs,
                        isDone: () => (page.isClosed() || signal.isResolved || requestCounts.isDone(request)),
                    }),
                    signal.promise,
                ]);
            } finally {
                signal.resolve();
                clearInterval(displayStatus);

                page.removeAllListeners('response');
                page.removeAllListeners('request');

                await extendScraperFunction(undefined, {
                    page,
                    request,
                    label: 'after',
                    signal,
                });

                log.info(`Finished with ${request.url}`);
                intervalFn(0);
            }
        },
    });

    log.info('Starting scraper');

    await crawler.run();
    await extendScraperFunction(undefined, {
        label: 'finish',
    });

    log.info('All finished');
});
