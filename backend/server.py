import pysolr

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import requests
from urllib.parse import urlencode
import json as js

import os
import pandas as pd
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from nltk import word_tokenize, sent_tokenize

from sklearn.feature_extraction.text import TfidfVectorizer

# [TODO] add improt for model loading package, either torch or tf or pickle

nltk.download('stopwords')

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# SOLR_PATH='http://solr:8983/solr/'
SOLR_PATH = 'http://localhost:8889/solr/test_core/'
solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
solr.ping()

# [TODO] add preprocessing for model (tokenising, stemming, tf-idf)

# [TODO] load model and perform classification
def classifier():
    pass


# retreive all data entries from Solr
def getAll():
    results = solr.search('*', rows=15) # [TODO] change the column for sorting
    print("Successfully retrieved ", len(results['response']['docs']), "rows of data.")
    return results


# given a query return the relevant results
# params = {q:, fq:, sort:}
def performQuery(params):
    print(params)
    if len(params) == 0: # no query was given but the submit button was clicked
        results = {}
    # [TODO] add filter criteria
    else:
        results = solr.search(params['q'], fq=params['fq'], rows=15)  # [TODO] sort

    print("Successfully retrieved ", len(results['response']['docs']), "rows of data.")
    
    return results


@app.route("/")
def index():
    return render_template("index.html")

@socketio.on('join')
def on_join(json):
    room = json['client_id']
    join_room(room)
    print(f'Client {json["client_id"]} connected')
    results = getAll()
    socketio.emit('results', {'results': results['response']['docs']}, room = json['client_id']) # emit to specific users


@socketio.on('leave')
def on_leave(json):
    room = json['client_id']
    leave_room(room)
    print(f'Client {json["client_id"]} disconnected')


@socketio.on('query')
def query(json):
    print('received json: ' + str(json))
    results = performQuery(json['search_params'])
    socketio.emit('results', {'results': results['response']['docs']}, room = json['client_id']) # emit to specific users
    # socketio.emit('spelling', {'spelling_suggestions': results['response']['spelling_suggestions'], 'hide_spelling_suggestion':results['response']['hide_spelling_suggestion']}, room = json['client_id'])


if __name__ == "__main__":
    socketio.run(app)
