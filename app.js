// express and http
var express = require('express');
var app = express();
var http = require('http').Server(app);

// view engine setup
var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// logging
var logger = require('morgan');
app.use(logger('dev'));

// Sockets
var io = require('socket.io').listen(http);
io.on('connection', function(socket){
  console.log('a user connected');
});

var routes = require('./routes/index');

// Unused (for now) cookies and favicons
//var favicon = require('serve-favicon');
//var cookieParser = require('cookie-parser');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

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

module.exports = app;
