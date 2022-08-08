var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var mysql = require('mysql2');
var fileUpload = require('express-fileupload');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));

function connectDB() {
  var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mainwiki3',
  });
  con.connect(function(err) {
      if (err) {
          console.log("MySQL is not connected.");
          throw err;
      }
      console.log("Connected to MySQL!");
  });
  return con;
}

app.get("/", (req, res) => {
  res.send("Welcome to MainWiki 3");
});

function getCategoryId(category_name, cb) {
  var con = connectDB();
  var sql = "SELECT id FROM categories WHERE name = ?;";

  con.query(sql, [category_name], function(err, result) {
      if (result.length > 0) {
        cb({status: "OK", data: result[0]['id']})
      }
      else {
        cb({status: "NOK", error: "This category doesn't exist."});
      }
  });
}

function assignCategoryToFile(file_id, category_id) {
  var con = connectDB();

  var sql = "INSERT INTO files_categories (file_id, category_id) VALUES (?, ?);";

  con.query(sql, [file_id, category_id], function(err, result) {
    console.log(result);
  });
};

function getTagId(tag_name, cb) {
  var con = connectDB();
  var sql = "SELECT id FROM tags WHERE name = ?;";

  con.query(sql, [tag_name], function(err, result) {
      if (result.length > 0) {
        cb({status: "OK", data: result[0]['id']});
      }
      else {
        cb({status: "NOK", error: "This tag doesn't exist."});
      }
  });
}

function assignTagToFile(file_id, tag_id) {
  var con = connectDB();

  var sql = "INSERT INTO files_tags (file_id, tag_id) VALUES (?, ?);";

  con.query(sql, [file_id, tag_id], function(err, result) {
    console.log(result);
  });
};

function insertNewTag(tag_name, cb) {
  var con = connectDB();
  var sql = "INSERT INTO tags (name) VALUES (?);";

  con.query(sql, [tag_name], function(err, result) {
    cb({status: "OK", data: result.insertId});
  });
}

function insertNewCategory(category_name, parentCategoryId, cb) {
  var con = connectDB();
  var sql = "INSERT INTO categories (name, parent_id) VALUES (?, ?);";

  con.query(sql, [category_name, parentCategoryId], function(err, result) {
    cb({status: "OK", data: result.insertId});
  });
}

app.get("/api/categories/list", (req, res) => {
  var con = connectDB();

  var sql = "SELECT * FROM categories;";

  con.query(sql, function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no categories."});
    }
  });
});

app.post("/api/categories/insert", (req, res) => {
  var category = req.body.category;
  var parentCategory = req.body.parentCategory;
  getCategoryId(parentCategory, function(result) {
    insertNewCategory(category, result.data, function() {
      res.json({status: "OK", data: "A new category has been inserted."})
    });
  });
});

app.post("/api/tags/insert", (req, res) => {
  var tag = req.body.tag;
  insertNewTag(tag, function(result) {
    if (result.status == "OK") {
      res.json({status: "OK", data: "A new tag was added successfully."});
    }
    else {
      res.json({status: "NOK", error: "There was an error inserting the tag."});
    }
  });
});

app.post("/api/files/insert", (req, res) => {
  var title = req.body.title;
  var content = req.body.content;
  var extension = req.body.extension;
  var parentCategory = req.body.parentCategory;
  var category = req.body.category;
  var tags = req.body.tags;

  var con = connectDB();
  var sql = "INSERT INTO files (title, content, extension) VALUES (?, ?, ?);";
  con.query(sql, [title, content, extension], function(err, result) {
      if (err) {
          console.log(err);
          return;
      }
      var file_id = result.insertId;
      getCategoryId(category, function(result) {
        if (result.status == "OK") {
          assignCategoryToFile(file_id, result.data);
        }
        else {
          getGategoryId(parentCategory, function(result) {
            var parentCategoryId = result.data;
            insertNewCategory(category, parentCategoryId, function(result) {
              assignCategoryToFile(file_id, result.data);
            });
          });
        }
        var tags_arr = tags.split(",");
        for (var i in tags_arr) {
          getTagId(tags_arr[i], function(result) {
            if (result.status == "OK") {
              assignTagToFile(file_id, result.data);
            }
            else {
              insertNewTag(tags_arr[i], function(result) {
                assignTagToFile(file_id, result.data);
              });
            }
            res.json({status: "OK", data: "A file has been inserted successfully."});
          });
        }
      });
      
  });
});

app.get("/api/files/get-files-from-category", (req, res) => {
  var category_id = req.query.id;

  console.log(category_id);
  var con = connectDB();
  var sql = "SELECT f.* FROM files AS f INNER JOIN files_categories AS fc ON fc.file_id = f.id WHERE fc.category_id = ?";

  con.query(sql, [category_id], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    console.log(result);
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no files under this category."});
    }
  });
});

app.post('/api/upload-media-file', function(req, res) {
  if (!req.files) {
    console.log("No file has been detected.")
  }
  console.log(req.files);
});

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
