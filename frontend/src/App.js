import logo from './logo.svg';
import './App.css';
import PropTypes from 'prop-types';
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { CircularProgress , Link, CssBaseline, Container, AppBar, Toolbar, TextField, IconButton, Input, Box, Grid, Paper, Avatar,  InputLabel, Select, MenuItem, ListItemText, Button } from '@material-ui/core';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import FormLabel from '@mui/material/FormLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SearchIcon from '@material-ui/icons/Search';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import RepeatIcon from '@mui/icons-material/Repeat';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { ClassNames } from '@emotion/react';


const io = require('socket.io-client');
const socket = io.connect('http://localhost:5000');

function App() {
  const [redditPosts, setRedditPosts] = React.useState([]);
  const [redditComments,setRedditComments] = React.useState([]);
  const [tweets, setTweets] = React.useState([]);
  const [value, setValue] = React.useState(0);
  const [sortMethod, setSortMethod] = React.useState('relevance');
  const [filters, setFilters] = React.useState({'recent':false,'popular':false});
  const [spellCheck, setSpellCheck] = React.useState([]);
  const [hideSpellCheck, setHideSpellCheck] = React.useState(true);
  const [spellErrorFound, setSpellErrorFound] = React.useState(false);

  socket.on('spelling', function(msg) {
    setHideSpellCheck(msg.hide_suggestions);
    console.log(msg.hide_suggestions)
    console.log(hideSpellCheck);
    setSpellCheck(msg.spell_suggestions);
    setSpellErrorFound(msg.spell_error_found);
  });
  
  var searchQuery = React.useRef()
  socket.on('connect', function(msg) {
    socket.emit('join', {data: 'Client connected!', client_id: socket.id});
  });
  socket.on('results_tw', function(msg) {
    setTweets(msg.results);
  });
  socket.on('results_rp', function(msg) {
    setRedditPosts(msg.results);
  });
  socket.on('results_rc', function(msg) {
    setRedditComments(msg.results);
  });
  socket.on('disconnect', function(msg) {
    socket.emit('leave', {data: 'Client disconnected!', client_id: socket.id});
  });
  const handleSearchClick = (event) => {
    if (event.currentTarget.id==="search")
      var searchq = searchQuery.current.value;
    else 
      var searchq = event.currentTarget.value;
    if(searchq==="") return;

    var search_params = {
        'q':'',
        'sort':''
    };
    if(searchq){
        search_params['q'] += 'text: '+ "\"" + searchq + "\""
    }
    search_params['sort'] = sortMethod + ' desc'
    search_params['filter'] = filters 
    console.log(search_params);
    socket.emit('query', {search_params: search_params, client_id: socket.id});
    console.log("sent");
    searchQuery.current.value = searchq;
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const handleSortChange = (event) => {
    setSortMethod();
  }

  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.checked,
    });
  }

  function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }
  TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  };

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  function SpellCheck(props)  {
    console.log(props.corrections.length)
    console.log(spellErrorFound)
    console.log(props.show)
    return (
      <Grid container item lg={12} xs={12} justify="center" hidden={props.show} >
        <Grid container item lg={12} xs={12} justify="center" hidden={props.show} >
        <Typography variant="subtitle2" color="textPrimary" hidden={props.show}>Alternate search suggestions:</Typography>
        </Grid>
      <Grid container item lg={12} xs={12} justify="center" hidden={props.show} >
        {spellErrorFound && props.corrections.length==0 && !props.show &&
        <Typography variant="subtitle2" color="textPrimary">
          No suggestions were found. Please re-check your query.
        </Typography>
      }
    </Grid>
      
    <Grid container item lg={12} xs={12} justify="center" hidden={props.show} >
        {
          props.corrections.map(correction => (
            <Button variant="contained" onClick={handleSearchClick} value={correction} key={correction}>{correction}</Button>
          ))
        }
        </Grid>
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

  const styles = {
    root: {
      flexGrow: 1,
    },
    appbar: {
      alignItems: 'center',
    }
  };
  return (
     
      <Container  align='center'>
      <Grid container xs={12} justify='center' rowSpacing={2}> 
      <Grid item sm={12} xs={12} justify='center' >
      <CurrencyBitcoinIcon color="secondary" align='center'/>
      <Typography  variant="h6" component="div" align="center"> NFT Twitter and Reddit Feed </Typography>
     
      </Grid>
        <Grid item sm={11} xs={11} justify='center'> 
          <TextField inputRef={searchQuery} color="secondary" variant="outlined" label="Search for..." fullWidth/>
        </Grid>
        <Grid item sm={1} xs={2} justify='center'> 
          <IconButton id="search" type="submit" onClick={handleSearchClick} aria-label="search"> <SearchIcon/> </IconButton>
        </Grid>
      </Grid>
      <Box py={2} width={"100%"}>
      <Grid container item xs={12} spacing={0}>
<Grid  item xs={3} justify='center'></Grid>
<Grid container item xs={6} justify='center'>
<Accordion>
<AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography sx={{ color: 'text.secondary' }}>Advanced Settings</Typography>
        </AccordionSummary>
<AccordionDetails>
<SpellCheck show={hideSpellCheck} corrections={spellCheck}/>

<Grid container item xs={12} justify='center' >
  {/* <Grid container item md={12} xs={12} justify='center'>
    <FormControl>
      <FormLabel>Sources</FormLabel>
      <RadioGroup
      row
        defaultValue='both'
        onChange={handleSiteChange}
      >
        <FormControlLabel value={"both"} control={<Radio color="secondary" />}  label="Both" />
        <FormControlLabel value={"twitter"} control={<Radio color="secondary" />} label="Twitter"/>
        <FormControlLabel value={"reddit"} control={<Radio color="secondary" />} label="Reddit"/>
      </RadioGroup>
    </FormControl>
    </Grid> */}
  <Grid container item md={12} xs={12} justify='center'>
    <FormControl>
      <FormLabel>Sort using</FormLabel>
      <RadioGroup
      row
        defaultValue=''
        onChange={handleSortChange}
      >
        <FormControlLabel value={""} control={<Radio color="secondary" />}  label="Relevance"/>
        <FormControlLabel value={"score"} control={<Radio color="secondary" />}  label="Score/Like Count"/>
        <FormControlLabel value={"date"} control={<Radio color="secondary" />}  label="Date"/>
      </RadioGroup>
    </FormControl>
  </Grid>
  <Grid container item md={12} xs={12} justify="center">
    <FormControl>
      <FormLabel component="legend">Filters</FormLabel>
      <FormGroup row>
         <FormControlLabel
            control={
              <Checkbox checked={filters.recent} color="secondary" onChange={handleFilterChange} name="recent" />
            }
            label="Recent"
          />
          <FormControlLabel
            control={
              <Checkbox checked={filters.popular} color="secondary" onChange={handleFilterChange} name="popular" />
            }
            label="Popular"
          />
      </FormGroup>
    </FormControl>
  </Grid>


</Grid>
</AccordionDetails>
</Accordion>
</Grid>



</Grid>
      </Box>
      
<Container align='center'>
  <Box py={2}>
  <Grid container item lg={12} xs={12} justify="center">
          <Typography color="secondary" variant="h6" align="center">Results</Typography>
          
        </Grid>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
  <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
    <Tab label="Tweets" {...a11yProps(0)} />
    <Tab label="Reddit Posts" {...a11yProps(1)} />
    <Tab label="Reddit Comments" {...a11yProps(2)} />
  </Tabs>
</Box>
<TabPanel value={value} index={0}>

         {
          tweets.map(tweet => (
          <Paper>
            <Grid container item xs={12}>
              <Grid container item xs={9}>
              <Grid container item xs={12} style={{alignItems: "baseline" }}>
                      <Box mr={1}>
                      <Link target="_blank" href={tweet.user_profile_url}>
                        <Typography variant="h6" color="textPrimary" >Username</Typography>
                      </Link>
                      </Box>
                      <Typography variant="body2" color="textPrimary">{tweet.date}</Typography>
                      <Box my={1}>
                      <Grid container item xs={12} >
                        <Link target="_blank" href={tweet.url}>
                        <Typography variant="body1" color="textPrimary" align="left">{tweet.text}</Typography>
                        </Link>
                      </Grid>
                    </Box>
                    </Grid>
                    <Grid container item xs={12} style={{alignItems: "center" }}>
                        <Grid container item xs={11} >
                          <FavoriteIcon color="warning" />
                          <Box mr={2}>
                            <Typography variant="subtitle2" color="textPrimary">{tweet.score}</Typography>
                          </Box>
                          <RepeatIcon color="success" />
                          <Box mr={2}>
                            <Typography variant="subtitle2" color="textPrimary">{tweet.retweet_count}</Typography>
                          </Box>
                          <ChatBubbleOutlineIcon />
                          <Box mr={2}>
                            <Typography variant="subtitle2" color="textPrimary">{tweet.reply_count}</Typography>
                          </Box>
                          
                        </Grid>
                        <Grid container item xs={1}>
                            <Box float="right">
                            
                            {tweet.subjectivity == 0 &&
                            
                            <Grid container item xs={12}>
                            <SentimentNeutralIcon />
                            <Typography variant="caption">Neutral</Typography>
      
                            </Grid>
                            }
                            {tweet.subjectivity == 1 && tweet.polarity == 0 &&
                            
                            <Grid container item xs={12}>
                            <SentimentVeryDissatisfiedIcon />
                            <Typography variant="caption">Negative</Typography>
      
                            </Grid>
                            }
                            {tweet.subjectivity == 1 && tweet.polarity == 1 &&
                            
                            <Grid container item xs={12}>
 
                            <SentimentSatisfiedAltIcon />
                            <Typography variant="caption">Positive</Typography>
                            </Grid>
                            }
                            <Grid container item xs={12}>  
                              {tweet.sarcasm==1 ? <LightBulbIcon color="warning"/> : <Typography variant="caption">Sarcasm not detected.</Typography>}
                            </Grid>
                            </Box>

                        </Grid>
                    </Grid>
              </Grid>
            </Grid>
          </Paper>
          ))
}
        
        
</TabPanel>
<TabPanel value={value} index={1}>
{
          redditPosts.map(redditpost => (
          <Paper>
            <Grid container item xs={12}>
              <Grid container item xs={9}>
              <Grid container item xs={12} style={{alignItems: "baseline" }}>
                      <Box mr={1}>
                      <Link target="_blank" href={redditpost.user_profile_url}>
                        <Typography variant="h6" color="textPrimary" >{redditpost.author}</Typography>
                      </Link>
                      </Box>
                      <Typography variant="body2" color="textPrimary">{redditpost.date}</Typography>
                      <Box my={1}>
                      <Grid container item xs={12} >
                        <Link target="_blank" href={tweet.url}>
                        <Typography variant="body1" color="textPrimary" align="left">{redditpost.text}</Typography>
                        </Link>
                      </Grid>
                    </Box>
                    </Grid>
                    <Grid container item xs={12} style={{alignItems: "center" }}>
                        <Grid container item xs={11} >
                          <ThumbsUpDownIcon />
                          <Box mr={2}>
                            <Typography variant="subtitle2" color="textPrimary">{redditpost.score}</Typography>
                          </Box>
                          <ChatBubbleOutlineIcon />
                          <Box mr={2}>
                            <Typography variant="subtitle2" color="textPrimary">{redditpost.reply_count}</Typography>
                          </Box>
                          
                        </Grid>
                        <Grid container item xs={1}>
                            <Box float="right">
                            
                            {redditpost.subjectivity == 0 &&
                            
                            <Grid container item xs={12}>
                            <SentimentNeutralIcon />
                            <Typography variant="caption">Neutral</Typography>
      
                            </Grid>
                            }
                            {redditpost.subjectivity == 1 && redditpost.polarity == 0 &&
                            
                            <Grid container item xs={12}>
                            <SentimentVeryDissatisfiedIcon />
                            <Typography variant="caption">Negative</Typography>
      
                            </Grid>
                            }
                            {redditpost.subjectivity == 1 && redditpost.polarity == 1 &&
                            
                            <Grid container item xs={12}>
 
                            <SentimentSatisfiedAltIcon />
                            <Typography variant="caption">Positive</Typography>
                            </Grid>
                            }
                            <Grid container item xs={12}>  
                              {redditpost.sarcasm==1 ? <LightBulbIcon color="warning"/> : <Typography variant="caption">Sarcasm not detected.</Typography>}
                            </Grid>
                            </Box>

                        </Grid>
                    </Grid>
              </Grid>
            </Grid>
          </Paper>
          ))
}

</TabPanel>
<TabPanel value={value} index={2}>
{
          redditComments.map(redditcomment => (
          <Paper>
            <Grid container item xs={12}>
              <Grid container item xs={9}>
              <Grid container item xs={12} style={{alignItems: "baseline" }}>
                      <Box mr={1}>
                      <Link target="_blank" href={redditcomment.user_profile_url}>
                        <Typography variant="h6" color="textPrimary" >{redditcomment.author}</Typography>
                      </Link>
                      </Box>
                      <Typography variant="body2" color="textPrimary">{redditcomment.date}</Typography>
                      <Box my={1}>
                      <Grid container item xs={12} >
                        <Link target="_blank" href={tweet.url}>
                        <Typography variant="body1" color="textPrimary" align="left">{redditcomment.text}</Typography>
                        </Link>
                      </Grid>
                    </Box>
                    </Grid>
                    <Grid container item xs={12} style={{alignItems: "center" }}>
                        <Grid container item xs={11} >
                          <ThumbsUpDownIcon />
                          <Box mr={2}>
                            <Typography variant="subtitle2" color="textPrimary">{redditcomment.score}</Typography>
                          </Box>       
                        </Grid>
                        <Grid container item xs={1}>
                            <Box float="right">
                            
                            {redditcomment.subjectivity == 0 &&
                            
                            <Grid container item xs={12}>
                            <SentimentNeutralIcon />
                            <Typography variant="caption">Neutral</Typography>
      
                            </Grid>
                            }
                            {redditcomment.subjectivity == 1 && redditcomment.polarity == 0 &&
                            
                            <Grid container item xs={12}>
                            <SentimentVeryDissatisfiedIcon />
                            <Typography variant="caption">Negative</Typography>
      
                            </Grid>
                            }
                            {redditcomment.subjectivity == 1 && redditcomment.polarity == 1 &&
                            
                            <Grid container item xs={12}>
 
                            <SentimentSatisfiedAltIcon />
                            <Typography variant="caption">Positive</Typography>
                            </Grid>
                            }
                            <Grid container item xs={12}>  
                              {redditcomment.sarcasm==1 ? <LightBulbIcon color="warning"/> : <Typography variant="caption">Sarcasm not detected.</Typography>}
                            </Grid>
                            </Box>

                        </Grid>
                    </Grid>
              </Grid>
            </Grid>
          </Paper>
          ))
}


</TabPanel>
        
  </Box>
</Container>
</Container>

  );
}

export default App;
