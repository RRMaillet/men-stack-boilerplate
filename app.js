'use strict';

require('dotenv').config();
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const createError = require('http-errors');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const passport = require('passport');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const app = express();


const User = require('./models/user');
const winston = require('./config');


//Include Routes
const indexRouter = require('./routes/index');

//Set Up Mongo/Mongoose Connectivity
mongoose.connect(`mongodb://localhost:27017/test`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

//Moongoose event catcher/logger
const db = mongoose.connection;
db.on('error', console.log.bind(console, 'Connection Error!'));
db.on('disconnected', console.log.bind(console, 'Connection Closed'));
db.once('open', () => {
  console.log(`We're connected!`);
});
process.on('SIGINT', () => {
  db.close(console.log.bind(console, 'Connection Closed due to Application Termination'));
  process.exit(0);
});


// view engine setup and Default Folder mapping
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

//Body Parser & Cookie Parser Setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());

//Console Logger using both morgan AND winston
app.use(morgan('combined', {
  stream: winston.stream
}));


/*Method Override and Flash Messaging */
app.use(methodOverride("_method"));
app.use(flash());


//PASSPORT INITIALISATION
app.use(session({
  secret: 'Test Secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Configure res.locals
app.use(function (req, res, next) {
  //If we have a logged in user, config req.user to pass to currentUser 
  if (req.user) {
    res.locals.currentUser = req.user;
  }
  //If the environment Variable is set to Production, enable Flash Messages
  if (req.app.get('env') === 'production') {
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
  }
  next();
});

//Route Mounts
app.use('/', indexRouter);





//ERROR PROCESSING

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;