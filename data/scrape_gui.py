from argparse import ArgumentParser

parser = ArgumentParser()
parser.add_argument("--source", type=str, required=True, help="where is the data scraped from, to decide which core to insert it in")
args = parser.parse_args()

if args.source == "Twitter":
    import tweepy
    import pandas as pd
    import time

    consumer_key = 'j0L4sb2JIyYFOCqCwYJJ8nzgK'
    consumer_secret = 'WO5qzQr9FBhLpr54tH8kstMqGt82GOvn5obvEHDhVieTfhVE8T'
    access_token = '1324541294-Vp8ZM5NvqE5syysrZSmAjCNoiy4Dmwk4PSgkfr5'
    access_secret = 'qCpp45efGFxvVV2CQVmyjZ3mwyTSWBiaPnq9lrJkrPDYD'


    auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
    auth.set_access_token(access_token, access_secret)
    api = tweepy.API(auth,wait_on_rate_limit=True)

    text_query = '(NFT) -giveaway -Giveaway -whitelist -drop -enter -Whitelist -WL -WLs -wl -airdrop -Airdrop -Mint min_retweets:30'
    count = 100
    try:
        # Creation of query method using parameters
        tweets = tweepy.Cursor(api.search_tweets,q=text_query).items(count)
 
        # Pulling information from tweets iterable object
        tweets_list = [[tweet.created_at, tweet.favorite_count, tweet.retweet_count, tweet.text, 'https://www.twitter.com/'+str(tweet.user.screen_name)+'/status/' + str(tweet.id)] for tweet in tweets]
 
        # Creation of dataframe from tweets list
        # Add or remove columns as you remove tweet information
        tweets_df = pd.DataFrame.from_records(tweets_list,columns=['created_at','favorite_count','retweet_count','full_text','url'])
 
    except BaseException as e:
        print('failed on_status,',str(e))
        time.sleep(3)
    tweets_df.to_csv('./scraped_data.csv')

elif args.source == "Reddit Posts":
    import pandas as pd
    from pmaw import PushshiftAPI
    api = PushshiftAPI()
    api_request_generator = api.search_submissions(q='(NFT)|(NFTs)|(non-fungible token)|(non-fungible-tokens)|(non-fungible-token)|(nft)|(nfts)',  limit=100)
    missy_submissions = pd.DataFrame(list(api_request_generator))
    missy_submissions.to_csv('./scraped_data.csv',encoding='utf-8',index=False,header=True,columns=list(missy_submissions.axes[1]))
else:
    import pandas as pd
    from pmaw import PushshiftAPI
    api = PushshiftAPI()
    limit = 500
    query = '(NFT)|(NFTs)|(non-fungible token)|(non-fungible-tokens)|(non-fungible-token)|(nft)|(nfts)|(NFTs are)|(nfts are)'
    comments_list = list(api.search_comments(q=query, limit=limit))
    comments_list = comments_list[0:101]
    comments_df = pd.DataFrame(comments_list)
    comments_df['length'] = comments_df.body.str.len()
    comments_df = comments_df[comments_df.length <= 500]
    comments_df = comments_df.drop_duplicates(subset=['body'])
    comments_df.to_csv('./scraped_data.csv', encoding='utf-8', header=True, index=False, columns=list(comments_df.axes[1]))