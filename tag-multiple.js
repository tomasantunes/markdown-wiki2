var mysql = require('mysql2');
var secretConfig = require('./secret-config.json');

con = mysql.createPool({
  connectionLimit : 90,
  connectTimeout: 1000000,
  host: secretConfig.DB_HOST,
  user: secretConfig.DB_USER,
  password: secretConfig.DB_PASSWORD,
  database: secretConfig.DB_NAME,
  port: '/var/run/mysqld/mysqld.sock'
});

var category_id =1;
var tag_id = 1;
var sql = "SELECT * FROM files WHERE category_id = ? AND NOT EXISTS (SELECT * FROM files_tags WHERE files_tags.file_id = files.id AND files_tags.tag_id = ?)";

con.query(sql, [category_id, tag_id], function (err, result) {
  if (err) throw err;
  for (var i in result) {
    var id = result[i].id;

    var sql2 = "INSERT INTO files_tags (file_id, tag_id) VALUES (?, ?)";

    con.query(sql2, [id, tag_id], function (err, result) {
      if (err) throw err;
      console.log("+1");
    });
  }
});

