import pysolr
import pandas as pd
from datetime import datetime

# SOLR_PATH='http://solr:8983/solr/'
SOLR_PATH = 'http://localhost:8888/solr/reddit_comment_core/'  # format of the path should be localhost:port/core_name
solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
solr.ping()

tweets = pd.read_csv('reddit_comments_v2.csv')

data = [{"id": index, "text": row["body"], "created_date":row['created_utc'], \
        "score": row["score"], \
        "permalink": "https://www.redditmedia.com" + row["permalink"] + "?ref_source=embed&amp;ref=share&amp;embed=true"}
        for index, row in tweets.iterrows()]

print(solr.add(data))

