const { getMySQLConnections } = require('../libs/database');
var {saveBookmark, saveBookmarksRecursively, saveBookmarksToDatabase, saveBookmarksToDatabaseFromFolder} = require('../libs/bookmarks');
var express = require('express');
var router = express.Router();
var {PythonShell} = require('python-shell');
var editJson = require("edit-json-file");

// This route returns a text file with all the bookmarks
router.get("/api/bookmarks", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  res.sendFile(__dirname + "/bookmarks/bookmarks.txt");
});

// This route removes bookmarks from a folder if they are duplicates in other folders.
router.post("/api/bookmarks/remove-dups", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

router.post("/api/bookmarks/delete", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var id = req.body.id;

  var sql = "DELETE FROM bookmarks WHERE id = ?";
  con.query(sql, [id], function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "Bookmark has been deleted successfully."})
  });
});

// This route receives a bookmarks HTML file and imports it to the database. It receives parameters for a specific folder to import, whether to ignore folders and a target folder. It uses a python script to convert the HTML file to a JSON file.
router.post('/api/upload-bookmarks', async function(req, res) {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  if (!req.files) {
    console.log("No file has been detected.");
    res.json({status: "NOK", error: "No file has been detected."});
    return;
  }
  const { con, con2 } = await getMySQLConnections();
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

// This route creates a folder in the bookmarks database.
router.post("/api/bookmarks/create-folder", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();
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

// This route creates a new bookmark in the bookmarks database.
router.post("/api/bookmarks/create-bookmark", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();
  var title = req.body.title;
  var parent_id = req.body.parent_id;
  var url = req.body.url;
  var tags = req.body.tags;

  var sql = "INSERT INTO bookmarks (title, parent_id, url, tags, type) VALUES (?, ?, ?, ?, 'bookmark');";
  con.query(sql, [title, parent_id, url, tags], function(err, result) {
    if (err) {
      res.json({status: "NOK", error: JSON.stringify(err)});
      return;
    }
    res.json({status: "OK", data: "Bookmark has been created successfully."});
  });
});

// This route deletes all the bookmarks and resets the table's ID.
router.post("/api/bookmarks/delete-all", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route parses the JSON bookmarks file and returns it as an object.
router.get("/api/bookmarks/get-json", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  var file = editJson(`${__dirname}/bookmarks/bookmarks.json`);
  var data = file.toObject();
  res.json({status: "OK", data: data});
});

// This route returns all the folders in the bookmarks table.
router.get("/api/bookmarks/get-folders", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var sql = "SELECT * FROM bookmarks WHERE type = 'folder'";
  con.query(sql, function(err, result) {
    if (err) {
      res.json({status: "NOK", error: err});
      return;
    }
    res.json({status: "OK", data: result});
  });
});

// This route fetches a single bookmarks by ID.
router.get("/api/bookmarks/getone", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route allows you to edit a bookmark.
router.post("/api/bookmarks/edit", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route fetches all the bookmarks from a folder paginated.
router.get("/api/get-bookmarks-from-folder", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route returns all the bookmarks that don't have tags in JSON format.
router.get("/api/get-bookmarks-json", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var sql = "SELECT id, url, '' AS tags FROM bookmarks WHERE type = 'bookmark' AND tags = ''";
  con.query(sql, function(err, result) {
    if (err) {
      res.json({status: "NOK", error: JSON.stringify(err)});
      return;
    }
    res.json(result);
  });
});

router.get("/api/bookmarks/search", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var query = req.query.query;

  var sql = "SELECT * FROM bookmarks WHERE title LIKE ? OR url LIKE ? OR tags LIKE ?;";
  con.query(sql, [`%${query}%`, `%${query}%`, `%${query}%`], function(err, result) {
    if (err) {
      res.json({status: "NOK", error: JSON.stringify(err)});
      return;
    }
    res.json({status: "OK", data: result});
  });
});

module.exports = router;