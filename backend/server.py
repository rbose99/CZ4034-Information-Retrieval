import pysolr

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import requests
from urllib.parse import urlencode
import json as js

import os
import pandas as pd
import logging

from time import time

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
    results_rp = solr_rp.search('*', rows=15)
    results_rc = solr_rc.search('*', rows=15)

    print("Successfully retrieved ", len(results_tw['response']['docs']), "rows of data.")
    print("Successfully retrieved ", len(results_rp['response']['docs']), "rows of data.")
    print("Successfully retrieved ", len(results_rc['response']['docs']), "rows of data.")
    
    return results_tw, results_rp, results_rc


def performQuery(params):
    print(params)

    results_spell = {}
    results_tw = {}
    results_rp = {}
    results_rc = {}
    
    if len(params) == 0: # no query was given but the submit button was clicked
        pass

    else:
        results_tw, tw_suggestions, found_tw = performSingleCoreQuery(params, solr_tw, SOLR_PATH_TW, "twitter")
        results_rp, rp_suggestions, found_rp = performSingleCoreQuery(params, solr_rp, SOLR_PATH_RP, "reddit posts")
        results_rc, rc_suggestions, found_rc = performSingleCoreQuery(params, solr_rc, SOLR_PATH_RC, "reddit comments")

        # initialise the spelling components in the response
        results_spell['hide_suggestions'] = True
        results_spell['spell_suggestions'] = []
        results_spell['spell_error_found'] = False

        # majority voting for spell checking => if any two of them say there is a spelling error
        if (found_tw and found_rp) or (found_rp and found_rc) or (found_tw and found_rc):
            results_spell['hide_suggestions'] = False
            results_spell['spell_error_found'] = True
    
            common_suggestions = get_common_suggestions(tw_suggestions, rp_suggestions, rc_suggestions)

            if len(common_suggestions) == 0:
                if found_tw and len(tw_suggestions) > 0:
                    results_spell['spell_suggestions'].append(tw_suggestions[0])
                if found_rp and len(rp_suggestions) > 0:
                    results_spell['spell_suggestions'].append(rp_suggestions[0])
                if found_rc and len(rc_suggestions) > 0:
                    results_spell['spell_suggestions'].append(rc_suggestions[0])
            else:
                results_spell['spell_suggestions'] = common_suggestions[:3] if len(common_suggestions)>3 else common_suggestions
        
    return results_spell, results_tw, results_rp, results_rc


def create_fq(filters,source):
    fq=''
    
    if filters['popular']:
        if source == 'reddit posts':
            fq=fq+'likes:[3 TO *]'
        else:
            fq=fq+'likes:[100 TO *]'
    else:
        fq=fq+'likes:[0 TO *]'
    
    if filters['recent']:
        fq=fq+'&date:[NOW-7DAY/DAY TO NOW]'
    
    if filters['nosarcasm']:
        fq=fq+'&sarcasm:0'
    
    if filters['opinionated'] and filters['neutral']:
        fq=fq+''
    
    elif filters['opinionated']:
        fq=fq+'&polarity:1'
    
    elif filters['neutral']:
        fq=fq+'&polarity:0'

    return fq


# given a query return the relevant results
# params = {q:, fq:, sort:}
def performSingleCoreQuery(params, solr, SOLR_PATH, source):
    fq = create_fq(params['filter'], source)
    results = solr.search(params['q'], fq=fq, sort=params['sort'] , rows=15)

    print(f"{source} successfully retrieved ", len(results['response']['docs']), "rows of data.")

    spell_response = requests._get(SOLR_PATH + 'spell?' + urlencode({'q':params['q'], 'wt':'json', 'spellcheck.collate':'true', 'spellcheck.count':10, 'spellcheck.maxCollations':10}))
    suggestions, found = get_suggestions(spell_response, params)

    return results, suggestions, found


# check the response given by Solr
# returns the suggestions and spell_error_found
def get_suggestions(response, params):
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

                sorted_suggestions = sorted(suggestions, key=lambda x: x['freq'], reverse=True)
                final_suggestions = [x['word'] for x in sorted_suggestions]

            # multi word queries should return collated results
            else:
                print("Multi word query")
                for obj in json_response['spellcheck']['collations']:
                    if type(obj) != str:
                        suggestions.append(obj)

                sorted_suggestions = sorted(suggestions, key=lambda x: x['hits'], reverse=True)
                final_suggestions = [x['collationQuery'].split("\"")[1] for x in sorted_suggestions]

            print(f"Spelling suggestions found are", final_suggestions)

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


def get_stats(results):
    sources = ["twitter", "reddit_posts", "reddit_comments"]

    stats = {sources[0]: {"positive": 0, "negative": 0, "neutral": 0},
            sources[1]: {"positive": 0, "negative": 0, "neutral": 0},
            sources[2]: {"positive": 0, "negative": 0, "neutral": 0}}

    i = 0
    for res in results: # res is the list of docs
        for doc in res: # doc is each individual doc
            if doc['polarity'] == 1:
                stats[sources[i]]['positive'] += doc['polarity']
            elif doc['polarity'] == 0:
                stats[sources[i]]['negative'] += doc['polarity']
            else:
                stats[sources[i]]['neutral'] += 1
        
        print(stats)
        i += 1


@app.route("/")
def index():
    return render_template("index.html")


@socketio.on('join')
def on_join(json):
    room = json['client_id']
    join_room(room)
    print(f'Client {json["client_id"]} connected')

    results_tw, results_rp, results_rc = getAll()

    stats = get_stats([results_tw['response']['docs'], results_rp['response']['docs'], results_rc['response']['docs']])

    socketio.emit('results_tw', {'results': results_tw['response']['docs']}, room = json['client_id']) # emit to specific users
    socketio.emit('results_rp', {'results': results_rp['response']['docs']}, room = json['client_id'])
    socketio.emit('results_rc', {'results': results_rc['response']['docs']}, room = json['client_id'])

    socketio.emit('stats', {'stats': stats})


@socketio.on('leave')
def on_leave(json):
    room = json['client_id']
    leave_room(room)
    print(f'Client {json["client_id"]} disconnected')


@socketio.on('query')
def query(json):
    print('received json: ' + str(json))

    start = time()
    results_spell, results_tw, results_rp, results_rc = performQuery(json['search_params'])
    print(f"Query time = {(time() - start)*1000} milliseconds")

    stats = get_stats([results_tw['response']['docs'], results_rp['response']['docs'], results_rc['response']['docs']])

    socketio.emit('results_tw', {'results': results_tw['response']['docs']}, room = json['client_id']) # emit to specific users
    socketio.emit('results_rp', {'results': results_rp['response']['docs']}, room = json['client_id'])
    socketio.emit('results_rc', {'results': results_rc['response']['docs']}, room = json['client_id'])

    socketio.emit('spelling', {'spell_suggestions': results_spell['spell_suggestions'], 'hide_suggestions':results_spell['hide_suggestions'], \
                                'spell_error_found':results_spell['spell_error_found']}, room = json['client_id'])

    socketio.emit('stats', {'stats': stats})

if __name__ == "__main__":
    socketio.run(app)





