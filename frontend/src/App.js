import logo from './logo.svg';
import './App.css';
import PropTypes from 'prop-types';

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, CircularProgress , Link, CssBaseline, Container, AppBar, Toolbar, TextField, IconButton, Input, Box, Grid, Paper, Avatar, Checkbox, FormControl, InputLabel, Select, MenuItem, ListItemText, Button } from '@material-ui/core';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import ShowChartIcon from '@material-ui/icons/ShowChart';
import SearchIcon from '@material-ui/icons/Search';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import RepeatIcon from '@material-ui/icons/Repeat';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import TrendingDownIcon from '@material-ui/icons/TrendingDown';
import grey from '@material-ui/core/colors/grey';
import purple from '@material-ui/core/colors/purple';

const io = require('socket.io-client');
const socket = io.connect('http://localhost:5000');

function App() {
  const [results, setResults] = React.useState([]);
  var searchQuery = React.useRef()
  socket.on('connect', function() {
    socket.emit('join', {data: 'Client connected!', cid: socket.id});
  });
  socket.on('results', function(msg) {
    setResults(msg.results);
});
  const handleSearchClick = (event) => {
    var searchq = searchQuery.current.value;
    if(searchq==="") return;

    var search_grid = {
        'q':'',
        'fq':'',
    };
    if(searchq){
        search_grid['q'] += 'tweet: '+searchq
    }
    
    console.log(search_grid);
    socket.emit('onclick', {search_params: search_grid, cid: socket.id});
    console.log("sent");
  };
  return (
    <div className="A">
      <Toolbar align='center'>
      <CurrencyBitcoinIcon align='center'/> 
      <Typography color="#9c27b0" align="center" > NFT Twitter and Reddit Feed </Typography>
      </Toolbar>
      <Grid container item xs={10} justify='center'> 
        <Grid container item sm={11} xs={10} justify='center'> 
          <TextField inputRef={searchQuery} variant="outlined" label="Search for..." fullWidth/>
        </Grid>
        <Grid container item sm={1} xs={2} justify='center'> 
          <IconButton type="submit" onClick={handleSearchClick} aria-label="search"> <SearchIcon/> </IconButton>
        </Grid>
      </Grid>
      <Box py={2} width={"100%"}>
      <Grid container item xs={10} spacing={0}>

<Grid container item xs={12}>
  <Typography variant="caption" color="primary">Search Preferences</Typography>
</Grid>

<Paper>
<Grid container item xs={12} >
  <Grid container item md={12} xs={12}>
    <FormControl>
      <InputLabel>Sort using</InputLabel>
      <Select
        value='relevance'
      >
        <MenuItem value={"relevance"}>Relevance</MenuItem>
        <MenuItem value={"tweetfavcount"}>Favourite Count</MenuItem>
        <MenuItem value={"tweetretweetcount"}>Retweet Count</MenuItem>
      </Select>
    </FormControl>
  </Grid>

  <Grid container item md={10} xs={12}>
    <FormControl>
      <InputLabel>Sort by</InputLabel>
      <Select
        value="asc" 
      >
        <MenuItem value={"asc"}>Ascending</MenuItem>
        <MenuItem value={"desc"}>Descending</MenuItem>
      </Select>
    </FormControl>
  </Grid>

  <Grid container item md={12} xs={12}>
    <FormControl>
      <InputLabel>Filter Sources</InputLabel>
      

    </FormControl>
  </Grid>
</Grid>
</Paper>
</Grid>
      </Box>
<Container align='center'>
  <Box py={2}>
  <Grid container item lg={12} xs={12} justify="center">
          <Typography variant="h4" color="primary" align="center">Results</Typography>
          
        </Grid>
        <Grid container item lg={6} xs={10}>
        {
          results.map(result => (
            // <Box py={1}>
              <Paper key={result.id}>
                <Grid container item xs={12}>
                  <Grid container item xs={3} sm={2} md={1}>
                  <Link target="_blank" underline="none" href={"http://www.twitter.com/"+ result.username}>
                    <Avatar alt={result.username[0]} src={result.userpic[0]} />
                  </Link>
                  </Grid>

                  <Grid container item xs={9} sm={10} md={11}>

                    <Grid container item xs={12} style={{alignItems: "baseline" }}>
                      <Box mr={1}>
                      <Link target="_blank" href={"http://www.twitter.com/"+ result.username}>
                        <Typography variant="h6" color="textPrimary" >{result.username}</Typography>
                      </Link>
                      </Box>
                      <Typography variant="body2" color="textPrimary">{new Date(result.tweetcreatedts).toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'})}</Typography>
                    </Grid>

                    <Box my={1}>
                      <Grid container item xs={12} >
                        <Typography variant="body1" color="textPrimary" align="left">{result.tweettext}</Typography>
                      </Grid>
                    </Box>
                    
                    <Grid container item xs={12} style={{alignItems: "center" }}>
                        <Grid container item xs={11} >
                          <StarBorderIcon />
                          <Box mr={2}>
                            <Typography variant="subtitle2" color="textPrimary">{result.tweetfavcount}</Typography>
                          </Box>
                          <RepeatIcon />
                          <Box mr={2}>
                            <Typography variant="subtitle2" color="textPrimary">{result.tweetretweetcount}</Typography>
                          </Box>
                          
                        </Grid>
                   
                    </Grid>

                  </Grid>
                  
                </Grid>
              </Paper>
            // </Box>
          ))
        }
        </Grid>
  </Box>
</Container>
    </div>
  );
}

export default App;
