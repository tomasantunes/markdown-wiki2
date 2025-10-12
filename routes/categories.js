var express = require('express');
const { getMySQLConnections } = require('../libs/database');
const { insertNewCategory } = require('../libs/categories');
var router = express.Router();

// This route gets the list of categories. The list is ordered by sort index if it exists, otherwise by name and then by date ascending.
router.get("/api/categories/list", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var sql = "SELECT id, parent_id, name, created_at, updated_at, IFNULL(sort_index, 99999999) AS sort_index FROM categories ORDER BY sort_index, name, id;";

  con.query(sql, [], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "NOK", error: "There are no categories."});
    }
  });
});

// This route gets the list of subcategories of a given category by ID.
router.get("/api/categories/get-subcategories", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var id = req.query.id;

  var sql = "SELECT id, parent_id, name, created_at, updated_at, IFNULL(sort_index, 99999999) AS sort_index FROM categories WHERE parent_id = ? ORDER BY sort_index, name, id;";

  con.query(sql, [id], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    if (result.length > 0) {
      res.json({status: "OK", data: result});
    }
    else {
      res.json({status: "OK", data: []});
    }
  });

});

// This route fetches one category by ID.
router.get("/api/categories/getone", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var id = req.query.id;

  var sql = "SELECT * FROM categories WHERE id = ?;";

  con.query(sql, [id], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    if (result.length > 0) {
      res.json({status: "OK", data: result[0]});
    }
    else {
      res.json({status: "NOK", error: "Category not found."});
    }
  });
});

// This route deletes a category by ID and all the files that belong to it.
router.post("/api/categories/delete", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var id = req.body.id;

  var sql = "DELETE FROM categories WHERE id = ?;";

  con.query(sql, [id], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    var sql2 = "SELECT id FROM files WHERE category_id = ?;";
    con.query(sql2, [id], function(err2, result2) {
      if (err) {
        console.log(err.message);
        res.json({status: "NOK", error: err2.message});
      }
      var sql3 = "DELETE FROM files WHERE id IN (?)";
      con.query(sql3, [result2.map(x => x.id)], function(err3, result3) {
        if (err) {
          console.log(err.message);
          res.json({status: "NOK", error: err3.message});
        }
        var sql4 = "DELETE FROM files_tags WHERE file_id IN (?)";
        con.query(sql4, [result2.map(x => x.id)], function(err4, result4) {
          if (err) {
            console.log(err.message);
            res.json({status: "NOK", error: err4.message});
          }
          res.json({status: "OK", data: "This category has been deleted."});
        });
      });
    });
  });
});

// This route inserts a new category and assigns it to a parent category. The top-level categories have a parent ID of 1.
router.post("/api/categories/insert", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  var category = req.body.category;
  var parentCategoryId = req.body.parentCategory;
  insertNewCategory(category, parentCategoryId, function(result) {
    console.log(result);
    if (result.status == "NOK") {
      res.json(result);
      return;
    }
    res.json({status: "OK", data: "A new category has been inserted.", insertId: result.data})
  });
});

// This route sets a category's sort index.
router.post("/api/categories/set-sort-index", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var id = req.body.id;
  var sort_index = req.body.sort_index;

  var sql = "UPDATE categories SET sort_index = ? WHERE id = ?;";

  con.query(sql, [sort_index, id], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "This category's sort index has been updated."});
  });
});

// This route lets you edit a category's name by ID.
router.post("/api/categories/edit-name", async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.json({status: "NOK", error: "Invalid Authorization."});
    return;
  }

  const { con, con2 } = await getMySQLConnections();

  var id = req.body.id;
  var name = req.body.name;

  var sql = "UPDATE categories SET name = ? WHERE id = ?;";

  con.query(sql, [name, id], function(err, result) {
    if (err) {
      console.log(err.message);
      res.json({status: "NOK", error: err.message});
    }
    res.json({status: "OK", data: "The category's name has been updated."});
  });
});

module.exports = router;