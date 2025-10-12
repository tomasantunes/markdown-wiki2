var express = require('express');
const { getMySQLConnections } = require('../libs/database');
var {insertNewTag} = require('../libs/tags');
var router = express.Router();

// This route inserts a new tag.
router.post("/api/tags/insert", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var tag = req.body.tag;
  await insertNewTag(tag, function(result) {
    if (result.status == "OK") {
      res.json({status: "OK", data: "A new tag was added successfully.", insertId: result.data});
    }
    else {
      res.json({status: "NOK", error: "There was an error inserting the tag."});
    }
  });
});

// This route lists all the tags.
router.get("/api/tags/list", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var sql = "SELECT * FROM tags ORDER BY name ASC;";

  con.query(sql, [], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no tags."});
    }
  });
});

router.post("/api/tags/delete", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var id = req.body.id;

  con.query("DELETE FROM tags WHERE id = ?", [id], function(err, result) {
    if (err) {
      res.json({status: "NOK", error: JSON.stringify(err)});
      return;
    }

    con.query("DELETE FROM files_tags WHERE tag_id = ?", [id], function(err, result) {
      if (err) {
        res.json({status: "NOK", error: JSON.stringify(err)});
        return;
      }
      res.json({status: "OK", data: "Tag has been deleted."});
    });
  });
});

module.exports = router;