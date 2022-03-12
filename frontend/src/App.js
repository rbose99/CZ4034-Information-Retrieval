import logo from './logo.svg';
import './App.css';
import PropTypes from 'prop-types';

function App() {

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
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <Grid container item xs={10} justify='center'> 

            <Grid container item sm={11} xs={10} justify='center'> 
              <TextField inputRef={searchQuery} variant="outlined" label="Search for" color="secondary" fullWidth/>
            </Grid>

            <Grid container item sm={1} xs={2} justify='center'> 
              <IconButton type="submit" onClick={handleSearchClick} className={classes.iconButton} aria-label="search">
                <SearchIcon />
              </IconButton>
            </Grid>

          </Grid>
    </div>
  );
}

export default App;
