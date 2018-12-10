var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongodb = require('mongodb');
var session = require('express-session');
var fileStore = require('session-file-store')(session);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(session({
  secret: 'session_login', // 세션을 암호화
  resave: false,
  saveUninitialized: true,
  store: new fileStore() // 세션이 데이타를 저장하는 방법(파일형식)
}));
  // cookie: { secure: true } 삭제
  

// 몽고DB 연결
function connectDB() {
  var databaseUrl = "mongodb://:lepia:young1230@ds061335.mlab.com:61335/tictactoe1210";

  //DB 연결
  mongodb.connect(databaseUrl, function(err, database) { // database 객체
  if (err) throw err;
  console.log('DB 연결완료! :' + databaseUrl);
  app.set('database', database.db('tictactoe1210')); 
  // 연결된 객체를 app객체에 저장하여 처리 --> db의 폴더명을 명시
 });
}
connectDB();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
