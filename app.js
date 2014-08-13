var express = require('express')
  , path = require('path')
  , favicon = require('static-favicon')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , jf = require('jsonfile')
  , twitterAPI = require('node-twitter-api');

var sessions = {};

var twitter = new twitterAPI({
  consumerKey: 'UULp68nRd4KrnHYHhK8UonF4R',
  consumerSecret: 'SbQhlqwBjHY7UdJsn1tDoyaMGAeyUBxrsUTThp17NF1ReEW36C',
  callback: 'http://dev.oliverfaircliff.com:6002/loggedin'
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Home page
app.get('/', function(req, res) {
  res.render('index', { title: 'Twitter TV Reminder - Home' });
});

// Get request token, then redirect user to Twitter login page to get access token.
app.get('/login', function(req, res) {
  console.log('login')
  twitter.getRequestToken(function(err, request_token, request_token_secret, twit_res){
    if (err) {
      console.log('Error getting OAuth request token:', err);
    } else {

      sessions[request_token] = {};
      sessions[request_token]['request_token_secret'] = request_token_secret;

      res.status(302);
      res.setHeader('Location', 'https://twitter.com/oauth/authenticate?oauth_token=' + request_token);
      res.end();
    }
  });
});

// Twitter sends user back here, ask for access token.
app.get('/loggedin', function(req, res) {
  console.log('loggedin')

  // We now have a request token
  var request_token = req.param('oauth_token');
  var request_token_secret = sessions[request_token];
  var oauth_verifier = req.param('oauth_verifier');

  // Get access token with request token.
  twitter.getAccessToken(
    request_token,
    request_token_secret,
    oauth_verifier,
    function(err, access_token, access_token_secret, twit_res) {
      if (err) {
        console.log('Error getting OAuth access token:', err);
      } else {

        sessions[request_token]['access_token'] = access_token;
        sessions[request_token]['access_token_secret'] = access_token_secret;

        // Success! Now get screen name so we can move the tokens into users JSON
        twitter.verifyCredentials(
          access_token,
          access_token_secret,
          function(err, data, twit_res) {
            if (err) {
              console.log('Error verifying credentials:', err);
            } else {

              var username = data["screen_name"];
              res.end('Welcome '+ username + '!');

              jf.readFile('users.json', function (err, users) {
                if (err) {
                  console.log('Error opening users.json:', err);
                }
                if (!users[username]) {
                  users[username] = {
                    'reminder_ids': [],
                    'access_token': access_token,
                    'access_token_secret': access_token_secret
                  }
                } else {
                  users[username]['access_token'] = access_token;
                  users[username]['access_token_secret'] = access_token_secret;
                }
                jf.writeFile('users.json', users, function (err) {
                  if (err) {
                    console.log('Error saving users.json:', err);
                  }
                });
                delete sessions[request_token];
              });
            }
          }
        );
      }
    }
  );
});

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var server = app.listen(6002, function () {
  console.log('Listening on port %d', server.address().port);
})
