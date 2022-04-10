import pysolr
import pandas as pd

# SOLR_PATH='http://solr:8983/solr/'
SOLR_PATH = 'http://localhost:8888/solr/reddit_post_core/'  # format of the path should be localhost:port/core_name
solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
solr.ping()

posts = pd.read_csv('Reddit_Posts_1k_Cleaned_labelled.csv')

data = [{"id": index, "text": row["Title"], "date": row["created_utc"], \
        "likes": row["score"], "num_comments": row["num_comments"], \
        "url": row["full_link"], "author": row["author"], \
        "user_profile_url": "https://www.reddit.com/user/" + str(row["author"]), \
        "subjectivity": row["subjectivity"], "polarity": row["polarity"], "sarcasm": row["sarcasm"]} \
        for index, row in posts.iterrows()]

print(solr.add(data))

