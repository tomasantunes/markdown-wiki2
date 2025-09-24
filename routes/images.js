const { getMySQLConnections } = require('../libs/database');
var express = require('express');
var router = express.Router();
var path = require('path');
var crypto = require('crypto');
var {deleteTagsFromFile} = require('../libs/tags');
var { downloadImage } = require('../libs/images');

// This route inserts an image or a PDF on the files table and uploads it to the media-files folder.
router.post('/api/upload-media-file', async function(req, res) {
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

  console.log(req.files);
  const file = req.files.file;
  var extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".jfif", ".pdf"];
  if (!extensions.includes(path.extname(file.name).toLowerCase())) {
    res.json({status: "NOK", error: "Invalid file extension."});
    return;
  }
  var category_id = req.body.category;
  var tags = req.body.tags;
  var new_filename = crypto.randomBytes(16).toString('hex');
  const filepath = __dirname + "/media-files/" + new_filename + path.extname(file.name);
  const filepath2 = "media-files/" + new_filename + path.extname(file.name);

  file.mv(filepath, (err) => {
    if (err) {
      return res.json({status: "NOK", error: err.message});
    }

    var sql = "INSERT INTO files (title, path, extension, category_id) VALUES (?, ?, ?, ?)";

    con.query(sql, [path.basename(file.name, path.extname(file.name)), filepath2, path.extname(file.name).replace(".", ""), category_id], async function(err, result) {
      if (err) {
        console.log(err);
        return;
      }

      var file_id = result.insertId;

      if (tags == undefined || tags == "") {
        deleteTagsFromFile(id, function(result) {
          console.log("Tags have been deleted.")
        });
      }
      else {
        var tags_arr = tags.split(",");
        await con2.query("DELETE FROM files_tags WHERE file_id = ?", [file_id]);
        for (var i in tags_arr) {
          var result2 = await con2.query("SELECT id FROM tags WHERE name = ?", [tags_arr[i]]);
          if (result2[0].length > 0) {
            var tag_id = result2[0][0].id;
            await con2.query("INSERT INTO files_tags (file_id, tag_id) VALUES (?, ?)", [file_id, tag_id]);
          }
          else {
            res.json({status: "NOK", error: "Tag not found."});
            return;
          }
          if (i == tags_arr.length - 1) {
            res.json({status: "OK", data: "A file has been inserted successfully."});
            return;
          }
        }
      }
      res.json({status: "OK", data: "A file has been inserted successfully."});
    });
  });
});

// This route inserts an image on the files table a uploads it to the media-files folder from a URL.
router.post('/api/upload-image-url', function(req, res) {
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

// This route returns a single image by passing the filename to a URL.
router.get("/api/images/get/:filename", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var filename = req.params.filename;
  res.sendFile(__dirname + "/media-files/" + filename);
});

// This route allows you to edit an image's information on the database.
router.post("/api/images/edit", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var id = req.body.id;
  var title = req.body.title;
  var category_id = req.body.category;
  var tags = req.body.tags;

  var sql = "UPDATE files SET title = ?, category_id = ? WHERE id = ?;";

  con.query(sql, [title, category_id, id], async function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    if (tags == undefined || tags == "") {
      deleteTagsFromFile(id, function(result) {
        console.log("Tags have been deleted.");
        res.json({status: "OK", data: "Image has been edited successfully."});
      });
    }
    else {
      var tags_arr = tags.split(",");
      await con2.query("DELETE FROM files_tags WHERE file_id = ?", [id]);
      for (var i in tags_arr) {
        console.log(tags_arr[i]);
        var result2 = await con2.query("SELECT id FROM tags WHERE name = ?", [tags_arr[i]]);
        if (result2[0].length > 0) {
          var tag_id = result2[0][0].id;
          await con2.query("INSERT INTO files_tags (file_id, tag_id) VALUES (?, ?)", [id, tag_id]);
        }
        else {
          res.json({status: "NOK", error: "Tag not found."});
          return;
        }
        if (i == tags_arr.length - 1) {
          res.json({status: "OK", data: "Image has been edited successfully."});
          return;
        }
      }
    }
    res.json({status: "OK", data: "Image has been edited successfully."});
  });
});

// This route returns a single file by passing the filename to a URL. This route is used for files that are not images like PDFs.
router.get("/api/get-file/:filename", (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var filename = req.params.filename;
  res.sendFile(__dirname + "/media-files/" + filename);
});

module.exports = router;