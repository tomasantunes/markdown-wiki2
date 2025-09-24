var express = require('express');
const { getMySQLConnections } = require('../libs/database');
var {sendPinEmail} = require('../libs/auth');
var secretConfig = require('../secret-config');
var editJson = require("edit-json-file");
var router = express.Router();

// This route checks if the user and password are correct and sends an email with the authentication PIN if 2FA is enabled.
router.post("/api/check-login", async (req, res) => {
  const { con, con2 } = await getMySQLConnections();
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

// If 2FA is enabled this route checks if an authentication PIN is valid and not expired.
router.post("/api/check-pin", async (req, res) => {
  const { con, con2 } = await getMySQLConnections();
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

// This route logs the user out.
router.post("/api/logout", (req, res) => {
  if (req.session.isLoggedIn) {
    req.session.isLoggedIn = false;
    res.json({status: "OK", data: "You have logged out successfully."});
  }
  else {
    res.json({status: "NOK", error: "You can't logout because you are not logged in."});
  }
});

module.exports = router;