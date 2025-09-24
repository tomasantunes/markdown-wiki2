const { getMySQLConnections } = require('../libs/database');
var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

router.get("/import-section", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var exported_category_file = fs.readFileSync("exported_category.json");
  var exported_category = JSON.parse(exported_category_file);
  var exported_files_file = fs.readFileSync("exported_files.json");
  var exported_files = JSON.parse(exported_files_file);
  var exported_media = fs.readdirSync("exported_media");
  var exported_tags_file = fs.readFileSync("exported_tags.json");
  var exported_tags = JSON.parse(exported_tags_file);
  var exported_files_tags = fs.readFileSync("exported_files_tags.json");
  var exported_files_tags = JSON.parse(exported_files_tags);

  var old_to_new_category_ids = {};
  var old_to_new_file_ids = {};

  var sql = "INSERT INTO categories (name, parent_id) VALUES (?, ?)";
  for (var i in exported_category) {
    var result = await con2.query(sql, [exported_category[i].name, 1]);
    console.log(result[0].insertId);
    old_to_new_category_ids[exported_category[i].id] = result[0].insertId;
  }

  var sql = "INSERT INTO tags (name) VALUES (?)";
  for (var i in exported_tags) {
    var result = await con2.query(sql, [exported_tags[i].name]);
    console.log(result[0].insertId);
  }

  var sql = "INSERT INTO files (title, content, extension, category_id, path) VALUES (?, ?, ?, ?, ?)";
  for (var i in exported_files) {
    var result = await con2.query(sql, [exported_files[i].title, exported_files[i].content, exported_files[i].extension, old_to_new_category_ids[exported_files[i].category_id], exported_files[i].path]);
    console.log(result[0].insertId);
    old_to_new_file_ids[exported_files[i].id] = result[0].insertId;
  }

  var sql = "INSERT INTO files_tags (file_id, tag_id) VALUES (?, ?)";
  for (var i in exported_files_tags) {
    var result = await con2.query(sql, [old_to_new_file_ids[exported_files_tags[i].file_id], exported_files_tags[i].tag_id]);
    console.log(result[0].insertId);
  }

  // copy all files from exported_media to media
  for (var i in exported_media) {
    fs.copyFileSync(path.join(__dirname, "exported_media", exported_media[i]), path.join(__dirname, "media-files", exported_media[i]));
  }

  res.json({status: "OK", data: "Import has been completed successfully."});

});

module.exports = router;