const { getMySQLConnections } = require('./database');

// Function that gets the id of a tag by its name
async function getTagId(tag_name, cb) {
  const { con, con2 } = await getMySQLConnections();
  var sql = "SELECT id FROM tags WHERE name = ?;";

  con.query(sql, [tag_name], function(err, result) {
      if (result.length > 0) {
        cb({status: "OK", data: result[0]['id']});
      }
      else {
        cb({status: "NOK", error: "This tag doesn't exist."});
      }
  });
}

// Function that assigns a tag to file
async function assignTagToFile(file_id, tag_id) {
  const { con, con2 } = await getMySQLConnections();
  var sql = "INSERT INTO files_tags (file_id, tag_id) VALUES (?, ?);";

  con.query(sql, [file_id, tag_id], function(err, result) {
    console.log(result);
  });
};

// Function that inserts a new tag in the database
async function insertNewTag(tag_name, cb) {
  const { con, con2 } = await getMySQLConnections();
  var sql = "INSERT INTO tags (name) VALUES (?);";

  var result = await con2.query(sql, [tag_name]);
  console.log(result);
  if (result.affectedRows == 0) {
    cb({status: "NOK", error: "Failed to insert tag."});
    return;
  }
  cb({status: "OK", data: result.insertId});
}

// Function that checks if a file has a tag
async function checkTag(file_id, tag_id, cb) {
  const { con, con2 } = await getMySQLConnections();
  var sql = "SELECT * FROM files_tags WHERE file_id = ? AND tag_id = ?;";
  con.query(sql, [file_id, tag_id], function(err, result) {
    if (result.length > 0) {
      cb(true);
    }
    else {
      cb(false);
    }
  })
}

// Function that deletes all tags from a file
async function deleteTagsFromFile(file_id, cb) {
  const { con, con2 } = await getMySQLConnections();
  var sql = "DELETE FROM files_tags WHERE file_id = ?;";
  con.query(sql, [file_id], function(err, result) {
    cb(true);
  });
}

module.exports = {
    getTagId,
    insertNewTag,
    assignTagToFile,
    checkTag,
    deleteTagsFromFile,
    default: {
        getTagId,
        insertNewTag,
        assignTagToFile,
        checkTag,
        deleteTagsFromFile
    }
};