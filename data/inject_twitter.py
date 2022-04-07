import pysolr
import pandas as pd

# SOLR_PATH='http://solr:8983/solr/'
SOLR_PATH = 'http://localhost:8888/solr/twitter_core/'  # format of the path should be localhost:port/core_name
solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
solr.ping()

tweets = pd.read_csv('./Twitter crawled/dataset_twitter-scraper_2022-03-31_06-07-23-459.csv')

data = [{"id": index, "text": row["full_text"], "created_date":row["created_at"], \
        "score": row["favorite_count"], "reply_count": row["reply_count"], \
        "retweet_count": row["retweet_count"], 
        "url": row["url"], "tweet_id": row["url"].split("/")[-1]} \
        for index, row in tweets.iterrows()]

print(solr.add(data))

# print(data)

