from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import requests
import json as js

import pysolr

import pandas as pd

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

new_tweet_count_dict = {}

# SOLR_PATH='http://solr:8983/solr/'
SOLR_PATH = 'http://localhost:8889/solr/test_core/'
solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
solr.ping()

def getAllDataDesc():
    results = solr.search('*', sort='tweetcreatedts desc', rows=15)
    print("Successfully retrieved ", len(results['response']['docs']), "rows of data.")
    return results

@app.route("/")
def index():
    return render_template('index.js')


@socketio.on("onclick")
def search(searchTerm):
    results = solr.search("tweet: shit",
                            **{'fl' : "id,tweet"},
                            rows=15)



# tweets = pd.read_csv('sample_data.csv')

# results = solr.search("tweet: shit",
#                         **{'fl' : "id,tweet"},
#                         rows=15)

# for k,v in results.items():
#     print(k)
#     print(v)


if __name__ == "__main__":
    socketio.run(app)
