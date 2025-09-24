const { getMySQLConnections } = require('./database');

async function exportHasChildren(category_id) {
  const { con, con2 } = await getMySQLConnections();
  var sql = "SELECT * FROM categories WHERE parent_id = ?";
  var result = await con2.query(sql, [category_id]);
  if (result[0].length > 0) {
    return true;
  } else {
    return false;
  }
}

async function exportGetChildren(category_id) {
  const { con, con2 } = await getMySQLConnections();
  var sql = "SELECT * FROM categories WHERE parent_id = ?";
  var result = await con2.query(sql, [category_id]);
  var category_ids = result[0].map(c => c.id);
  return category_ids;
}

async function exportAllChildren(category_ids) {
  var allCategoryIds = [...category_ids];
  for (var i = 0; i < category_ids.length; i++) {
    if (await exportHasChildren(category_ids[i])) {
      var category_ids2 = await exportGetChildren(category_ids[i]);
      allCategoryIds = allCategoryIds.concat(category_ids2);
      allCategoryIds = allCategoryIds.concat(await exportAllChildren(category_ids2));
    }
  }
  return allCategoryIds;
}

module.exports = {
    exportAllChildren,
    exportHasChildren,
    exportGetChildren,
    default: {
        exportAllChildren,
        exportHasChildren,
        exportGetChildren
    }
};