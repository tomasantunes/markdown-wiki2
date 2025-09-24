var express = require('express');
const { getMySQLConnections } = require('../libs/database');
var router = express.Router();

// This route inserts a new text file in the files table and assings the tags on the files_tags table.
router.post("/api/files/insert", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var title = req.body.title;
  var content = req.body.content;
  var extension = req.body.extension;
  var category_id = req.body.category;
  var tags = req.body.tags;

  var sql = "INSERT INTO files (title, content, extension, category_id) VALUES (?, ?, ?, ?);";
  con.query(sql, [title, content, extension, category_id], async function(err, result) {
    if (err) {
        console.log(err);
        return;
    }
    var file_id = result.insertId;
    if (tags == undefined || tags == "") {
      deleteTagsFromFile(file_id, function(result) {
        console.log("Tags have been deleted.")
      });
    }
    else {
      var tags_arr = tags.split(",");
      await con2.query("DELETE FROM files_tags WHERE file_id = ?", [file_id]);
      for (var i in tags_arr) {
        console.log(tags_arr[i]);
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
          res.json({status: "OK", data: "File has been edited successfully."});
          return;
        }
      }
    }
    res.json({status: "OK", data: "A file has been inserted successfully."});
  });
});

router.get("/api/files/get-files-without-tags", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  const { con, con2 } = await getMySQLConnections();

  var sql = "SELECT f.* FROM files f WHERE NOT EXISTS (SELECT ft.file_id FROM files_tags ft WHERE ft.file_id = f.id)";

  con.query(sql, function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result});
  });
});

// This route gets all the text files from a category.
router.get("/api/files/get-files-from-category", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route gets all the text files from a tag.
router.get("/api/files/get-files-from-tag", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route gets all the text files that are pinned.
router.get("/api/files/get-pinned-files", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route gets all the image files from a category.
router.get("/api/files/get-image-files-from-category", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route gets all the image files that are pinned.
router.get("/api/files/get-pinned-images", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route gets all the image files from a tag.
router.get("/api/files/get-image-files-from-tag", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route gets all the pdf files from a category.
router.get("/api/files/get-pdf-files-from-category", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route gets all the pdf files that are pinned.
router.get("/api/files/get-pinned-pdf-files", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route gets all the pdf files from a tag.
router.get("/api/files/get-pdf-files-from-tag", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route fetches one file and its tags if any.
router.get("/api/files/getone", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route searches for file, categories and tags based on a query. It returns an array with each entry's information as well as a type.
router.get("/api/files/search", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route searches for files based on the tags they have.
router.get("/api/files/search-tags", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var tags = req.query.tags;
  var tag_ids = tags.split(",");
  console.log(tag_ids);

  var sql = "SELECT file_id FROM files_tags WHERE tag_id IN (?)";
  var result = await con2.query(sql, [tag_ids]);
  var matches = [];

  for (var i in result[0]) {
    var file_id = result[0][i]['file_id'];
    var is_match = true;
    for (var i in tag_ids) {
      var sql2 = "SELECT file_id FROM files_tags WHERE tag_id = ? AND file_id = ?;";
      var result2 = await con2.query(sql2, [tag_ids[i], file_id]);
      if (result2[0].length < 1) {
        is_match = false;
      }
    }
    if (is_match) {
      matches.push(file_id);
    }
  }

  matches = [...new Set(matches)];
  console.log(matches);

  if (matches.length > 0) {
    var sql3 = "SELECT * FROM files WHERE id IN (?)";
    var result3 = await con2.query(sql3, [matches]);
    res.json({status: "OK", data: result3[0]});
  }
  else {
    res.json({status: "OK", data: []});
  }
});

// This route deletes a file by ID.
router.post("/api/files/delete", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var id = req.body.id;

  var sql = "DELETE FROM files WHERE id = ?;";
  con.query(sql, [id], function(err, result) {
    var sql2 = "DELETE FROM files_tags WHERE file_id = ?;";
    con.query(sql2, [id], function(err2, result2) {
      res.json({status: "OK", data: "File has been deleted successfully."});
    }) 
  });
});

// This route edits a file.
router.post("/api/files/edit", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var id = req.body.id;
  var title = req.body.title;
  var content = req.body.content;
  var category_id = req.body.category;
  var tags = req.body.tags;
  var extension = req.body.extension;

  console.log(category_id);

  var sql = "UPDATE files SET title = ?, content = ?, extension = ?, category_id = ? WHERE id = ?;";
  con.query(sql, [title, content, extension, category_id, id], async function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    console.log(tags);
    if (tags == undefined || tags == "") {
      deleteTagsFromFile(id, function(result) {
        console.log("Tags have been deleted.")
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
          res.json({status: "OK", data: "File has been edited successfully."});
          return;
        }
      }
    }
    res.json({status: "OK", data: "File has been edited successfully."});
  });
});

router.get("/clean-filename", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  const { con, con2 } = await getMySQLConnections();

  // Create a query that updates all files with the following path: "media_files/" + basename(file)
  // This will remove the path from the filename.
  var sql = "UPDATE files SET path = CONCAT('media-files/', SUBSTRING_INDEX(path, '/', -1)) WHERE path LIKE '%/%';";
  con.query(sql, function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    res.json({status: "OK", data: "File has been edited successfully."});
  });
});

// This route appends content to a text file.
router.post("/api/files/append", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route pins a file.
router.post("/api/files/pin", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route unpins a file.
router.post("/api/files/unpin", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route allows you to download a text file.
router.get("/api/download-text-file/:id", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

module.exports = router;