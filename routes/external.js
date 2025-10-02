const { getMySQLConnections } = require('../libs/database');
var express = require('express');
var router = express.Router();
var secretConfig = require('../secret-config');
var {deleteTagsFromFile, insertNewTag} = require('../libs/tags');

router.post("/external/files/upsert", async (req, res) => {
  if (req.body.api_key != secretConfig.EXTERNAL_API_KEY) {
    res.json({status: "NOK", error: "Invalid API Key."});
    return;
  }

  var title = req.body.title;
  var content = req.body.content;
  var extension = req.body.extension;
  var category_id = req.body.category;
  var tags = req.body.tags;
  var file_id = 0;

  if (title == undefined || content == undefined || extension == undefined || category_id == undefined) {
    res.json({status: "NOK", error: "Missing parameters."});
    return;
  }

  var sql1 = "SELECT * FROM files WHERE title = ? AND category_id = ?";

  var result1 = await con2.query(sql1, [title, category_id]);
  if (result1[0].length > 0) {
    file_id = result1[0][0].id;
    var sql2 = "UPDATE files SET content = ?, extension = ?, category_id = ? WHERE id = ?;";
    await con2.query(sql2, [content, extension, category_id, file_id]);
  } else {
    var sql = "INSERT INTO files (title, content, extension, category_id) VALUES (?, ?, ?, ?);";
    var result2 = await con2.query(sql, [title, content, extension, category_id]);
    file_id = result2.insertId;
  }



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
        insertNewTag(tags_arr[i], async function(result3) {
          if (result3.status == "NOK") {
            console.log("Error inserting new tag.");
          }
          else {
            var tag_id = result3.insertId;
            await con2.query("INSERT INTO files_tags (file_id, tag_id) VALUES (?, ?)", [file_id, tag_id]);
          }
        });
      }
      if (i == tags_arr.length - 1) {
        res.json({status: "OK", data: "File has been upserted successfully."});
        return;
      }
    }
  }
  res.json({status: "OK", data: "File has been upserted successfully."});
});

module.exports = router;