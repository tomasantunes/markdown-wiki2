var mysql2 = require("mysql2");
var fs = require("fs");
var secretConfig = require("../../secret-config.json");

var file = fs.readFileSync("bookmarks-out.json");
var bookmarks = JSON.parse(file);

con = mysql.createPool({
    connectionLimit : 90,
    connectTimeout: 1000000,
    host: db_host,
    user: secretConfig.DB_USER,
    password: secretConfig.DB_PASSWORD,
    database: secretConfig.DB_NAME,
    port: '/var/run/mysqld/mysqld.sock'
  });

console.log("Starting...");
for (var i in bookmarks) {
    if (bookmarks[i].tags != '') {
        var sql = "UPDATE bookmarks SET tags = ? WHERE id = ?";
        var values = [bookmarks[i].tags, bookmarks[i].id];
        con.query(sql, values, function (err, result) {
            if (err) throw err;
            console.log("1 record updated");
        });
    }
}