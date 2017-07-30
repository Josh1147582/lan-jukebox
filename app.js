// express and http
var express = require('express');
var app = express();
// Create the server here, so socket.io can control it.
var server = require('http').Server(app);

var io = require('socket.io')(server);

// view engine setup
var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// logging
var logger = require('morgan');
app.use(logger('dev'));

var routes = require('./routes/index')(io);

// Unused (for now) cookies and favicons
//var favicon = require('serve-favicon');
//var cookieParser = require('cookie-parser');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// // Add socket.io to res in the event loop.
// app.use(function(req, res, next){
//   res.io = io;
//   next();
// });

// Add the route.
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

// Export the server to bin/www, since we're creating it here.
module.exports = {app: app, server: server, io: io};

