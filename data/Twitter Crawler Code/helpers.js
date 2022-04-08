const Apify = require('apify');
const vm = require('vm');
const Puppeteer = require('puppeteer'); // eslint-disable-line no-unused-vars
const moment = require('moment');
const _ = require('lodash');
const { LABELS } = require('./constants');

const { log, sleep } = Apify.utils;

/**
 * @param {any} user
 * @param {string} id
 */
const tweetToUrl = (user, id) => {
    return `https://twitter.com/${_.get(user, 'screen_name')}/status/${id}`;
};

/**
 * @param {string} url
 */
const categorizeUrl = (url) => {
    if (!url || !/^https:\/\/(mobile|www)?\.?twitter\.com\//i.test(url)) {
        throw new Error(`Invalid url ${url}`);
    }

    const nUrl = new URL(url, 'https://twitter.com');

    if (nUrl.pathname === '/search' || nUrl.pathname.startsWith('/hashtag/')) {
        return LABELS.SEARCH;
    }

    if (/\/[a-zA-Z0-9_]{1,15}\/status\/\d+/.test(nUrl.pathname)) {
        return LABELS.STATUS;
    }

    if (/\/i\/events\/\d+/.test(nUrl.pathname)) {
        return LABELS.EVENTS;
    }

    if (/\/i\/topics\/\d+/.test(nUrl.pathname)) {
        return LABELS.TOPIC;
    }

    if (/^\/[a-zA-Z0-9_]{1,15}(\/|$)/.test(nUrl.pathname)) {
        return LABELS.HANDLE;
    }

    throw new Error(`Url ${url} didn't match any supported type. You can provide search, events and profile urls`);
};

/**
 * @param {Apify.RequestQueue} requestQueue
 */
const createAddProfile = (requestQueue) => async (handle, replies = false) => {
    if (!handle) {
        return;
    }

    const isUrl = `${handle}`.includes('twitter.com');

    return requestQueue.addRequest({
        url: isUrl
            ? handle
            : `https://twitter.com/${cleanupHandle(handle)}${replies ? '/with_replies' : ''}`,
        userData: {
            label: LABELS.HANDLE,
            handle: cleanupHandle(handle),
        },
    });
};

/**
 * @param {Apify.RequestQueue} requestQueue
 */
const createAddThread = (requestQueue) => async (thread) => {
    if (!thread) {
        return;
    }

    const isUrl = `${thread}`.includes('twitter.com');

    return requestQueue.addRequest({
        url: isUrl
            ? thread
            : `https://twitter.com/i/status/${thread}`,
        userData: {
            label: LABELS.STATUS,
            thread,
        },
    });
};

/**
 * @param {Apify.RequestQueue} requestQueue
 */
const createAddTopic = (requestQueue) => async (topic) => {
    if (!topic) {
        return;
    }

    const isUrl = `${topic}`.includes('twitter.com');

    return requestQueue.addRequest({
        url: isUrl
            ? topic
            : `https://twitter.com/i/topics/${topic}`,
        userData: {
            label: LABELS.TOPIC,
            topic,
        },
    });
};

/**
 * @param {Apify.RequestQueue} requestQueue
 */
const createAddSearch = (requestQueue) => async (search, mode) => {
    if (!search) {
        return;
    }

    const isUrl = `${search}`.includes('twitter.com');

    return requestQueue.addRequest({
        url: isUrl
            ? search
            : `https://twitter.com/search?q=${encodeURIComponent(search)}&src=typed_query${mode ? `&f=${mode}` : ''}`,
        userData: {
            label: LABELS.SEARCH,
            search: !isUrl
                ? search
                : new URL(search, 'https://twitter.com').searchParams.get('q'),
        },
    });
};

/**
 * @param {Apify.RequestQueue} requestQueue
 */
const createAddEvent = (requestQueue) => async (event) => {
    if (!event) {
        return;
    }

    const isUrl = `${event}`.includes('twitter.com');

    return requestQueue.addRequest({
        url: isUrl
            ? event
            : `https://twitter.com/i/events/${event}`,
        userData: {
            label: LABELS.EVENTS,
            event: !isUrl
                ? event
                : new URL(event, 'https://twitter.com').pathname.split('/events/', 2)[1],
        },
    });
};

/**
 * @param {*} value
 * @returns
 */
const parseTimeUnit = (value) => {
    if (!value) {
        return null;
    }

    if (value === 'today' || value === 'yesterday') {
        return (value === 'today' ? moment() : moment().subtract(1, 'day')).startOf('day');
    }

    const [, number, unit] = `${value}`.match(/^(\d+)\s?(minute|second|day|hour|month|year|week)s?$/i) || [];

    if (+number && unit) {
        return moment().subtract(+number, unit);
    }

    return moment(value);
};

/**
 * @typedef MinMax
 * @property {number | string} [min]
 * @property {number | string} [max]
 */

/**
 * @typedef {ReturnType<typeof minMaxDates>} MinMaxDates
 */

/**
 * Generate a function that can check date intervals depending on the input
 * @param {MinMax} param
 */
const minMaxDates = ({ min, max }) => {
    const minDate = parseTimeUnit(min);
    const maxDate = parseTimeUnit(max);

    if (minDate && maxDate && maxDate.diff(minDate) < 0) {
        throw new Error(`Minimum date ${minDate.toString()} needs to be less than max date ${maxDate.toString()}`);
    }

    return {
        /**
         * cloned min date, if set
         */
        get minDate() {
            return minDate?.clone();
        },
        /**
         * cloned max date, if set
         */
        get maxDate() {
            return maxDate?.clone();
        },
        /**
         * compare the given date/timestamp to the time interval
         * @param {string | number} time
         */
        compare(time) {
            const base = moment(time);
            return (minDate ? minDate.diff(base) <= 0 : true) && (maxDate ? maxDate.diff(base) >= 0 : true);
        },
    };
};

/**
 * @param {string} handle
 */
const cleanupHandle = (handle) => {
    const matches = handle.match(/^(?:https:\/\/(mobile|www)?\.?twitter\.com\/|@)?(?<HANDLE>[a-zA-Z0-9_]{1,15})$/);

    if (!matches || !matches.groups || !matches.groups.HANDLE) {
        throw new Error(`Invalid handle provided: ${handle}`);
    }

    return matches.groups.HANDLE;
};

const blockPatterns = [
    '.jpg',
    '.ico',
    '.jpeg',
    '.gif',
    '.svg',
    '.png',
    'pbs.twimg.com/semantic_core_img',
    'pbs.twimg.com/profile_banners',
    'pbs.twimg.com/media',
    'pbs.twimg.com/card_img',
    'www.google-analytics.com',
    'branch.io',
    '/guide.json',
    '/client_event.json',
    '/amplify_video/',
    '/ext_tw_video/',
    'help/settings',
    'help/settings',
    '/broadcasts/show.json',
];

const ignoreRequest = [
    'badge_count.json',
    'notifications',
    '/promoted_content/',
    '/live_pipeline/',
    '/jot/',
    '/ext_tw_video/',
    'client_event.json',
    '/guide.json',
    'update_subscriptions',
];

/**
 * Check if the url is blocked, need to check it on request, as
 * the request blocked by blockRequests won't be able to be
 * differentiated
 *
 * @param {string} url
 */
const isBlockedUrl = (url) => {
    const includes = (pattern) => url.includes(pattern);

    return blockPatterns.some(includes)
        || ignoreRequest.some(includes);
};

/**
 * @param {{
 *  page: Puppeteer.Page,
 *  maxIdleTimeoutSecs?: number,
 *  isDone: () => boolean,
 *  waitForDynamicContent?: number,
 * }} params
 */
const infiniteScroll = async ({ page, isDone, maxIdleTimeoutSecs = 20, waitForDynamicContent = 16 }) => {
    let finished = false;

    const maybeResourceTypesInfiniteScroll = ['xhr', 'fetch', 'websocket', 'other'];
    const resourcesStats = {
        newRequested: 0,
        oldRequested: 0,
        matchNumber: 0,
        lastRequested: Date.now(),
    };

    /**
     * @param {Puppeteer.HTTPRequest} msg
     */
    const getRequest = (msg) => {
        try {
            if (maybeResourceTypesInfiniteScroll.includes(msg.resourceType()) && !isBlockedUrl(msg.url())) {
                resourcesStats.newRequested++;
                resourcesStats.lastRequested = Date.now();
                log.debug('New requested', resourcesStats);
            }
        } catch (e) { }
    };

    page.on('request', getRequest);

    const checkForMaxTimeout = () => {
        if (resourcesStats.oldRequested === resourcesStats.newRequested) {
            resourcesStats.matchNumber++;
            if (resourcesStats.matchNumber >= waitForDynamicContent) {
                finished = true;
            }
        } else {
            resourcesStats.matchNumber = 0;
            resourcesStats.oldRequested = resourcesStats.newRequested;
        }

        if (maxIdleTimeoutSecs !== 0 && (Date.now() - resourcesStats.lastRequested) > maxIdleTimeoutSecs * 1000) {
            log.warning(`No data was received after ${maxIdleTimeoutSecs}s`);
            finished = true;
        }

        if (!finished) {
            setTimeout(checkForMaxTimeout, 3000);
        }
    };

    checkForMaxTimeout();

    const scrollHeight = await page.evaluate(() => window.innerHeight);

    while (!finished) {
        try {
            await page.evaluate(async (height) => {
                window.scrollBy(0, height);
            }, scrollHeight);

            try {
                while (true) {
                    const buttons = await page.$x('//*[@role="button" and contains(.,"Show") and not(@aria-label)]'); // Show replies / Show more replies / Show buttons

                    for (const button of buttons) {
                        if (isDone()) {
                            break;
                        }
                        await sleep(2000);
                        if (isDone()) {
                            break;
                        }
                        await button.click();
                    }

                    if (!buttons.length) {
                        break;
                    }
                }
            } catch (e) {
                log.debug(`Wait for response, ${e.message}`);
            }

            if (isDone()) {
                finished = true;
            } else {
                await sleep(700);
            }
        } catch (e) {
            log.debug(e);
            if (!page.isClosed()) {
                page.off('request', getRequest); // Target closed
            }
            finished = true;
        }
    }

    log.debug('Stopped scrolling');
};

/**
 * @template T
 * @typedef {T & { Apify: Apify, customData: any, request: Apify.Request }} PARAMS
 */

/**
 * Compile a IO function for mapping, filtering and outputing items.
 * Can be used as a no-op for interaction-only (void) functions on `output`.
 * Data can be mapped and filtered twice.
 *
 * Provided base map and filter functions is for preparing the object for the
 * actual extend function, it will receive both objects, `data` as the "raw" one
 * and "item" as the processed one.
 *
 * Always return a passthrough function if no outputFunction provided on the
 * selected key.
 *
 * @template RAW
 * @template {{ [key: string]: any }} INPUT
 * @template MAPPED
 * @template {{ [key: string]: any }} HELPERS
 * @param {{
 *  key: string,
 *  map?: (data: RAW, params: PARAMS<HELPERS>) => Promise<MAPPED>,
 *  output?: (data: MAPPED, params: PARAMS<HELPERS> & { data: RAW, item: MAPPED }) => Promise<void>,
 *  filter?: (obj: { data: RAW, item: MAPPED }, params: PARAMS<HELPERS>) => Promise<boolean>,
 *  input: INPUT,
 *  helpers: HELPERS,
 * }} params
 * @return {Promise<(data: RAW, args?: Record<string, any>) => Promise<void>>}
 */
const extendFunction = async ({
    key,
    output,
    filter,
    map,
    input,
    helpers,
}) => {
    /**
     * @type {PARAMS<HELPERS>}
     */
    const base = {
        ...helpers,
        Apify,
        customData: input.customData || {},
    };

    const evaledFn = (() => {
        // need to keep the same signature for no-op
        if (typeof input[key] !== 'string' || input[key].trim() === '') {
            return new vm.Script('({ item }) => item');
        }

        try {
            return new vm.Script(input[key], {
                lineOffset: 0,
                produceCachedData: false,
                displayErrors: true,
                filename: `${key}.js`,
            });
        } catch (e) {
            throw new Error(`"${key}" parameter must be a function`);
        }
    })();

    /**
     * Returning arrays from wrapper function split them accordingly.
     * Normalize to an array output, even for 1 item.
     *
     * @param {any} value
     * @param {any} [args]
     */
    const splitMap = async (value, args) => {
        const mapped = map ? await map(value, args) : value;

        if (!Array.isArray(mapped)) {
            return [mapped];
        }

        return mapped;
    };

    return async (data, args) => {
        const merged = { ...base, ...args };

        for (const item of await splitMap(data, merged)) {
            if (filter && !(await filter({ data, item }, merged))) {
                continue; // eslint-disable-line no-continue
            }

            const result = await (evaledFn.runInThisContext()({
                ...merged,
                data,
                item,
            }));

            for (const out of (Array.isArray(result) ? result : [result])) {
                if (output) {
                    if (out !== null) {
                        await output(out, { ...merged, data, item });
                    }
                    // skip output
                }
            }
        }
    };
};

/**
 * @param {number} count
 */
const requestCounter = async (count) => {
    /** @type {Record<string, number>} */
    const countState = /** @type {any} */(await Apify.getValue('COUNT')) || {};

    const persistState = async () => {
        await Apify.setValue('COUNT', countState);
    };

    Apify.events.on('persistState', persistState);

    return {
        /** @param {Apify.Request} request */
        currentCount(request) {
            return countState[request.id] || 0;
        },
        /** @param {Apify.Request} request */
        increaseCount(request, increment = 1) {
            countState[request.id] = (countState[request.id] || 0) + increment;
        },
        /** @param {Apify.Request} request */
        isDone(request) {
            return countState[request.id] >= count;
        },
    };
};

const deferred = () => {
    let isResolved = false;
    /** @type {(res?: any) => void} */
    let resolve = () => {};
    /** @type {(err: Error) => void} */
    let reject = () => {};

    const promise = new Promise((r1, r2) => {
        resolve = (res) => {
            if (!isResolved) {
                isResolved = true;
                setTimeout(() => {
                    r1(res);
                });
            }
        };
        reject = (err) => {
            if (!isResolved) {
                isResolved = true;
                setTimeout(() => {
                    r2(err);
                });
            }
        };
    });

    return {
        resolve,
        reject,
        get isResolved() {
            return isResolved;
        },
        promise,
    };
};

/**
 * @param {any} tweet
 */
const getEntities = (tweet) => {
    const entities = _.get(tweet, 'entities', {});

    return {
        hashtags: _.get(entities, 'hashtags', []).map(({ text }) => text).filter(Boolean),
        symbols: _.get(entities, 'symbols', []).map(({ text }) => text).filter(Boolean),
        user_mentions: _.get(entities, 'user_mentions', []).map((user) => _.omit(user, ['id', 'indices'])).filter(Boolean),
        urls: _.get(entities, 'urls', []).map((url) => _.pick(url, ['url', 'expanded_url', 'display_url'])).filter(Boolean),
    };
};

/**
 * Do a generic check when using Apify Proxy
 *
 * @typedef params
 * @property {any} [params.proxyConfig] Provided apify proxy configuration
 * @property {boolean} [params.required] Make the proxy usage required when running on the platform
 * @property {string[]} [params.blacklist] Blacklist of proxy groups, by default it's ['GOOGLE_SERP']
 * @property {boolean} [params.force] By default, it only do the checks on the platform. Force checking regardless where it's running
 * @property {string[]} [params.hint] Hint specific proxy groups that should be used, like SHADER or RESIDENTIAL
 *
 * @param {params} params
 * @returns {Promise<Apify.ProxyConfiguration | undefined>}
 */
const proxyConfiguration = async ({
    proxyConfig,
    required = true,
    force = Apify.isAtHome(),
    blacklist = ['GOOGLESERP'],
    hint = [],
}) => {
    const configuration = await Apify.createProxyConfiguration(proxyConfig);

    // this works for custom proxyUrls
    if (Apify.isAtHome() && required) {
        if (!configuration || (!configuration.usesApifyProxy && (!configuration.proxyUrls || !configuration.proxyUrls.length)) || !configuration.newUrl()) {
            throw new Error('\n=======\nYou must use Apify proxy or custom proxy URLs\n\n=======');
        }
    }

    // check when running on the platform by default
    if (force) {
        // only when actually using Apify proxy it needs to be checked for the groups
        if (configuration && configuration.usesApifyProxy) {
            if (blacklist.some((blacklisted) => (configuration.groups || []).includes(blacklisted))) {
                throw new Error(`\n=======\nThese proxy groups cannot be used in this actor. Choose other group or contact support@apify.com to give you proxy trial:\n\n*  ${blacklist.join('\n*  ')}\n\n=======`);
            }

            // specific non-automatic proxy groups like RESIDENTIAL, not an error, just a hint
            if (hint.length && !hint.some((group) => (configuration.groups || []).includes(group))) {
                Apify.utils.log.info(`\n=======\nYou can pick specific proxy groups for better experience:\n\n*  ${hint.join('\n*  ')}\n\n=======`);
            }
        }
    }

    return configuration;
};

/**
 * Filter important cookies
 *
 * @param {Puppeteer.Cookie[] | Array<Puppeteer.Cookie[]>} cookies
 */
const filterCookies = (cookies) => {
    if (!cookies?.length || !Array.isArray(cookies)) {
        return [];
    }

    if (Array.isArray(cookies[0])) {
        if (!cookies[0].length) {
            return [];
        }

        // pick one from an array of arrays of cookies
        return filterCookies(cookies[Math.round(Math.random() * 1000) % cookies.length]);
    }

    return cookies
        .filter(({ name }) => ['auth_token', 'guest_id', 'remember_checked_on', 'twid', 'lang'].includes(name))
        .map(({ id, storeId, expirationDate, ...rest }) => ({
            ...rest,
            domain: '.twitter.com',
        }));
};

/**
 * Get deep entries from GraphQL response
 *
 * @param {any[]} instructions
 */
const getTimelineInstructions = (instructions) => {
    if (!instructions?.length) {
        return null;
    }

    const timelineAddEntries = instructions.filter(({ type }) => ['TimelinePinEntry', 'TimelineAddEntries'].includes(type));

    // the format is really weird and we need to flatten it and make it
    // compatible with the globalObject format
    /** @type {{ tweets: Record<string, any>, users: Record<string, any> }} */
    const globalObject = {
        tweets: {},
        users: {},
    };

    /**
     *
     * @param {{
     *   userId?: string,
     *   tweet: Record<string, any>,
     *   sortIndex?: number
     * }} param0
     */
    const extractInfo = ({ userId, tweet, sortIndex }) => {
        if (userId && tweet && sortIndex) {
            globalObject.tweets[sortIndex] = tweet.legacy;
            globalObject.users[userId] = globalObject.users[userId]
                ?? tweet?.core?.user?.legacy
                ?? tweet?.core?.user_results?.result?.legacy;

            if (globalObject.users[userId]) {
                globalObject.users[userId].id_str = userId;
            }
        }
    };

    for (const { type, entries, entry } of timelineAddEntries) {
        switch (type) {
            case 'TimelinePinEntry': {
                const tweet = entry?.content?.itemContent?.tweet_results?.result;

                extractInfo({
                    tweet,
                    userId: tweet?.core?.user?.rest_id,
                    sortIndex: entry.sortIndex,
                });
                break;
            }
            case 'TimelineAddEntries': {
                for (const { sortIndex, content } of (entries || [])) {
                    if (content?.entryType === 'TimelineTimelineItem') {
                        const tweet = content.itemContent?.tweet_results?.result;

                        extractInfo({
                            tweet,
                            userId: tweet?.legacy?.user_id_str ?? tweet?.core?.user?.rest_id,
                            sortIndex,
                        });
                    } else if (content?.entryType === 'TimelineTimelineModule') {
                        if (content?.items?.length) {
                            for (const { item } of content.items) {
                                const tweet = item?.itemContent?.tweet_results?.result;

                                extractInfo({
                                    tweet,
                                    sortIndex,
                                    userId: tweet?.core?.user?.rest_id ?? tweet?.core?.user_results?.result?.rest_id,
                                });
                            }
                        }
                    }
                }
                break;
            }
            default:
                log.debug('Unknown entry', { type, entries, entry });
        }
    }

    return globalObject;
};

module.exports = {
    minMaxDates,
    extendFunction,
    infiniteScroll,
    cleanupHandle,
    proxyConfiguration,
    requestCounter,
    categorizeUrl,
    createAddProfile,
    createAddSearch,
    createAddEvent,
    createAddThread,
    createAddTopic,
    tweetToUrl,
    deferred,
    getEntities,
    filterCookies,
    getTimelineInstructions,
    blockPatterns,
};
