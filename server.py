# from flask import Flask, render_template, request
# from urllib import urlopen
# import simplejson

import pysolr
import pandas as pd

# app = Flask(__name__)

# SOLR_PATH='http://solr:8983/solr/'
SOLR_PATH = 'http://localhost:8889/solr/test_core/'
solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
# solr.ping()

tweets = pd.read_csv('sample_data.csv')

# data = [{"id": index, "tweet": row["text"], "user_location": row["user_location"], "link": row["url"],  \
#     "user_geo": list(map(float, row["user_geo"].strip("()").split(","))), \
#     "toxicity": row["toxicity"], "subjectivity": row["subjectivity"]} \
#     for index, row in tweets.iterrows()]

# print(solr.add(data))

results = solr.search("tweet: shit",
                        **{'fl' : "id,tweet"},
                        rows=15)

for k,v in results.items():
    print(k)
    print(v)

# if __name__ == '__main__':
#     app.run(host='0.0.0.0')
