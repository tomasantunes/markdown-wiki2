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

function connectDB() {
  var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: secretConfig.DB_PASSWORD,
    database: 'markdownwiki2',
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
        cb({status: "OK", data: result[0]['id']});
      }
      else {
        cb({status: "NOK", error: "This category doesn't exist."});
      }
      con.end();
  });
}

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
      con.end();
  });
}

function assignTagToFile(file_id, tag_id) {
  var con = connectDB();

  var sql = "INSERT INTO files_tags (file_id, tag_id) VALUES (?, ?);";

  con.query(sql, [file_id, tag_id], function(err, result) {
    console.log(result);
    con.end();
  });
};

function insertNewTag(tag_name, cb) {
  var con = connectDB();
  var sql = "INSERT INTO tags (name) VALUES (?);";

  con.query(sql, [tag_name], function(err, result) {
    cb({status: "OK", data: result.insertId});
    con.end();
  });
}

function insertNewCategory(category_name, parentCategoryId, cb) {
  var con = connectDB();
  var sql = "INSERT INTO categories (name, parent_id) VALUES (?, ?);";

  con.query(sql, [category_name, parentCategoryId], function(err, result) {
    cb({status: "OK", data: result.insertId});
    con.end();
  });
}

app.get("/api/categories/list", (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  console.log(ip);
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
    return;
  }

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
    con.end();
  });
});

app.post("/api/categories/insert", (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
    return;
  }

  var category = req.body.category;
  var parentCategory = req.body.parentCategory;
  getCategoryId(parentCategory, function(result) {
    insertNewCategory(category, result.data, function() {
      res.json({status: "OK", data: "A new category has been inserted."})
    });
  });
});

app.post("/api/tags/insert", (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
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
    con.end();
  });
});

app.post("/api/files/insert", (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  console.log(ip);
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
    return;
  }

  var title = req.body.title;
  var content = req.body.content;
  var extension = req.body.extension;
  var category_id = req.body.category;
  var tags = req.body.tags;

  var con = connectDB();
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
    con.end();
  });
});

app.get("/api/files/get-files-from-category", (req, res) => {
  var category_id = req.query.id;
  var text_file_extensions = ["txt", "md", "csv", "json"]

  console.log(category_id);
  var con = connectDB();
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
    con.end();
  });
});

app.get("/api/files/get-image-files-from-category", (req, res) => {
  var category_id = req.query.id;
  var image_file_extensions = ['jpg', 'jpeg', 'gif', 'png', 'jfif', 'webp']

  console.log(category_id);
  var con = connectDB();
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
    con.end();
  });
});

app.get("/api/files/getone", (req, res) => {
  var file_id = req.query.id;

  var con = connectDB();
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
        con.end();
      }); 
    }
    else {
      res.json({status: "NOK", error: "File not found."});
    }
  });
});

app.get("/api/files/search", (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
    return;
  }

  var searchQuery = req.query.searchQuery;

  var con = connectDB();
  var sql = "SELECT f.id, f.title, c.name AS category_name, c2.name AS parent_category_name FROM files f INNER JOIN categories c ON c.id = f.category_id INNER JOIN categories c2 ON c.parent_id = c2.id WHERE title LIKE ? OR content LIKE ?"

  con.query(sql, ['%' + searchQuery + '%', '%' + searchQuery + '%'], function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "No results have been found."});
    }
    con.end();
  });

});

app.post("/api/files/delete", (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
    return;
  }

  var id = req.body.id;

  var con = connectDB();
  var sql = "DELETE FROM files WHERE id = ?;";
  con.query(sql, [id], function(err, result) {
    var sql2 = "DELETE FROM files_tags WHERE file_id = ?;";
    con.query(sql2, [id], function(err2, result2) {
      res.json({status: "OK", data: "File has been deleted successfully."});
      con.end();
    }) 
  });
});

function checkCategory(file_id, category_id, cb) {
  var con = connectDB();
  var sql = "SELECT * FROM files WHERE file_id = ? AND category_id = ?;";
  con.query(sql, [file_id, category_id], function(err, result) {
    if (result.length > 0) {
      cb(true);
    }
    else {
      cb(false);
    }
    con.end();
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
    con.end();
  })
}

function deleteTagsFromFile(file_id, cb) {
  var con = connectDB();
  var sql = "DELETE FROM files_tags WHERE file_id = ?;";
  con.query(sql, [file_id], function(err, result) {
    cb(true);
    con.end();
  });
}

app.post("/api/files/edit", (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
    return;
  }

  var id = req.body.id;
  var title = req.body.title;
  var content = req.body.content;
  var category_id = req.body.category;
  var tags = req.body.tags;
  var extension = req.body.extension;

  console.log(category_id);

  var con = connectDB();
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
    con.end();
  });
});

app.post("/api/files/append", (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
    return;
  }

  var id = req.body.id;
  var content = "\n" + req.body.content;

  var con = connectDB();
  var sql = "UPDATE files SET content = CONCAT(content, ?) WHERE id = ?;";
  con.query(sql, [content, id], function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: "File has been appended successfully."});
    con.end();
  });
});

app.post('/api/upload-media-file', function(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
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

    var con = connectDB();
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
      con.end();
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

      var con = connectDB();
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
        con.end();
      });
    });
  })
  .catch(function(err) {
    console.log(err.message);
    cb({status: "NOK", error: err.message});
  });
  
}

app.post('/api/upload-image-url', function(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
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
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
    return;
  }

  var filename = req.params.filename;
  res.sendFile(__dirname + "/media-files/" + filename);
});

app.get("/api/bookmarks", (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
    return;
  }

  res.sendFile(__dirname + "/bookmarks/bookmarks.txt");
});

app.use(express.static('markdown-wiki2-frontend/build'));

app.get('/*', (req,res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  if (!secretConfig.IP_WHITELIST.includes(ip)) {
    res.json({status: "NOK", error: "This IP is not authorized."});
    return;
  }

  res.sendFile(path.resolve(__dirname) + '/markdown-wiki2-frontend/build/index.html');
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
