import pysolr
import pandas as pd

# SOLR_PATH='http://solr:8983/solr/'
SOLR_PATH = 'http://localhost:8888/solr/reddit_post_core/'  # format of the path should be localhost:port/core_name
solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
solr.ping()

posts = pd.read_csv('Reddit_Posts_1k.csv')

data = [{"id": index, "text": row["Title"], "date": index, \
        "score": row["score"], "num_comments": row["num_comments"], \
        "full_url": row["full_link"], \
        "permalink": "https://www.redditmedia.com" + str(row["permalink"]) + "?ref_source=embed&amp;ref=share&amp;embed=true",
        "subjectivity": "1", \
        "polarity": "1", "sarcasm": "0"} \
        for index, row in posts.iterrows()]

print(solr.add(data))

