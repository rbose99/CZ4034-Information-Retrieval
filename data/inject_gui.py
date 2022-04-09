import os
import pysolr
import pandas as pd

from argparse import ArgumentParser

parser = ArgumentParser()
parser.add_argument("--source", type=str, required=True, help="where is the data scraped from, to decide which core to insert it in")
args = parser.parse_args()

data = pd.read_csv('scraped_data.csv')

if args.source == "twitter":
    SOLR_PATH = 'http://localhost:8888/solr/twitter_core/'  # format of the path should be localhost:port/core_name
    solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
    solr.ping()

    offset = len(solr.search("*:*")['response']['docs'])

    data = [{"id": offset + index, "text": row["full_text"], "date":row["created_at"], \
            "likes": row["favorite_count"], "reply_count": row["reply_count"], \
            "retweet_count": row["retweet_count"], "url": row["url"], "user_name": row["url"].split("/")[3], \
            "user_profile_url": "https://www.twitter.com/" + row["url"].split("/")[3], \
            "tweet_id": row["url"].split("/")[-1], "subjectivity": row["subjectivity"], \
            "polarity": row["polarity"], "sarcasm": row["sarcasm"]} \
            for index, row in data.iterrows()]

    print(solr.add(data))

if args.source == "reddit_posts":
    SOLR_PATH = 'http://localhost:8888/solr/reddit_post_core/'  # format of the path should be localhost:port/core_name
    solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
    solr.ping()

    offset = len(solr.search("*:*")['response']['docs'])

    data = [{"id": offset + index, "text": row["Title"], "date": row["created_utc"], \
            "likes": row["score"], "num_comments": row["num_comments"], \
            "url": row["full_link"], "author": row["author"], \
            "user_profile_url": "https://www.reddit.com/user/" + str(row["author"]), \
            "subjectivity": "1", "polarity": "1", "sarcasm": "0"} \
            for index, row in data.iterrows()]

    print(solr.add(data))

else:
    SOLR_PATH = 'http://localhost:8888/solr/reddit_comment_core/'  # format of the path should be localhost:port/core_name
    solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
    solr.ping()

    offset = len(solr.search("*:*")['response']['docs'])

    data = [{"id": offset + index, "text": row["body"], "date": row['created_utc'], \
            "likes": row["score"], "author": row["author"], \
            "url": "https://www.reddit.com" + str(row["permalink"]), \
            "user_profile_url": "https://www.reddit.com/user/" + str(row["author"]), \
            "subjectivity": row["subjectivity"], "polarity": row["polarity"], "sarcasm": row["sarcasm"]}
            for index, row in data.iterrows()]

    print(solr.add(data))




