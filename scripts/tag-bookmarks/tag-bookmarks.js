var mysql = require("mysql2");
var fs = require("fs");
var secretConfig = require("../../secret-config.json");

var file = fs.readFileSync("bookmarks-out.json");
var bookmarks = JSON.parse(file);

con = mysql.createPool({
    connectionLimit : 90,
    connectTimeout: 1000000,
    host: secretConfig.DB_HOST,
    user: secretConfig.DB_USER,
    password: secretConfig.DB_PASSWORD,
    database: secretConfig.DB_NAME,
    port: '/var/run/mysqld/mysqld.sock',
    multipleStatements: true,
  });

console.log("Starting...");
var queries = '';
for (var i in bookmarks) {
    if (bookmarks[i].tags != '') {
        queries += mysql.format("UPDATE bookmarks SET tags = ? WHERE id = ?; ", [bookmarks[i].tags, bookmarks[i].id]);
    }
}

con.query(queries, function (err, result) {
    console.log("Finished!");
});
