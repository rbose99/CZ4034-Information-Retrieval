import os
import pysolr
import pandas as pd

# SOLR_PATH='http://solr:8983/solr/'
SOLR_PATH = 'http://localhost:8888/solr/twitter_core/'  # format of the path should be localhost:port/core_name
solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
solr.ping()

tweets = pd.read_csv('Twitter_Crawled_Final_Cleaned_labelled.csv')

data = [{"id": index, "text": row["full_text"], "date":row["created_at"], \
        "score": row["favorite_count"], "reply_count": row["reply_count"], \
        "retweet_count": row["retweet_count"], "url": row["url"], "user_name": row["url"].split("/")[3], \
        "user_profile_url": "https://www.twitter.com/" + row["url"].split("/")[3], \
        "tweet_id": row["url"].split("/")[-1], "subjectivity": row["subjectivity"], \
        "polarity": row["polarity"], "sarcasm": row["sarcasm"]} \
        for index, row in tweets.iterrows()]

print(solr.add(data))

# print(data)

