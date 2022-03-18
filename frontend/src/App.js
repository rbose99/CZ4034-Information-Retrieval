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
  const [siteFilter, setSiteFilter] = React.useState('both');
  const [sortType, setSortType] = React.useState('relevance');
  const [spellCheck, setSpellCheck] = React.useState([]);
  const [hideSpellCheck, setHideSpellCheck] = React.useState('true');

  socket.on('spelling', function(msg) {
    setHideSpellCheck(msg.hide_suggestions);
    setSpellCheck(msg.spell_suggestions);
  });
  
  var searchQuery = React.useRef()
  socket.on('connect', function(msg) {
    socket.emit('join', {data: 'Client connected!', client_id: socket.id});
  });
  socket.on('results', function(msg) {
    setResults(msg.results);
    console.log(results)
  });
  socket.on('disconnect', function(msg) {
    socket.emit('leave', {data: 'Client disconnected!', client_id: socket.id});
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
    socket.emit('query', {search_params: search_grid, client_id: socket.id});
    console.log("sent");
    setHideSpellCheck(true);
    setSpellCheck([]);
  };

  const handleCorrectionClick = (event) => {
    var searchq = event.currentTarget.value;
    if(searchq==="") return;

    var search_grid = {
        'q':'',
        'fq':'',
    };
    if(searchq){
        search_grid['q'] += 'tweet: '+searchq
    }
    
    console.log(search_grid);
    socket.emit('query', {search_params: search_grid, client_id: socket.id});
    console.log("sent");

    searchTerm.current.value = searchq;
    setHideSpellCheck(true);
    setSpellCheck([]);

  }

  function SpellCheck(props)  {
    
    return (
      <Grid container item lg={12} xs={12} justify="center" hidden={props.show} >
        <Typography variant="subtitle2" color="textPrimary" hidden={props.show}>Did you mean: </Typography>
        {
          props.corrections.map(correction => (
            <Button variant="contained" onClick={handleCorrectionClick} value={correction} key={correction}>{correction}</Button>
          ))
        }
      </Grid>
    );
  }

  SpellCheck.propTypes = {
    /**
     * The value of the progress indicator for the determinate variant.
     * Value between 0 and 100.
     */
    show: PropTypes.bool.isRequired,
    corrections: PropTypes.array.isRequired
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
  <Typography variant="caption" color="primary">Advanced Settings</Typography>
</Grid>
<SpellCheck show={hideSpellCheck} corrections={spellCheck}/>
<Paper>
<Grid container item xs={12} >
<Grid container item md={12} xs={12}>
  <InputLabel></InputLabel>
  </Grid>
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
            <Box py={1}>
              <Paper key={result.id}>
                <Grid container item xs={12}>
                    <Box my={1}>
                      <Grid container item xs={12} >
                        <Typography variant="body1" color="textPrimary" align="left">{result.tweet}</Typography>
                      </Grid>
                    </Box>                  
                </Grid>
              </Paper>
            </Box>
          ))
        }
        </Grid>
  </Box>
</Container>
    </div>
  );
}

export default App;
