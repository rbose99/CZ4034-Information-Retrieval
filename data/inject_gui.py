import os
import pysolr
import pandas as pd

from argparse import ArgumentParser

from preprocess import reddit_comments, reddit_posts, tweets

parser = ArgumentParser()
parser.add_argument("--source", type=str, required=True, help="where is the data scraped from, to decide which core to insert it in")
args = parser.parse_args()

data = pd.read_csv('scraped_data.csv')

if args.source == "Twitter":
    data = tweets(data)

    SOLR_PATH = 'http://localhost:8888/solr/twitter_core/'  # format of the path should be localhost:port/core_name
    solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
    solr.ping()

    offset = solr.search("*:*")['response']['numFound']

    data = [{"id": offset + index, "text": row["full_text"], "date":row["created_at"], \
            "likes": row["favorite_count"], \
            "retweet_count": row["retweet_count"], "url": row["url"], "user_name": row["url"].split("/")[3], \
            "user_profile_url": "https://www.twitter.com/" + row["url"].split("/")[3], \
            "tweet_id": row["url"].split("/")[-1], "subjectivity": row["subjectivity"], \
            "polarity": row["polarity"], "sarcasm": row["sarcasm"]} \
            for index, row in data.iterrows()]

    print(solr.add(data))

elif args.source == "Reddit Posts":
    data = reddit_posts(data)

    SOLR_PATH = 'http://localhost:8888/solr/reddit_post_core/'  # format of the path should be localhost:port/core_name
    solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
    solr.ping()

    offset = solr.search("*:*")['response']['numFound']

    data = [{"id": offset + index, "text": row["title"], "date": row["created_utc"], \
            "likes": row["score"], "num_comments": row["num_comments"], \
            "url": row["full_link"], "author": row["author"], \
            "user_profile_url": "https://www.reddit.com/user/" + str(row["author"]), \
            "subjectivity": row["subjectivity"], "polarity": row["polarity"], "sarcasm": row["sarcasm"]} \
            for index, row in data.iterrows()]

    print(solr.add(data))

else:
    data = reddit_comments(data)

    SOLR_PATH = 'http://localhost:8888/solr/reddit_comment_core/'  # format of the path should be localhost:port/core_name
    solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
    solr.ping()

    offset = solr.search("*:*")['response']['numFound']

    data = [{"id": offset + index, "text": row["body"], "date": row['created_utc'], \
            "likes": row["score"], "author": row["author"], \
            "url": "https://www.reddit.com" + str(row["permalink"]), \
            "user_profile_url": "https://www.reddit.com/user/" + str(row["author"]), \
            "subjectivity": row["subjectivity"], "polarity": row["polarity"], "sarcasm": row["sarcasm"]}
            for index, row in data.iterrows()]

    print(solr.add(data))




