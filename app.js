var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var mysql = require('mysql2');
var fileUpload = require('express-fileupload');
var secretConfig = require('./secret-config.json');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));

function connectDB() {
  var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: secretConfig.DB_PASSWORD,
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

  con.query(sql, [], function(err, result) {
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

app.get("/api/tags/list", (req, res) => {
  var con = connectDB();

  var sql = "SELECT * FROM tags;";

  con.query(sql, [], function(err, result) {
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

app.post("/api/files/insert", (req, res) => {
  var title = req.body.title;
  var content = req.body.content;
  var extension = req.body.extension;
  var category = req.body.category;
  var tags = req.body.tags;
  console.log(tags);
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
        if (tags != "") {
          var tags_arr = tags.split(",");
          var len = tags_arr.length;
          for (var i in tags_arr) {
            getTagId(tags_arr[i], function(result) {
              if (result.status == "OK") {
                assignTagToFile(file_id, result.data);
              }
              else {
                console.log("x2");
                res.json({status: "NOK", error: "Tag not found."});
                return;
              }
            });
          }
        }
        res.json({status: "OK", data: "A file has been inserted successfully."});
      }
      else {
        res.json({status: "NOK", error: "Category not found."});
        return;
      }
    });
  });
});

app.get("/api/files/get-files-from-category", (req, res) => {
  var category_id = req.query.id;
  var text_file_extensions = ["txt", "md", "csv", "json"]

  console.log(category_id);
  var con = connectDB();
  var sql = "SELECT f.* FROM files AS f INNER JOIN files_categories AS fc ON fc.file_id = f.id WHERE fc.category_id = ? AND f.extension IN (?)";

  con.query(sql, [category_id, text_file_extensions], function(err, result) {
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

app.get("/api/files/get-image-files-from-category", (req, res) => {
  var category_id = req.query.id;
  var image_file_extensions = ['jpg', 'jpeg', 'gif', 'png', 'jfif', 'webp']

  console.log(category_id);
  var con = connectDB();
  var sql = "SELECT f.* FROM files AS f INNER JOIN files_categories AS fc ON fc.file_id = f.id WHERE fc.category_id = ? AND f.extension IN (?)";

  con.query(sql, [category_id, image_file_extensions], function(err, result) {
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

app.get("/api/files/getone", (req, res) => {
  var file_id = req.query.id;

  var con = connectDB();
  var sql = "SELECT f.*, fc.category_id, c.parent_id, c.name AS category_name FROM files As f INNER JOIN files_categories AS fc ON fc.file_id = f.id INNER JOIN categories AS c ON c.id = fc.category_id WHERE f.id = ?;";

  con.query(sql, [file_id], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    console.log(result);
    if (result.length > 0) {
      var sql2 = "SELECT t.id, t.name FROM tags AS t INNER JOIN files_tags AS ft ON t.id = ft.tag_id WHERE ft.file_id = ?;";
      con.query(sql2, [file_id], function(err2, result2) {
        if (err2) {
          console.log(err2.message);
          res.json({status: "NOK", error: err2.message});
        }
        var file = result[0];
        console.log(result2);
        if (result2.length > 0) {
          var tags = [];
          for (var i in result2) {
            tags.push(result2[i]['name'])
          }
          file['tags'] = tags.join(",")
        }
        else {
          console.log("No tags have been found.");
        }
        res.json({status: "OK", data: file});
      }); 
    }
    else {
      res.json({status: "NOK", error: "File not found."});
    }
  });
});

app.post("/api/files/delete", (req, res) => {
  var id = req.body.id;

  var con = connectDB();
  var sql = "DELETE FROM files WHERE id = ?;";
  con.query(sql, [id], function(err, result) {
    var sql2 = "DELETE FROM files_categories WHERE file_id = ?;";
    con.query(sql2, [id], function(err2, result2) {
      var sql3 = "DELETE FROM files_tags WHERE file_id = ?;";
      con.query(sql3, [id], function(err3, result3) {
        res.json({status: "OK", data: "File has been deleted successfully."});
      }) 
    });
  });
});

function checkCategory(file_id, category_id, cb) {
  var con = connectDB();
  var sql = "SELECT * FROM files_categories WHERE file_id = ? AND category_id = ?;";
  con.query(sql, [file_id, category_id], function(err, result) {
    if (result.length > 0) {
      cb(true);
    }
    else {
      cb(false);
    }
  })
}

function checkTag(file_id, tag_id, cb) {
  var con = connectDB();
  var sql = "SELECT * FROM files_tags WHERE file_id = ? AND tag_id = ?;";
  con.query(sql, [file_id, tag_id], function(err, result) {
    if (result.length > 0) {
      cb(true);
    }
    else {
      cb(false);
    }
  })
}

function deleteCategoryFromFile(file_id, cb) {
  var con = connectDB();
  var sql = "DELETE FROM files_categories WHERE file_id = ?;";
  con.query(sql, [file_id], function(err, result) {
    cb(true);
  });
}

function deleteTagsFromFile(file_id, cb) {
  var con = connectDB();
  var sql = "DELETE FROM files_tags WHERE file_id = ?;";
  con.query(sql, [file_id], function(err, result) {
    cb(true);
  });
}

app.post("/api/files/edit", (req, res) => {
  var id = req.body.id;
  var title = req.body.title;
  var content = req.body.content;
  var category = req.body.category;
  var tags = req.body.tags;
  var extension = req.body.extension;

  var con = connectDB();
  var sql = "UPDATE files SET title = ?, content = ?, extension = ? WHERE id = ?;";
  con.query(sql, [title, content, extension, id], function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    getCategoryId(category, function(result) {
      var category_id = result.data;
      checkCategory(id, category_id, function(exists) {
        if (!exists) {
          deleteCategoryFromFile(id, function(result) {
            assignCategoryToFile(id, category_id);
          });
        }
      });
    });
    console.log("x1");
    var tags_arr = tags.split(",");
    console.log(tags_arr);
    console.log("x2");
    deleteTagsFromFile(id, function(result) {
      for (var i in tags_arr) {
        getTagId(tags_arr[i], function(result) {
          if (result.status == "OK") {
            assignTagToFile(id, result.data);
          }
          else {
            res.json({status: "NOK", error: "Tag not found."});
          }
        });
      }
      res.json({status: "OK", data: "File has been edited successfully."});
    });
  });
});

app.post('/api/upload-media-file', function(req, res) {
  if (!req.files) {
    console.log("No file has been detected.");
    res.json({status: "NOK", error: "No file has been detected."});
    return;
  }
  console.log(req.files);
  var parentCategory = req.body.parentCategory;
  var category = req.body.category;
  var tags = req.body.tags;
  const file = req.files.file;
  const filepath = __dirname + "/media-files/" + file.name;
  const filepath2 = "media-files/" + file.name;

  file.mv(filepath, (err) => {
    if (err) {
      return res.json({status: "NOK", error: err.message});
    }

    var con = connectDB();
    var sql = "INSERT INTO files (title, path, extension) VALUES (?, ?, ?)";

    con.query(sql, [path.basename(file.name, path.extname(file.name)), filepath2, path.extname(file.name).replace(".", "")], function(err, result) {
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
});

app.get("/api/images/get/:filename", (req, res) => {
  var filename = req.params.filename;
  res.sendFile(__dirname + "/media-files/" + filename);
});

app.use(express.static('main-wiki3-frontend/build'));

app.get('/*', (req,res) => {
  res.sendFile(path.resolve(__dirname) + '/main-wiki3-frontend/build/index.html');
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
