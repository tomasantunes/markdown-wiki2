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
const { extension } = require('mime-types');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');
var session = require('express-session');
var editJson = require("edit-json-file");
const PythonShell = require('python-shell').PythonShell;
var nodemailer = require('nodemailer');
var getDockerHost = require('get-docker-host');
var isDocker = require('./is-docker.js');

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

var con = {};

var con2 = {};

function increaseTimeout() {
  con2.query('SET GLOBAL connect_timeout=28800')
  con2.query('SET GLOBAL interactive_timeout=28800')
  con2.query('SET GLOBAL wait_timeout=28800')
}

function startDatabaseConnection(db_host) {
  con = mysql.createPool({
    connectionLimit : 90,
    connectTimeout: 1000000,
    host: db_host,
    user: secretConfig.DB_USER,
    password: secretConfig.DB_PASSWORD,
    database: secretConfig.DB_NAME,
    port: secretConfig.DB_PORT
  });

  con2 = mysql_async.createPool({
    connectionLimit : 90,
    connectTimeout: 1000000,
    host: db_host,
    user: secretConfig.DB_USER,
    password: secretConfig.DB_PASSWORD,
    database: secretConfig.DB_NAME,
    port: secretConfig.DB_PORT
  });
}

checkDocker = () => {
  return new Promise((resolve, reject) => {
      if (isDocker()) {
          getDockerHost((error, result) => {
              if (result) {
                  resolve(result);
              } else {
                  reject(error);
              }
          });
      } else {
          resolve(null);
      }
  });
};

checkDocker().then((addr) => {
  if (addr) {
    console.log('Docker host is ' + addr);
    startDatabaseConnection(addr);
    increaseTimeout();
  } else {
    console.log('Not in Docker');
    startDatabaseConnection(addr);
    increaseTimeout();
  }
}).catch((error) => {
  console.log('Could not find Docker host: ' + error);
});

// Functions
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

function nthMostCommon(str, amount) {

  const stickyWords =[
    "the",
    "there",
    "by",
    "at",
    "and",
    "so",
    "if",
    "than",
    "but",
    "about",
    "in",
    "on",
    "the",
    "was",
    "for",
    "that",
    "said",
    "a",
    "or",
    "of",
    "to",
    "there",
    "will",
    "be",
    "what",
    "get",
    "go",
    "think",
    "just",
    "every",
    "are",
    "it",
    "were",
    "had",
    "i",
    "very",
    "we",
    "tu",
    "isso",
    "who",
    "don't",
    "it's",
    "my",
    "do",
    "going",
    "which",
    "when",
    "not",
    "não",
    "how",
    "e",
    "é",
    "o",
    "more",
    "your",
    "is",
    "can",
    "as",
    "toda",
    "faz",
    "have",
    "this",
    "they",
    "you",
    "i'm",
    "de",
    "que",
    "an",
    "from",
    "1",
    "any",
    "you're",
    "has",
    "because"
    ];
    str= str.toLowerCase();
    var splitUp = str.split(/\s/);
    const wordsArray = splitUp.filter(function(x){
    return !stickyWords.includes(x) ;
            });
    var wordOccurrences = {}
    for (var i = 0; i < wordsArray.length; i++) {
        wordOccurrences['_'+wordsArray[i]] = ( wordOccurrences['_'+wordsArray[i]] || 0 ) + 1;
    }
    var result = Object.keys(wordOccurrences).reduce(function(acc, currentKey) {
        /* you may want to include a binary search here */
        for (var i = 0; i < amount; i++) {
            if (!acc[i]) {
                acc[i] = { word: currentKey.slice(1, currentKey.length), occurences: wordOccurrences[currentKey] };
                break;
            } else if (acc[i].occurences < wordOccurrences[currentKey]) {
                acc.splice(i, 0, { word: currentKey.slice(1, currentKey.length), occurences: wordOccurrences[currentKey] });
                if (acc.length > amount)
                    acc.pop();
                break;
            }
        }
        return acc;
    }, []);
 
    return result;
}

async function saveBookmark(bookmark, ignore_folders, parent_id) {
  if (bookmark.type != "bookmark") {
    if (!ignore_folders) {
      var sql = "INSERT INTO bookmarks (title, type, parent_id) VALUES (?, 'folder', ?);";
      try {
        var result = await con2.query(sql, [bookmark.title, parent_id]);
        return {status: "OK", insertId: result[0].insertId, type: "folder"};
      }
      catch(err) {
        if (err.errno == 1062) {
          var sql2 = "SELECT id FROM bookmarks WHERE title = ? AND type <> 'bookmark' AND parent_id = ?;";
          var result2 = await con2.query(sql2, [bookmark.title, parent_id]);
          return {status: "OK", insertId: result2[0][0].id, type: "folder"};
        }
        return {status: "NOK"};
      }
    }
    else {
      console.log("A folder has been ignored.");
      return {status: "OK", type: "ignored_folder"};
    }
  }
  else if (bookmark.type == "bookmark") {
    try {
      var sql2 = "INSERT INTO bookmarks (title, url, type, parent_id) VALUES (?, ?, 'bookmark', ?);";
      var result2 = await con2.query(sql2, [bookmark.title || "", bookmark.url, parent_id]);
      return {status: "OK", type: "bookmark"};
    }
    catch(err) {
      if (err.errno == 1062) {
        var sql2 = "SELECT id FROM bookmarks WHERE url = ? AND type = 'bookmark';";
        var result2 = await con2.query(sql2, [bookmark.url]);
        return {status: "OK", insertId: result2[0][0].id, type: "bookmark"};
      }
      return {status: "NOK"};
    }
  }
}

function searchRecursively(arr, key, value) {
  let result = [];
  
  arr.forEach((obj) => {
    if (obj[key] === value) {
      result.push(obj);
    } else if (obj.children) {
      result = result.concat(searchRecursively(obj.children, key, value));
    }
  });
  return result;
}

async function saveBookmarksRecursively(bookmarks, ignore_folders, parent_id) {
  for (var i in bookmarks) {
    var bookmark = bookmarks[i];
    var result = await saveBookmark(bookmark, ignore_folders, parent_id);
    if (result.status == "OK") {
      console.log("+1 bookmark");
      if (result.type == "folder") {
        await saveBookmarksRecursively(bookmark.children, ignore_folders, result.insertId);
      }
      else if (result.type == "ignored_folder") {
        await saveBookmarksRecursively(bookmark.children, ignore_folders, parent_id);
      }
    }
    else {
      console.log("Error saving bookmark: " + (bookmark.title || "N/A"));
    }
  }
}

async function saveBookmarksToDatabase(bookmarks, import_folder, ignore_folders, target_folder) {
  var parent_id = 0
  if (target_folder != undefined) {
    parent_id = target_folder;
  }
  if (import_folder != "" && import_folder != undefined) {
    console.log("Before saveToDatabaseFromFolder().");
    var result = await saveBookmarksToDatabaseFromFolder(bookmarks, import_folder, ignore_folders, parent_id);
    if (result.status == "OK") {
      return {status: "OK"};
    }
    else {
      return {status: "NOK", error: result.error};
    }
  }
  else {
    await saveBookmarksRecursively(bookmarks, ignore_folders, parent_id);
    return {status: "OK"};
  }
}

async function saveBookmarksToDatabaseFromFolder(bookmarks, import_folder, ignore_folders, parent_id) {
  var folder_to_import = searchRecursively(bookmarks, "title", import_folder);
  if (folder_to_import.length > 0) {
    folder_to_import = folder_to_import[0];
    console.log(folder_to_import);
    var result = await saveBookmark(folder_to_import, ignore_folders, parent_id);
    if (result.status == "OK" && result.type == "folder") {
      var parent_id = result.insertId;
      await saveBookmarksRecursively(folder_to_import.children, ignore_folders, parent_id);
    }
    else if (result.status == "OK" && result.type == "ignored_folder") {
      await saveBookmarksRecursively(folder_to_import.children, ignore_folders, parent_id);
    }
    return {status: "OK"};
  }
  else {
    return {status: "NOK", error: "Folder not found."};
  }
}

// Dashboard Routes
app.get("/api/get-10-random-sentences", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var text_file_extensions = ["txt", "md"];

  var sql = "SELECT * FROM files WHERE extension IN (?) ORDER BY RAND() LIMIT 10;";
  con.query(sql, [text_file_extensions], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    var sentences = [];
    for (var i in result) {
      var content = result[i]['content'];
      var lines = content.split("\n");
      lines = lines.filter(function(line) {
        return line.trim() != "";
      });
      var random_line = lines[Math.floor(Math.random() * lines.length)];
      sentences.push(random_line);
    }
    res.json({status: "OK", data: sentences});
  });
});

app.get("/api/get-50-most-common-words", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var text_file_extensions = ["txt", "md"];

  var sql = "SELECT * FROM files WHERE extension IN (?)";
  con.query(sql, [text_file_extensions], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    var text = "";
    for (var i in result) {
      var content = result[i]['content'];
      text += content;
    }
    var words = nthMostCommon(text, 50);
    res.json({status: "OK", data: words});
  });
});

app.get("/api/get-top10-categories", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var sql = "SELECT categories.name, COUNT(files.category_id) AS count FROM files INNER JOIN categories ON files.category_id = categories.id GROUP BY files.category_id ORDER BY count DESC LIMIT 10;";
  con.query(sql, [], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result});
  });
});

app.get("/api/get-top10-tags", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var sql = "SELECT tags.name, COUNT(files_tags.tag_id) AS count FROM files_tags INNER JOIN tags ON files_tags.tag_id = tags.id GROUP BY files_tags.tag_id ORDER BY count DESC LIMIT 10;";
  con.query(sql, [], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result});
  });
});

app.get("/api/get-10-most-recent", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var sql = "SELECT * FROM files ORDER BY id DESC LIMIT 10;";
  con.query(sql, [], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no files."});
    }
  });
});

app.get("/api/get-10-largest", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var sql = "SELECT * FROM files ORDER BY CHAR_LENGTH(content) DESC LIMIT 10;";
  con.query(sql, [], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no files."});
    }
  });
});


// Categories CRUD Routes
app.get("/api/categories/list", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var sql = "SELECT id, parent_id, name, created_at, updated_at, IFNULL(sort_index, 99999999) AS sort_index FROM categories ORDER BY sort_index, name, id;";

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

app.get("/api/categories/getone", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.query.id;

  var sql = "SELECT * FROM categories WHERE id = ?;";

  con.query(sql, [id], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    if (result.length > 0) {
      res.json({status: "OK", data: result[0]});
    }
    else {
      res.json({status: "NOK", error: "Category not found."});
    }
  });
});

app.post("/api/categories/delete", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.body.id;

  var sql = "DELETE FROM categories WHERE id = ?;";

  con.query(sql, [id], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    var sql2 = "DELETE FROM files f INNER JOIN files_tags ft ON f.id = ft.file_id WHERE f.category_id = ?;";
    con.query(sql2, [id], function(err2, result2) {
      if (err) {
        console.log(err.message);
        res.json({status: "NOK", error: err2.message});
      }
      res.json({status: "OK", data: "This category has been deleted."});
    });
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

app.post("/api/categories/set-sort-index", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.body.id;
  var sort_index = req.body.sort_index;

  var sql = "UPDATE categories SET sort_index = ? WHERE id = ?;";

  con.query(sql, [sort_index, id], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "This category's sort index has been updated."});
  });
});


// Tags CRUD Routes
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


// Files Routes
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
  var text_file_extensions = ["txt", "md", "csv", "json"];

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
      res.json({status: "NOK", error: "There are no files under this category.", code: 101});
    }
  });
});

app.get("/api/files/get-files-from-tag", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var tag_id = req.query.id;
  var text_file_extensions = ["txt", "md", "csv", "json"];

  var sql = "SELECT f.* FROM files AS f INNER JOIN files_tags ft ON ft.file_id = f.id WHERE ft.tag_id = ? AND f.extension IN (?)";

  con.query(sql, [tag_id, text_file_extensions], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    console.log(result);
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no files under this tag.", code: 101});
    }
  });
});

app.get("/api/files/get-pinned-files", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var text_file_extensions = ["txt", "md", "csv", "json"];

  var sql = "SELECT f.* FROM files AS f WHERE f.pinned = 1 AND f.extension IN (?)";

  con.query(sql, [text_file_extensions], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    console.log(result);
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no files under this category.", code: 101});
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
      res.json({status: "NOK", error: "There are no files under this category.", code: 101});
    }
  });
});

app.get("/api/files/get-pinned-images", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var image_file_extensions = ['jpg', 'jpeg', 'gif', 'png', 'jfif', 'webp'];

  var sql = "SELECT f.* FROM files AS f WHERE f.pinned = 1 AND f.extension IN (?)";

  con.query(sql, [image_file_extensions], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    console.log(result);
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no files under this tag.", code: 101});
    }
  });
});

app.get("/api/files/get-image-files-from-tag", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var tag_id = req.query.id;
  var image_file_extensions = ['jpg', 'jpeg', 'gif', 'png', 'jfif', 'webp'];

  var sql = "SELECT f.* FROM files AS f INNER JOIN files_tags ft ON ft.file_id = f.id WHERE ft.tag_id = ? AND f.extension IN (?)";

  con.query(sql, [tag_id, image_file_extensions], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    console.log(result);
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no files under this tag.", code: 101});
    }
  });
});

app.get("/api/files/get-pdf-files-from-category", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var category_id = req.query.id;
  var pdf_file_extensions = ['pdf']

  var sql = "SELECT f.* FROM files AS f WHERE f.category_id = ? AND f.extension IN (?)";

  con.query(sql, [category_id, pdf_file_extensions], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    console.log(result);
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no files under this category.", code: 101});
    }
  });
});

app.get("/api/files/get-pinned-pdf-files", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var pdf_file_extensions = ['pdf'];

  var sql = "SELECT f.* FROM files AS f WHERE f.pinned = 1 AND f.extension IN (?)";

  con.query(sql, [pdf_file_extensions], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    console.log(result);
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no pinned files of this type.", code: 101});
    }
  });
});

app.get("/api/files/get-pdf-files-from-tag", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var tag_id = req.query.id;
  var pdf_file_extensions = ['pdf'];

  var sql = "SELECT f.* FROM files AS f INNER JOIN files_tags ft ON ft.file_id = f.id WHERE ft.tag_id = ? AND f.extension IN (?)";

  con.query(sql, [tag_id, pdf_file_extensions], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    console.log(result);
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no pinned files of this type.", code: 101});
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

  var sql = "SELECT f.id, f.title AS name, 'file' AS type, c.id AS category_id FROM files f INNER JOIN categories c ON c.id = f.category_id WHERE f.title LIKE ? OR f.content LIKE ? OR c.name LIKE ?";

  con.query(sql, ['%' + searchQuery + '%', '%' + searchQuery + '%', '%' + searchQuery + '%'], function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }

    var sql2 = "SELECT c.id, c.name, 'category' AS type FROM categories c WHERE c.name LIKE ?";

    con.query(sql2, ['%' + searchQuery + '%'], function(err2, result2) {
      if (err2) {
        console.log(err2);
        res.json({status: "NOK", error: err2.message});
        return;
      }
      console.log(result2);
      var sql3 = "SELECT t.id, t.name, 'tag' AS type FROM tags t WHERE t.name LIKE ?";
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

app.post("/api/files/pin", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.body.id;

  var sql = "UPDATE files SET pinned = 1 WHERE id = ?;";
  con.query(sql, [id], function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: "File has been pinned."});
  });
});

app.post("/api/files/unpin", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.body.id;

  var sql = "UPDATE files SET pinned = 0 WHERE id = ?;";
  con.query(sql, [id], function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: "File has been unpinned."});
  });
});

app.get("/api/download-text-file/:id", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.params.id;

  var sql = "SELECT * FROM files WHERE id = ?";
  con.query(sql, [id], function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    if (result.length > 0) {
      var file = result[0];
      res.setHeader('Content-disposition', 'attachment; filename=' + file.title + "." + file.extension);
      res.setHeader('Content-type', 'text/plain');
      res.charset = 'UTF-8';
      res.write(file.content);
      res.end();
    }
    else {
      res.json({status: "NOK", error: "File not found."});
    }
  });
});



// Images Routes
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

app.post("/api/images/edit", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.body.id;
  var title = req.body.title;
  var category_id = req.body.category;
  var tags = req.body.tags;

  var sql = "UPDATE files SET title = ?, category_id = ? WHERE id = ?;";

  con.query(sql, [title, category_id, id], function(err, result) {
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
    res.json({status: "OK", data: "Images has been edited successfully."});
  });
});

app.get("/api/get-file/:filename", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var filename = req.params.filename;
  res.sendFile(__dirname + "/media-files/" + filename);
});


// Bookmarks Routes
app.get("/api/bookmarks", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  res.sendFile(__dirname + "/bookmarks/bookmarks.txt");
});

app.post("/api/bookmarks/remove-dups", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var folder_id = req.body.folder_id;
  console.log(folder_id);
  console.log("Removing duplicates...");

  var sql = "SELECT * FROM bookmarks WHERE parent_id = ? AND type = 'bookmark'";;
  var result = await con2.query(sql, [folder_id]);
  for (var i in result[0]) {
    var sql2 = "SELECT * FROM bookmarks WHERE parent_id <> ? AND url = ? AND type = 'bookmark'";
    var result2 = await con2.query(sql2, [folder_id, result[0][i].url]);
    if (result2[0].length > 1) {
      var sql = "DELETE FROM bookmarks WHERE id = ?";
      con2.query(sql, [result[0][i].id]);
    }
  }
  res.json({status: "OK", data: "Duplicates have been removed successfully."});
});

app.post('/api/upload-bookmarks', function(req, res) {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  if (!req.files) {
    console.log("No file has been detected.");
    res.json({status: "NOK", error: "No file has been detected."});
    return;
  }
  const file = req.files.file;
  var import_folder = req.body.import_folder;
  var ignore_folders = req.body.ignore_folders == "true";
  var target_folder = req.body.target_folder;

  console.log(import_folder);
  console.log(ignore_folders);
  console.log(target_folder);

  const filepath = __dirname + "/bookmarks/" + file.name;

  file.mv(filepath, (err) => {
    if (err) {
      return res.json({status: "NOK", error: err.message});
    }

    var options = {
      args: [filepath]
    };
    
    PythonShell.run('convert-bookmarks.py', options).then(async function (results) {
      var file = editJson(`${__dirname}/bookmarks/bookmarks.json`);
      var data = file.toObject();
      var result;
      result = await saveBookmarksToDatabase(data, import_folder, ignore_folders, target_folder);
      if (result.status == "OK") {
        res.json({status: "OK", data: "Bookmarks have been uploaded successfully."});
      }
      else {
        res.json({status: "NOK", error: result.error});
      }
    });
  });
});

app.post("/api/bookmarks/create-folder", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var title = req.body.title;
  var parent_id = req.body.parent_id;

  var sql = "INSERT INTO bookmarks (title, parent_id, type) VALUES (?, ?, 'folder');";
  con.query(sql, [title, parent_id], function(err, result) {
    if (err) {
      res.json({status: "NOK", error: JSON.stringify(err)});
      return;
    }
    res.json({status: "OK", data: "Folder has been created successfully."});
  });

});

app.post("/api/bookmarks/delete-all", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var sql = "DELETE FROM bookmarks;";
  con.query(sql, function(err, result) {
    if (err) {
      res.json({status: "NOK", error: JSON.stringify(err)});
      return;
    }
    var sql2 = "ALTER TABLE bookmarks AUTO_INCREMENT = 1;";
    con.query(sql2, function(err2, result2) {
      if (err2) {
        res.json({status: "NOK", error: JSON.stringify(err2)});
        return;
      }
      res.json({status: "OK", data: "Bookmarks have been deleted successfully."});
    });
  });

});

app.get("/api/bookmarks/get-json", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var file = editJson(`${__dirname}/bookmarks/bookmarks.json`);
  var data = file.toObject();
  res.json({status: "OK", data: data});
});

app.get("/api/bookmarks/get-folders", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var sql = "SELECT * FROM bookmarks WHERE type = 'folder'";
  con.query(sql, function(err, result) {
    if (err) {
      res.json({status: "NOK", error: err});
      return;
    }
    res.json({status: "OK", data: result});
  });
});

app.get("/api/bookmarks/getone", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.query.id;

  var sql = "SELECT * FROM bookmarks WHERE id = ?;";
  con.query(sql, [id], function(err, result) {
    if (err) {
      res.json({status: "NOK", error: JSON.stringify(err)});
      return;
    }
    res.json({status: "OK", data: result[0]});
  });
});

app.post("/api/bookmarks/edit", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var id = req.body.id;
  var title = req.body.title;
  var url = req.body.url;
  var parent_id = req.body.parent_id;
  var tags = req.body.tags;

  var sql = "UPDATE bookmarks SET title = ?, url = ?, parent_id = ?, tags = ? WHERE id = ?;";
  con.query(sql, [title, url, parent_id, tags, id], function(err, result) {
    if (err) {
      res.json({status: "NOK", error: err});
      return;
    }
    res.json({status: "OK", data: "The bookmark was edited successfully."});
  });
});

app.get("/api/get-bookmarks-from-folder", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var folder_id = req.query.folder_id;
  var limit = req.query.limit;
  var offset = req.query.offset;

  var sql = "SELECT * FROM bookmarks WHERE type = 'bookmark' AND parent_id = ? ORDER BY id ASC LIMIT ? OFFSET ?;";
  var sql2 = "SELECT COUNT(*) AS countresult FROM bookmarks WHERE type = 'bookmark' AND parent_id = ?;";
  con.query(sql, [Number(folder_id), Number(limit), Number(offset)], function(err, result) {
    if (err) {
      res.json({status: "NOK", error: JSON.stringify(err)});
      return;
    }
    con.query(sql2, [folder_id], function(err2, result2) {
      if (err) {
        res.json({status: "NOK", error: JSON.stringify(err2)});
        return;
      }
      res.json({status: "OK", data: {bookmarks: result, count: result2[0].countresult}});
    });
  });
});

// Authentication Routes

/*
app.get("/login/:secret_token", (req, res) => {
  var secret_token = req.params.secret_token;

  console.log(secret_token);
  console.log(secretConfig.SECRET_TOKEN);
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
*/

app.post("/api/check-pin", (req, res) => {
  var login_id = req.body.login_id;
  var pin = req.body.pin;

  if (secretConfig.USE_2FA == true) {
    var sql = "SELECT * FROM logins WHERE id = ? AND created_at > (NOW() - INTERVAL 1 HOUR) AND ISNULL(is_valid);";
    con.query(sql, [login_id], function(err, result) {
      if (err) {
        res.json({status: "NOK", error: JSON.stringify(err)});
        return; 
      }
      if (result.length > 0) {
        if (result[0].pin == pin) {
          var sql2 = "UPDATE logins SET is_valid = 1 WHERE id = ?;";
          con.query(sql2, [login_id]);
          let file = editJson(`${__dirname}/sessions.json`);
          var dt = new Date().toUTCString();
          file.append("sessions", {login_date: dt});
          file.save();
          req.session.isLoggedIn = true;
          res.json({status: "OK", data: "PIN is correct."});
        }
        else {
          var sql2 = "UPDATE logins SET is_valid = 0 WHERE id = ?;";
          con.query(sql2, [login_id]);
          res.json({status: "NOK", error: "PIN is incorrect."});
        }
      }
      else {
        var sql2 = "UPDATE logins SET is_valid = 0 WHERE id = ?;";
        con.query(sql2, [login_id]);
        res.json({status: "NOK", error: "PIN has expired. Please try again."});
      }
    });
  }
  else {
    var sql = "INSERT INTO logins (is_valid) VALUES (1);";
    con.query(sql, [pin]);
    let file = editJson(`${__dirname}/sessions.json`);
    var dt = new Date().toUTCString();
    file.append("sessions", {login_date: dt});
    file.save();
    req.session.isLoggedIn = true;
    res.json({status: "OK", error: "PIN is not required."});
  }
  
});

function sendPinEmail(pin) {
  var smtpTransport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
          user: secretConfig.SITE_EMAIL,
          pass: secretConfig.SITE_EMAIL_PASSWORD
      }
  });
  var mailOptions = {
      from: secretConfig.SITE_EMAIL,
      to: secretConfig.USER_EMAIL, 
      subject: 'PIN',
      text: 'We received a request to login to your account at ' + secretConfig.SITENAME + '. Please enter the following PIN to login: ' + pin + '. This PIN will expire in 1 hour.'
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
      if(error){
          console.log(error);
      }else{
          res.redirect('/');
      }
  });
}

app.post("/api/check-login", (req, res) => {
  var user = req.body.user;
  var pass = req.body.pass;

  var sql = "SELECT * FROM logins WHERE is_valid = 0 AND created_at > (NOW() - INTERVAL 1 HOUR);";

  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: JSON.stringify(err)});
      return;
    }
    if (result.length <= 5) {
      if (user == secretConfig.USER && pass == secretConfig.PASS) {
        if (secretConfig.USE_2FA == true) {
          var pin = (""+Math.random()).substring(2,8);
          var sql2 = "INSERT INTO logins (pin) VALUES (?);";
          con.query(sql2, [pin], function(err2, result2) {
            var login_id = result2.insertId;
            sendPinEmail(pin);
            res.json({status: "OK", data: {msg: "Username and password are correct. Please enter PIN.", login_id: login_id}});
          });
        }
        else {
          res.json({status: "OK", data: {msg: "Username and password are correct. PIN is not required.", login_id: -1}});
        }
      }
      else {
        var sql2 = "INSERT INTO logins (is_valid) VALUES (0);";
        con.query(sql2);
        res.json({status: "NOK", error: "Wrong username/password."});
      }
    }
    else {
      res.json({status: "NOK", error: "Too many login attempts."});
    }
  });
});


// Front-End Routes

app.get('/', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.redirect('/dashboard');;
  }
  else {
    res.redirect('/login');
  }
});

app.use(express.static(path.resolve(__dirname) + '/frontend/build'));

app.get('/login', (req, res) => {
  res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
});

app.get('/dashboard', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/search', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/add-file', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/add-category', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/add-tag', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/categories/:id', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/tag/:id', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/bookmarks', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/pinned', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.resolve(__dirname) + '/frontend/build/index.html');
  }
  else {
    res.redirect('/login');
  }
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
