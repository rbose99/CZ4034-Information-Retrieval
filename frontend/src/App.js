import logo from './logo.svg';
import './App.css';
import PropTypes from 'prop-types';

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, CircularProgress , Link, CssBaseline, Container, AppBar, Toolbar, TextField, IconButton, Input, Box, Grid, Paper, Avatar, Checkbox, FormControl, InputLabel, Select, MenuItem, ListItemText, Button } from '@material-ui/core';
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn';
import ShowChartIcon from '@material-ui/icons/ShowChart';
import SearchIcon from '@material-ui/icons/Search';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import RepeatIcon from '@material-ui/icons/Repeat';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import TrendingDownIcon from '@material-ui/icons/TrendingDown';
import grey from '@material-ui/core/colors/grey';

const io = require('socket.io-client');
const socket = io.connect('http://localhost:5000');

function App() {
  var searchQuery = React.useRef()
  socket.on('connect', function() {
    socket.emit('join', {data: 'Client connected!', cid: socket.id});
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
      <Grid container item xs={10} justify='center'> 
        <Grid container item sm={11} xs={10} justify='center'> 
          <TextField inputRef={searchQuery} variant="outlined" label="Search for" color="secondary" fullWidth/>
        </Grid>
        <Grid container item sm={1} xs={2} justify='center'> 
          <IconButton type="submit" onClick={handleSearchClick} aria-label="search"> submit </IconButton>
        </Grid>
      </Grid>
    </div>
  );
}

export default App;
