var show = true;
document.getElementById("sort_order_block").style.display = "none";
document.getElementById("new_tweet_btn").disabled = true;

function showCheckboxes() {
    var checkboxes = 
        document.getElementById("filter_by");

    if (show) {
        checkboxes.style.display = "block";
        show = false;
    } else {
        checkboxes.style.display = "none";
        show = true;
    }
}

function getCheckedBoxes(chkboxName) {
    var checkboxes = document.getElementsByName(chkboxName);
    var checkboxesChecked = [];
    // loop over them all
    for (var i=0; i<checkboxes.length; i++) {
       // And stick the checked ones onto an array...
       if (checkboxes[i].checked) {
          checkboxesChecked.push(checkboxes[i].value);
       }
    }
    // Return the array if it is non-empty, or null
    return checkboxesChecked.length > 0 ? checkboxesChecked : null;
  }

  function showResults(item, index) {
    document.getElementById("results").innerHTML += index + "<br>";
    document.getElementById("results").innerHTML += "USER:\t" + String(item['username']) + "<br>";
    document.getElementById("results").innerHTML += "TWEET:\t"+String(item['tweettext']) + "<br>";
    document.getElementById("results").innerHTML += "TIME:\t" + ":" + String(item['tweetcreatedts']) + "<br>";
    document.getElementById("results").innerHTML += "FAV:\t" + String(item['tweetfavcount']) + "<br>";
    document.getElementById("results").innerHTML += "RT:\t" + String(item['tweetretweetcount']) + "<br>";
    document.getElementById("results").innerHTML += '<br/>';
}

document.addEventListener('DOMContentLoaded', function initialize(e) {

    var socket = io('http://localhost:5000');
    var results
    socket.on('connect', function() {
        socket.emit('join', {data: 'Client connected!', cid: socket.id});
    });
    socket.on('results', function(msg) {
        results = msg.results
        document.getElementById('results').innerHTML = ""
        results.forEach(showResults);
        // document.getElementById('results').innerHTML = (JSON && JSON.stringify ? JSON.stringify(results, undefined, 2) : results)
    });
    socket.on('new_tweets', function(msg) {
        //console.log(msg.count);
        if(msg.count>0){
            document.getElementById('new_tweet_count').innerHTML = 'New Tweets: '+ String(msg.count);
            document.getElementById("new_tweet_btn").disabled = false;
        }
    });

    document.getElementById('new_tweet_btn').addEventListener('click', function(e){
        socket.emit('refresh_data',  {cid: socket.id});
        document.getElementById("new_tweet_btn").disabled = true;
        document.getElementById('new_tweet_count').innerHTML = "No new tweets.";
    });

    document.getElementById('sort_by').addEventListener('change', function(e){
        var sort_by = document.getElementById('sort_by').value;
        var sort_order_block = document.getElementById("sort_order_block");
        if(sort_by=='relevance'){
            sort_order_block.style.display = "none";
        }
        else{
            sort_order_block.style.display = "block";
        }
    });

    document.getElementById('search').addEventListener('click', function(e){
        var search_bar = document.getElementById('search_bar').value;
        var sort_order = document.getElementById('sort_order').value;
        var sort_by = document.getElementById('sort_by').value;
        //var filter_by = document.getElementById('filter_by').value;
        var filter_by = getCheckedBoxes("filter_source");

        var search_grid = {
            'q':''
        };
        if(search_bar){
            search_grid['q'] += 'tweettextcleaned: '+search_bar+',\n'
        }
        if(filter_by){
            for (var i=0; i<filter_by.length; i++) {
                search_grid['q']+= 'username:'+filter_by[i]+',\n'
            }
        }
        search_grid['sort'] = sort_by+ ' ' +sort_order;

        console.log((JSON && JSON.stringify ? JSON.stringify(search_grid, undefined, 2) : research_gridsults))
        socket.emit('search', {search_params: search_grid, cid: socket.id});

    });
    

    //Logger
    (function () {
        var old = console.log;
        var logger = document.getElementById('logs-content');
        console.log = function () {
          for (var i = 0; i < arguments.length; i++) {
            logger.innerHTML += '<small>'+JSON.stringify(new Date()) + ' : ' + arguments[i] +'</small>' ;
            // if (typeof arguments[i] == 'object') {
            //     logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(arguments[i], undefined, 2) : arguments[i]) + '<br />';
            // } else {
            //     logger.innerHTML += '<p>' + arguments[i] + '</p>';
            // }
            logger.innerHTML += '<br/>';
          }
        }
    })();
});