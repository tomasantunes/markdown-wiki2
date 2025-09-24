const { getMySQLConnections } = require('../libs/database');
var {exportAllChildren, exportHasChildren, exportGetChildren } = require('../libs/export');
var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

router.get("/export-section", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }
  const { con, con2 } = await getMySQLConnections();
  var category_id = 83;
  var category_ids = [category_id];

  var allCategoryIds = await exportAllChildren(category_ids);

  console.log(allCategoryIds);

  var sql0 = "SELECT * FROM categories WHERE id IN (?)";
  var result0 = await con2.query(sql0, [allCategoryIds]);
  fs.writeFileSync("exported_category.json", Buffer.from(JSON.stringify(result0[0])));
  
  var sql = "SELECT * FROM files WHERE category_id IN (?)";
  con.query(sql, [allCategoryIds], function(err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err});
    }
    fs.writeFileSync("exported_files.json", Buffer.from(JSON.stringify(result)));
    fs.rmSync(path.join(__dirname, "exported_media"), { recursive: true, force: true });
    if (!fs.existsSync(path.join(__dirname, "exported_media"))) {
      fs.mkdirSync(path.join(__dirname, "exported_media"));
    }
    var file_ids = [];
    for (var i in result) {
      file_ids.push(result[i].id);
      if (result[i].path != null) {
        fs.copyFileSync(path.resolve(path.join(__dirname, result[i].path.replace(/\\/g, "/"))), path.join(__dirname, "exported_media", path.basename(result[i].path)));
      }
    }
    var sql2 = "SELECT tags.* FROM files_tags INNER JOIN tags ON files_tags.tag_id = tags.id WHERE files_tags.file_id IN (?)";
    con.query(sql2, [file_ids], function(err2, result2) {
      if (err2) {
        console.log(err2);
        res.json({status: "NOK", error: err2});
      }
      fs.writeFileSync("exported_tags.json", Buffer.from(JSON.stringify(result2)));
      var sql3 = "SELECT * FROM files_tags WHERE file_id IN (?)";
      con.query(sql3, [file_ids], function(err3, result3) {
        if (err3) {
          console.log(err3);
          res.json({status: "NOK", error: err3});
        }
        fs.writeFileSync("exported_files_tags.json", Buffer.from(JSON.stringify(result3)));
        console.log("Export has been successful.");
        res.json({status: "OK", data: "Export has been successful."});
      });
    });
  });
});

module.exports = router;