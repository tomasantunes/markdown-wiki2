var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var mysql = require('mysql2');
var mysql_async = require('mysql2/promise');
var fileUpload = require('express-fileupload');
var secretConfig = require('./secret-config.json');
var { extension } = require('mime-types');
var session = require('express-session');
var database = require('./libs/database');

var indexRouter = require('./routes/index');
var viewsRouter = require('./routes/views');
var authRouter = require('./routes/auth');
var categoriesRouter = require('./routes/categories');
var bookmarksRouter = require('./routes/bookmarks');
var dashboardRouter = require('./routes/dashboard');
var exportRouter = require('./routes/export');
var externalRouter = require('./routes/external');
var filesRouter = require('./routes/files');
var imagesRouter = require('./routes/images');
var importRouter = require('./routes/import');
var tagsRouter = require('./routes/tags');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('trust proxy', true)

app.use(logger('dev'));
app.use(express.json({ extended: false, limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: false, parameterLimit: 50000 }))
app.use(cookieParser());
app.use(cors());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));
app.use(session({
  secret: secretConfig.SESSION_KEY,
  resave: false,
  saveUninitialized: true
}));

app.use('/', indexRouter);
app.use(express.static(path.resolve(__dirname) + '/frontend/dist'));
app.use('/', viewsRouter);
app.use('/', authRouter);
app.use('/', categoriesRouter);
app.use('/', bookmarksRouter);
app.use('/', dashboardRouter);
app.use('/', exportRouter);
app.use('/', externalRouter);
app.use('/', filesRouter);
app.use('/', imagesRouter);
app.use('/', importRouter);
app.use('/', tagsRouter);


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
