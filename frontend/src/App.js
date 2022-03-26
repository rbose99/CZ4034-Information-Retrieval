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
  const [sortMethod, setSortMethod] = React.useState('relevance');
  const [filters, setFilters] = React.useState('none');
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

    var search_params = {
        'q':'',
        'fq':'',
        'sort':''
    };
    if(searchq){
        search_params['q'] += 'tweet: '+ "\"" + searchq + "\""
    }
    search_params['sort'] = sortMethod + '  desc'
    search_params['filter'] = filters 
    search_params['sites'] = siteFilter 
    console.log(search_params);
    socket.emit('query', {search_params: search_params, client_id: socket.id});
    console.log("sent");
    setHideSpellCheck(true);
    setSpellCheck([]);
  };

  const handleCorrectionClick = (event) => {
    var searchq = event.currentTarget.value;
    if(searchq==="") return;

    var search_params = {
        'q':'',
        'fq':'',
    };
    if(searchq){
        search_params['q'] += 'tweet: '+ "\"" + searchq + "\"" 
    }
    search_params['sort'] = sortMethod + '  desc'
    search_params['filter'] = filters 
    search_params['sites'] = siteFilter 
    console.log(search_params);
    socket.emit('query', {search_params: search_params, client_id: socket.id});
    console.log("sent");

    searchQuery.current.value = searchq;
    setHideSpellCheck(true);
    setSpellCheck([]);

  }
  

  const handleSortChange = (event) => {
    setSortMethod();
  }

  const handleFilterChange = (event) => {
    setFilters('none'); 
  }

  const handleSiteChange = (event) => {
    setSiteFilter('both');
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
    <FormControl>
      <InputLabel>Sources</InputLabel>
      <Select
        value='both'
        onChange={handleSiteChange}
      >
        <MenuItem value={"both"}>Both</MenuItem>
        <MenuItem value={"twitter"}>Twitter</MenuItem>
        <MenuItem value={"reddit"}>Reddit</MenuItem>
      </Select>
    </FormControl>
    </Grid>
  <Grid container item md={12} xs={12}>
    <FormControl>
      <InputLabel>Sort using</InputLabel>
      <Select
        value='relevance'
        onChange={handleSortChange}
      >
        <MenuItem value={"relevance"}>Relevance</MenuItem>
        <MenuItem value={"tweetfavcount"}>Favourite/Like Count</MenuItem>
        <MenuItem value={"date"}>Date</MenuItem>
      </Select>
    </FormControl>
  </Grid>
  <Grid container item md={12} xs={12}>
    <FormControl>
      <InputLabel>Filters</InputLabel>
      <Select
        value='none'
        onChange={handleFilterChange}
      >
        <MenuItem value={"none"}>None</MenuItem>
        <MenuItem value={"Recent"}>Recent</MenuItem>
        <MenuItem value={"Popular"}>Popular</MenuItem>
      </Select>
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
