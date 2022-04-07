import pysolr
import pandas as pd

# SOLR_PATH='http://solr:8983/solr/'
SOLR_PATH = 'http://localhost:8888/solr/reddit_post_core/'  # format of the path should be localhost:port/core_name
solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
solr.ping()

posts = pd.read_csv('7k_redditposts.csv')

data = [{"id": index, "title": row["title"], "created_date": index, \
        "upvote": row["upvote_ratio"], "num_comments": row["num_comments"], \
        "full_url": row["full_link"], \
        "permalink": "https://www.redditmedia.com" + str(row["permalink"]) + "?ref_source=embed&amp;ref=share&amp;embed=true"} \
        for index, row in posts.iterrows()]

# data = [{"id": index, "tweet": row["text"], "user_location": row["user_location"], "link": row["url"],  \
#     "user_geo": list(map(float, row["user_geo"].strip("()").split(","))), \
#     "toxicity": row["toxicity"], "subjectivity": row["subjectivity"]} \
#     for index, row in tweets.iterrows()]

print(solr.add(data))

