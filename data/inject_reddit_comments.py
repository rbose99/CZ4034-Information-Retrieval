import pysolr
import pandas as pd

# SOLR_PATH='http://solr:8983/solr/'
SOLR_PATH = 'http://localhost:8888/solr/reddit_comment_core/'  # format of the path should be localhost:port/core_name
solr = pysolr.Solr(SOLR_PATH, always_commit=True, results_cls=dict)
solr.ping()

comments = pd.read_csv('Reddit_Comments_7k_final_Cleaned_labelled.csv')

data = [{"id": index, "text": row["body"], "date": row['created_utc'], \
        "likes": row["score"], "author": row["author"], \
        "url": "https://www.reddit.com" + str(row["permalink"]), \
        "user_profile_url": "https://www.reddit.com/user/" + str(row["author"]), \
        "subjectivity": row["subjectivity"], "polarity": row["polarity"], "sarcasm": row["sarcasm"]}
        for index, row in comments.iterrows()]

print(solr.add(data))

