#!/usr/bin/env python
# coding: utf-8

# In[1]:


from pprint import pprint
import  pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns


# In[2]:


import praw

user_agent = "Crawler 1.0 by /u/crawler4034"
reddit = praw.Reddit(
    client_id="rEFY49zWloo8lgPG_tQbPg",
    client_secret="4xO6HeOJTcdkHMhrfJv3lLo8KYvvWw",
    user_agent=user_agent
)


# In[3]:


headlines = set()
for submission in reddit.subreddit('OpenseaMarket').hot(limit=None):
    print(submission.title,',',submission.num_comments,',',submission.score)
    #print(submission.id)
    #print(submission.author)
    #print(submission.created_utc)
    #print(submission.score)
    #print(submission.upvote_ratio)
    #print(submission.url)
    break
    headlines.add(submission.title)
    #headlines.add(submission.id)
print(len(headlines))


# In[4]:


df = []
subreddit = reddit.subreddit('OpenseaMarket')
for post in subreddit.hot(limit=None):
    df.append([post.title, post.score, post.url, post.num_comments, post.selftext, post.upvote_ratio])
    
df = pd.DataFrame(df,columns=['title', 'score', 'url', 'num_comments', 'body', 'upvote'])
df


# In[5]:


df.to_csv('OpenseaMarket.csv', header=False, encoding='utf-8', index=False)


# In[ ]:




