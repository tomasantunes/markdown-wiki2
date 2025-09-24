const { getMySQLConnections } = require('./database');

// Function get the id of a category by its name
async function getCategoryId(category_name, cb) {
  const { con, con2 } = await getMySQLConnections();
  var sql = "SELECT id FROM categories WHERE name = ?;";

  con.query(sql, [category_name], function(err, result) {
      if (result.length > 0) {
        cb({status: "OK", data: result[0]['id']});
      }
      else {
        cb({status: "NOK", error: "This category doesn't exist."});
      }
  });
}

// Function that inserts a new category in the database
async function insertNewCategory(category_name, parentCategoryId, cb) {
  const { con, con2 } = await getMySQLConnections();
  var sql = "INSERT INTO categories (name, parent_id) VALUES (?, ?);";

  con.query(sql, [category_name, parentCategoryId], function(err, result) {
    cb({status: "OK", data: result.insertId});
  });
}

// Function that checks if a file is in a category
async function checkCategory(file_id, category_id, cb) {
  const { con, con2 } = await getMySQLConnections();
  var sql = "SELECT * FROM files WHERE id = ? AND category_id = ?;";
  con.query(sql, [file_id, category_id], function(err, result) {
    if (result.length > 0) {
      cb(true);
    }
    else {
      cb(false);
    }
  })
}

module.exports = {
    getCategoryId,
    insertNewCategory,
    checkCategory,
    default: {
        getCategoryId,
        insertNewCategory,
        checkCategory
    }
};