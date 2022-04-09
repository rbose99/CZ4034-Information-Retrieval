import numpy as np
import pandas as pd
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TextClassificationPipeline
import datetime

path = 'scraped_data.csv'
df = pd.read_csv(path, encoding="ISO-8859-1")

#load tokenizer for subjectivity,polarity,sarcasm
tokenizer_subjectivity = AutoTokenizer.from_pretrained('./saved_model_subjectivity')
tokenizer_polarity = AutoTokenizer.from_pretrained('./saved_model_polarity')
tokenizer_sarcasm = AutoTokenizer.from_pretrained('./saved_model_sarcasm')

#Load model for subjectivity and polarity,sarcasm
model_subjectivity = AutoModelForSequenceClassification.from_pretrained('./saved_model_subjectivity')
model_polarity = AutoModelForSequenceClassification.from_pretrained('./saved_model_polarity')
model_sarcasm = AutoModelForSequenceClassification.from_pretrained('./saved_model_sarcasm')

#Load pipeline for prediction
subjectivity_pipe = TextClassificationPipeline(model=model_subjectivity, tokenizer=tokenizer_subjectivity, return_all_scores=False)
polarity_pipe= TextClassificationPipeline(model=model_polarity, tokenizer=tokenizer_polarity, return_all_scores=False)
sarcasm_pipe= TextClassificationPipeline(model=model_sarcasm, tokenizer=tokenizer_sarcasm, return_all_scores=False)

df["subjectivity"] = '0'
df["polarity"] = '0'
df["sarcasm"] = '0'

def reddit_comments():
    df = df[['body','permalink','score','created_utc','author']]

    df['created_utc'] = pd.to_datetime(df['created_utc'], utc=True, unit='s')
    df['created_utc'] = df['created_utc'].map(lambda x: x.isoformat())

    df_labelled = label(df)
    return df_labelled


def tweets():
    df = df[['created_at','favorite_count','full_text','reply_count','retweet_count','url']]

    df_labelled = label(df)
    return df_labelled


def reddit_posts():
    df = df[['created_utc','full_link','num_comments','permalink','Title', 'score', 'author']]

    df['created_utc'] = pd.to_datetime(df['created_utc'], utc=True, unit='s')
    df['created_utc'] = df['created_utc'].map(lambda x: x.isoformat())

    df_labelled = label(df)
    return df_labelled



def label(df):
    # labelling sujectivity and sarcasm
    for index, row in df.iterrows():
        resSub= subjectivity_pipe(row['body'])
        resSar= sarcasm_pipe(row['body'])
        if(resSub[0]['label'] =='LABEL_0'):
            df.at[index,'subjectivity'] = 0
        elif(resSub[0]['label'] =='LABEL_1'):
            df.at[index,'subjectivity'] = 1
        
        if(resSar[0]['label'] =='LABEL_0'):
            df.at[index,'sarcasm'] = 0
        elif(resSar[0]['label'] =='LABEL_1'):
            df.at[index,'sarcasm'] = 1

    # labelling polarity
    for index, row in df.iterrows():
        resPol= polarity_pipe(row['body'])
        if(row['subjectivity'] == 1):
            if(resPol[0]['label'] =='LABEL_0'):
                df.at[index,'polarity'] = 0
            elif(resPol[0]['label'] =='LABEL_1'):
                df.at[index,'polarity'] = 1
        else:
            df.at[index,'polarity'] = np.NaN

    return df

