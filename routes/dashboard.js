var express = require('express');
const { getMySQLConnections } = require('../libs/database');
var {nthMostCommon} = require('../libs/utils');
var router = express.Router();

// This route gets 10 random sentences from all the text files in the database by reading the content of 10 random files and selecting a random line from each file.
router.get("/api/get-10-random-sentences", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route gets the 50 most common words from the text files in the database
router.get("/api/get-50-most-common-words", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

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

// This route gets the 10 top categories with the most files.
router.get("/api/get-top10-categories", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var sql = "SELECT categories.name, COUNT(files.category_id) AS count FROM files INNER JOIN categories ON files.category_id = categories.id GROUP BY files.category_id ORDER BY count DESC LIMIT 10;";
  con.query(sql, [], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result});
  });
});

// This route gets the 10 top tags with the most files.
router.get("/api/get-top10-tags", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var sql = "SELECT tags.name, COUNT(files_tags.tag_id) AS count FROM files_tags INNER JOIN tags ON files_tags.tag_id = tags.id GROUP BY files_tags.tag_id ORDER BY count DESC LIMIT 10;";
  con.query(sql, [], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result});
  });
});

// This route gets the 10 most recent files.
router.get("/api/get-10-most-recent", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var sql = "SELECT * FROM files ORDER BY id DESC LIMIT 10;";
  con.query(sql, [], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result});
  });
});

// This route gets the 10 largest files by reading the length of the content of each file.
router.get("/api/get-10-largest", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var sql = "SELECT * FROM files ORDER BY CHAR_LENGTH(content) DESC LIMIT 10;";
  con.query(sql, [], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: result});
  });
});

module.exports = router;