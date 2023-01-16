var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var mysql = require('mysql2');
var fileUpload = require('express-fileupload');
var secretConfig = require('./secret-config.json');
const { extension } = require('mime-types');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');
var session = require('express-session');
var editJson = require("edit-json-file");

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

var con = mysql.createPool({
  connectionLimit : 90,
  host: 'localhost',
  user: 'root',
  password: secretConfig.DB_PASSWORD,
  database: 'mainwiki3',
});

function getCategoryId(category_name, cb) {
  var sql = "SELECT id FROM categories WHERE name = ?;";

  con.query(sql, [category_name], function(err, result) {
      if (result.length > 0) {
        cb({status: "OK", data: result[0]['id']});
      }
      else {
        cb({status: "NOK", error: "This category doesn't exist."});
      }
  });
}

function getTagId(tag_name, cb) {
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
  var sql = "INSERT INTO files_tags (file_id, tag_id) VALUES (?, ?);";

  con.query(sql, [file_id, tag_id], function(err, result) {
    console.log(result);
  });
};

function insertNewTag(tag_name, cb) {
  var sql = "INSERT INTO tags (name) VALUES (?);";

  con.query(sql, [tag_name], function(err, result) {
    cb({status: "OK", data: result.insertId});
  });
}

function insertNewCategory(category_name, parentCategoryId, cb) {
  var sql = "INSERT INTO categories (name, parent_id) VALUES (?, ?);";

  con.query(sql, [category_name, parentCategoryId], function(err, result) {
    cb({status: "OK", data: result.insertId});
  });
}

app.get("/api/categories/list", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

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
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var category = req.body.category;
  var parentCategoryId = req.body.parentCategory;
  insertNewCategory(category, parentCategoryId, function() {
    res.json({status: "OK", data: "A new category has been inserted."})
  });
});

app.post("/api/tags/insert", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

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
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

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
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var title = req.body.title;
  var content = req.body.content;
  var extension = req.body.extension;
  var category_id = req.body.category;
  var tags = req.body.tags;

  var sql = "INSERT INTO files (title, content, extension, category_id) VALUES (?, ?, ?, ?);";
  con.query(sql, [title, content, extension, category_id], function(err, result) {
    if (err) {
        console.log(err);
        return;
    }
    var file_id = result.insertId;
    if (tags != "" && tags != undefined) {
      var tags_arr = tags.split(",");
      for (var i in tags_arr) {
        getTagId(tags_arr[i], function(result) {
          if (result.status == "OK") {
            assignTagToFile(file_id, result.data);
          }
          else {
            res.json({status: "NOK", error: "Tag not found."});
            return;
          }
        });
      }
    }
    res.json({status: "OK", data: "A file has been inserted successfully."});
  });
});

app.get("/api/files/get-files-from-category", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var category_id = req.query.id;
  var text_file_extensions = ["txt", "md", "csv", "json"]

  console.log(category_id);
  var sql = "SELECT f.* FROM files AS f WHERE f.category_id = ? AND f.extension IN (?)";

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
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var category_id = req.query.id;
  var image_file_extensions = ['jpg', 'jpeg', 'gif', 'png', 'jfif', 'webp']

  console.log(category_id);
  var sql = "SELECT f.* FROM files AS f WHERE f.category_id = ? AND f.extension IN (?)";

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
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var file_id = req.query.id;

  var sql = "SELECT f.*, c.parent_id, c.name AS category_name FROM files As f INNER JOIN categories AS c ON c.id = f.category_id WHERE f.id = ?;";

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

app.get("/api/files/search", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var searchQuery = req.query.searchQuery;

  var sql = "SELECT f.title AS name, 'file' AS type, c.id AS category_id FROM files f INNER JOIN categories c ON c.id = f.category_id WHERE f.title LIKE ? OR f.content LIKE ? OR c.name LIKE ?";

  con.query(sql, ['%' + searchQuery + '%', '%' + searchQuery + '%', '%' + searchQuery + '%'], function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }

    var sql2 = "SELECT c.name, 'category' AS type FROM categories c WHERE c.name LIKE ?";

    con.query(sql2, ['%' + searchQuery + '%'], function(err2, result2) {
      if (err2) {
        console.log(err2);
        res.json({status: "NOK", error: err2.message});
        return;
      }
      console.log(result2);
      var sql3 = "SELECT t.name, 'tag' AS type FROM tags t WHERE t.name LIKE ?";
      con.query(sql3, ['%' + searchQuery + '%'], function(err3, result3) {
        if (err3) {
          console.log(err3);
          res.json({status: "NOK", error: err3.message});
          return;
        }
        var search_results = [...result2, ...result3, ...result];
        if (search_results.length > 0) {
          res.json({status: "OK", data: search_results});
        }
        else {
          res.json({status: "NOK", error: "No results have been found."});
        }
      });
    });
  });

});

app.post("/api/files/delete", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.body.id;

  var sql = "DELETE FROM files WHERE id = ?;";
  con.query(sql, [id], function(err, result) {
    var sql2 = "DELETE FROM files_tags WHERE file_id = ?;";
    con.query(sql2, [id], function(err2, result2) {
      res.json({status: "OK", data: "File has been deleted successfully."});
    }) 
  });
});

function checkCategory(file_id, category_id, cb) {
  var sql = "SELECT * FROM files WHERE file_id = ? AND category_id = ?;";
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

function deleteTagsFromFile(file_id, cb) {
  var sql = "DELETE FROM files_tags WHERE file_id = ?;";
  con.query(sql, [file_id], function(err, result) {
    cb(true);
  });
}

app.post("/api/files/edit", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.body.id;
  var title = req.body.title;
  var content = req.body.content;
  var category_id = req.body.category;
  var tags = req.body.tags;
  var extension = req.body.extension;

  console.log(category_id);

  var sql = "UPDATE files SET title = ?, content = ?, extension = ?, category_id = ? WHERE id = ?;";
  con.query(sql, [title, content, extension, category_id, id], function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    if (tags == undefined || tags == "") {
      deleteTagsFromFile(id, function(result) {
        console.log("Tags have been deleted.")
      });
    }
    else {
      var tags_arr = tags.split(",");
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
      });
    }
    res.json({status: "OK", data: "File has been edited successfully."});
  });
});

app.post("/api/files/append", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.body.id;
  var content = "\n" + req.body.content;

  var sql = "UPDATE files SET content = CONCAT(content, ?) WHERE id = ?;";
  con.query(sql, [content, id], function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: "File has been appended successfully."});
  });
});

app.post('/api/upload-media-file', function(req, res) {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  if (!req.files) {
    console.log("No file has been detected.");
    res.json({status: "NOK", error: "No file has been detected."});
    return;
  }
  console.log(req.files);
  var category_id = req.body.category;
  var tags = req.body.tags;
  const file = req.files.file;
  var new_filename = crypto.randomBytes(16).toString('hex');
  const filepath = __dirname + "/media-files/" + new_filename + path.extname(file.name);
  const filepath2 = "media-files/" + new_filename + path.extname(file.name);

  file.mv(filepath, (err) => {
    if (err) {
      return res.json({status: "NOK", error: err.message});
    }

    var sql = "INSERT INTO files (title, path, extension, category_id) VALUES (?, ?, ?, ?)";

    con.query(sql, [path.basename(file.name, path.extname(file.name)), filepath2, path.extname(file.name).replace(".", ""), category_id], function(err, result) {
      if (err) {
        console.log(err);
        return;
      }

      var file_id = result.insertId;

      if (tags != "" && tags != undefined) {
        var tags_arr = tags.split(",");
        for (var i in tags_arr) {
          getTagId(tags_arr[i], function(result) {
            if (result.status == "OK") {
              assignTagToFile(file_id, result.data);
            }
            else {
              console.log("Tag not found.");
            }
            
          });
        }
      }
      res.json({status: "OK", data: "A file has been inserted successfully."});
    });
  });
});

function downloadImage(imageUrl, category_id, tags, cb) {
  axios
  .get(imageUrl, {
    responseType: 'arraybuffer'
  })
  .then(response => {
    var buffer = Buffer.from(response.data, 'binary');
    const contentType = response.headers['content-type'];
    const ext = extension(contentType);
    var new_filename = crypto.randomBytes(16).toString('hex');
    const filepath = __dirname + "/media-files/" + new_filename + ext;
    const filepath2 = "media-files/" + new_filename + ext;
    fs.writeFile(filepath, buffer, () => {
      console.log('File has been saved.');

      var sql = "INSERT INTO files (title, path, extension, category_id) VALUES (?, ?, ?, ?)";

      con.query(sql, [new_filename, filepath2, ext, category_id], function(err, result) {
        if (err) {
          console.log(err);
          return;
        }

        var file_id = result.insertId;

        if (tags != "" && tags != undefined) {
          var tags_arr = tags.split(",");
          for (var i in tags_arr) {
            getTagId(tags_arr[i], function(result) {
              if (result.status == "OK") {
                assignTagToFile(file_id, result.data);
              }
              else {
                console.log("Tag not found.");
              }
            });
          }
        }
        cb({status: "OK", data: "A file has been inserted successfully."});
      });
    });
  })
  .catch(function(err) {
    console.log(err.message);
    cb({status: "NOK", error: err.message});
  });
  
}

app.post('/api/upload-image-url', function(req, res) {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var imageUrl = req.body.imageUrl;
  var category_id = req.body.category;
  var tags = req.body.tags;

  console.log(imageUrl);
  downloadImage(imageUrl, category_id, tags, function(result) {
    res.json(result);
  })
});

app.get("/api/images/get/:filename", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var filename = req.params.filename;
  res.sendFile(__dirname + "/media-files/" + filename);
});

app.get("/api/bookmarks", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  res.sendFile(__dirname + "/bookmarks/bookmarks.txt");
});

app.get("/login/:secret_token", (req, res) => {
  var secret_token = req.params.secret_token;

  if (secret_token == secretConfig.SECRET_TOKEN) {
    req.session.isLoggedIn = true;
    let file = editJson(`${__dirname}/sessions.json`);
    var dt = new Date().toUTCString();
    file.append("sessions", {login_date: dt});
    file.save();
    res.redirect("/");
  }
  else {
    res.send("Invalid authorization.");
  }
});

app.use(express.static('main-wiki3-frontend/build'));

app.get('/*', (req,res) => {
  console.log(req.session.isLoggedIn);
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

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
