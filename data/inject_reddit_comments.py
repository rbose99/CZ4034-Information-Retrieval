import pysolr
import pandas as pd
from datetime import datetime

# SOLR_PATH='http://solr:8983/solr/'
SOLR_PATH = 'http://localhost:8888/solr/reddit_comment_core/'  # format of the path should be localhost:port/core_name
solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
solr.ping()

tweets = pd.read_csv('Reddit7k_comments.csv')

data = [{"id": index, "body": row["body"], "created_date":index, \
        "upvote_count": row["score"], \
        "permalink": "https://www.redditmedia.com" + row["permalink"] + "?ref_source=embed&amp;ref=share&amp;embed=true"}
        for index, row in tweets.iterrows()]

# data = [{"id": index, "tweet": row["text"], "user_location": row["user_location"], "link": row["url"],  \
#     "user_geo": list(map(float, row["user_geo"].strip("()").split(","))), \
#     "toxicity": row["toxicity"], "subjectivity": row["subjectivity"]} \
#     for index, row in tweets.iterrows()]

print(solr.add(data))

