import pysolr

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import requests
from urllib.parse import urlencode
import json as js

import os
import pandas as pd
import logging

nltk.download('stopwords')

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

logging.getLogger('socketio').setLevel(logging.ERROR)

SOLR_PATH_TW = 'http://localhost:8888/solr/twitter_core/'
SOLR_PATH_RP = 'http://localhost:8888/solr/reddit_post_core/'
SOLR_PATH_RC = 'http://localhost:8888/solr/reddit_comment_core/'

solr_tw = pysolr.Solr(SOLR_PATH_TW, always_commit=True, results_cls=dict)
solr_rp = pysolr.Solr(SOLR_PATH_RP, always_commit=True, results_cls=dict)
solr_rc = pysolr.Solr(SOLR_PATH_RC, always_commit=True, results_cls=dict)

solr_tw.ping()
solr_rp.ping()
solr_rc.ping()

# retreive all data entries from Solr
def getAll():
    results_tw = solr_tw.search('*', rows=15)
    results_rp = solr_rc.search('*', rows=15)
    results_rc = solr_rc.search('*', rows=15)

    print("Successfully retrieved ", len(results_tw['response']['docs']), "rows of data.")
    print("Successfully retrieved ", len(results_rp['response']['docs']), "rows of data.")
    print("Successfully retrieved ", len(results_rc['response']['docs']), "rows of data.")
    
    return results_tw, results_rp, results_rc


# given a query return the relevant results
# params = {q:, fq:, sort:}
def performQuery(params):
    print(params)
    if len(params) == 0: # no query was given but the submit button was clicked
        results = {}
    else:
        if params['sort']:
            results_tw = solr_tw.search(params['q'], fq=params['fq'], sort=params['sort'], rows=15)
            results_rp = solr_rc.search(params['q'], fq=params['fq'], sort=params['sort'], rows=15)
            results_rc = solr_rc.search(params['q'], fq=params['fq'], sort=params['sort'], rows=15)
        else:
            results_tw = solr_tw.search(params['q'], fq=params['fq'], rows=15)
            results_rp = solr_rc.search(params['q'], fq=params['fq'], rows=15)
            results_rc = solr_rc.search(params['q'], fq=params['fq'], rows=15)

    print("Successfully retrieved ", len(results_tw['response']['docs']), "rows of data.")
    print("Successfully retrieved ", len(results_rp['response']['docs']), "rows of data.")
    print("Successfully retrieved ", len(results_rc['response']['docs']), "rows of data.")

    # initialise the spelling components in the response
    results['response']['hide_suggestions'] = True
    results['response']['spell_suggestions'] = []
    results['response']['spell_error_found'] = False

    # perform spell checking using Solr
    response_tw = requests.get(SOLR_PATH_TW + 'spell?' + urlencode({'q':params['q'], 'wt':'json', 'spellcheck.collate':'true', 'spellcheck.count':10}))
    response_rp = requests.get(SOLR_PATH_RP + 'spell?' + urlencode({'q':params['q'], 'wt':'json', 'spellcheck.collate':'true', 'spellcheck.count':10}))
    response_rc = requests.get(SOLR_PATH_RC + 'spell?' + urlencode({'q':params['q'], 'wt':'json', 'spellcheck.collate':'true', 'spellcheck.count':10}))

    tw_suggestions, found_tw = get_suggestions(results_tw, "twitter")
    rp_suggestions, found_rp = get_suggestions(results_rp, "reddit posts")
    rc_suggestions, found_rc = get_suggestions(results_rc, "reddit comments")

    if found_tw or found_rp or found_rc:
        results['response']['hide_suggestions'] = False
        results['response']['spell_error_found'] = True
    
    results['response']['spell_suggestions'] = get_common_suggestions(tw_suggestions, rp_suggestions, rc_suggestions)
    
    return results

# check the response given by Solr
# returns the suggestions and spell_error_found
def get_suggestions(response, source):
    if response.status_code == 200:
        json_response = response.json()
        if(json_response['spellcheck']['correctlySpelled'] == False): # spelling error is found
            suggestions = []
            # single word queries should return word suggestions
            if len(params['q'].split("\"")[1].split(" ")) == 1:  # the tokens will be "tweet: " , "word" , "" so we want to see if the second token has more than one word
                print("Single word query")
                for obj in json_response['spellcheck']['suggestions']:
                    if type(obj) != str:
                        suggestions.extend(obj['suggestion'])

                sorted_suggestions = sorted(suggestions, key=lambda x: x['freq'], reverse=True)[:3]
                final_suggestions = [x['word'] for x in sorted_suggestions]

            # multi word queries should return collated results
            else:
                print("Multi word query")
                for obj in json_response['spellcheck']['collations']:
                    if type(obj) != str:
                        suggestions.append(obj)

                sorted_suggestions = sorted(suggestions, key=lambda x: x['hits'], reverse=True)
                final_suggestions = [x['collationQuery'].split("\"")[1] for x in sorted_suggestions]

            print(f"Spelling suggestions from {source} found are", final_suggestions)

            return final_suggestions, True # suggestions, error_found=True
        
        else: # no spelling error found
            return [], False # no suggestions, error_found=False
    else:
        raise Exception("Solr experienced an error")


# find the common suggestions from the three cores
def get_common_suggestions(l1, l2, l3):
    # Converting the arrays into sets
    s1 = set(l1)
    s2 = set(l2)
    s3 = set(l3)
      
    # Calculates intersection of 
    # sets on s1 and s2
    set1 = s1.intersection(s2)
      
    # Calculates intersection of sets
    # on set1 and s3
    result_set = set1.intersection(s3)
      
    # Converts resulting set to list
    final_list = list(result_set)
    
    return final_list


@app.route("/")
def index():
    return render_template("index.html")


@socketio.on('join')
def on_join(json):
    room = json['client_id']
    join_room(room)
    print(f'Client {json["client_id"]} connected')
    results_tw, results_rp, results_rc = getAll()
    socketio.emit('results_tw', {'results': results_tw['response']['docs']}, room = json['client_id']) # emit to specific users
    socketio.emit('results_rp', {'results': results_rp['response']['docs']}, room = json['client_id'])
    socketio.emit('results_rc', {'results': results_rc['response']['docs']}, room = json['client_id'])


@socketio.on('leave')
def on_leave(json):
    room = json['client_id']
    leave_room(room)
    print(f'Client {json["client_id"]} disconnected')


@socketio.on('query')
def query(json):
    print('received json: ' + str(json))
    results = performQuery(json['search_params'])
    print(results['response'])
    socketio.emit('results_tw', {'results': results_tw['response']['docs']}, room = json['client_id']) # emit to specific users
    socketio.emit('results_rp', {'results': results_rp['response']['docs']}, room = json['client_id'])
    socketio.emit('results_rc', {'results': results_rc['response']['docs']}, room = json['client_id'])

    socketio.emit('spelling', {'spell_suggestions': results['response']['spell_suggestions'], 'hide_suggestions':results['response']['hide_suggestions'], 'spell_error_found':results['response']['spell_error_found']}, room = json['client_id'])


if __name__ == "__main__":
    socketio.run(app)
