# CZ4034-Information-Retrieval Group 7
 
 To run the web application:
 
install the requirements using 

``` 
pip install -r requirements.txt 
```

and activate the environment

Activate Solr:
download Solr from the google drive link, navigate to the bin folder and use the command 

``` 
solr start -p 8888 
```

Next, from the backend folder run the command

``` 
python server.py
```

From the frontend folder run the command

``` 
npm start
```

This will launch the web application on port localhost 3000


To inject data into Solr change the path to the data csv file in the inject codes which can be found in the data folder and run the codes as follows:

``` 
python inject_twitter.py
python inject_reddit_comments.py
python inject_reddit_posts.py
```
