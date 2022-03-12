import pysolr
import pandas as pd

# SOLR_PATH='http://solr:8983/solr/'
SOLR_PATH = 'http://localhost:8889/solr/test_core/'  # format of the path should be localhost:port/core_name
solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
solr.ping()

tweets = pd.read_csv('sample_data.csv')

data = [{"id": index, "tweet": row["text"], "user_location": row["user_location"], "link": row["url"],  \
    "user_geo": list(map(float, row["user_geo"].strip("()").split(","))), \
    "toxicity": row["toxicity"], "subjectivity": row["subjectivity"]} \
    for index, row in tweets.iterrows()]

print(solr.add(data))