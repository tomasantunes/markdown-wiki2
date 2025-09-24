const { getMySQLConnections } = require('./database');
var {searchRecursively} = require('./utils');

// Function that saves a bookmark in the database depending on whether it is a folder or a bookmark and returns an insert ID. It checks if it's a duplicate and returns the ID of the existing bookmark. It receives a parameter to ignore folders.
async function saveBookmark(bookmark, ignore_folders, parent_id) {
  const { con, con2 } = await getMySQLConnections();
  if (bookmark.type != "bookmark") {
    if (!ignore_folders) {
      var sql = "INSERT INTO bookmarks (title, type, parent_id) VALUES (?, 'folder', ?);";
      try {
        var result = await con2.query(sql, [bookmark.title, parent_id]);
        return {status: "OK", insertId: result[0].insertId, type: "folder"};
      }
      catch(err) {
        if (err.errno == 1062) {
          var sql2 = "SELECT id FROM bookmarks WHERE title = ? AND type <> 'bookmark' AND parent_id = ?;";
          var result2 = await con2.query(sql2, [bookmark.title, parent_id]);
          return {status: "OK", insertId: result2[0][0].id, type: "folder"};
        }
        return {status: "NOK"};
      }
    }
    else {
      console.log("A folder has been ignored.");
      return {status: "OK", type: "ignored_folder"};
    }
  }
  else if (bookmark.type == "bookmark") {
    try {
      var sql2 = "INSERT INTO bookmarks (title, url, type, parent_id) VALUES (?, ?, 'bookmark', ?);";
      var result2 = await con2.query(sql2, [bookmark.title || "", bookmark.url, parent_id]);
      return {status: "OK", type: "bookmark"};
    }
    catch(err) {
      if (err.errno == 1062) {
        var sql2 = "SELECT id FROM bookmarks WHERE url = ? AND type = 'bookmark';";
        var result2 = await con2.query(sql2, [bookmark.url]);
        return {status: "OK", insertId: result2[0][0].id, type: "bookmark"};
      }
      return {status: "NOK"};
    }
  }
}

// Function that saves bookmarks recursively in the database from a nested array of bookmarks.
async function saveBookmarksRecursively(bookmarks, ignore_folders, parent_id) {
  const { con, con2 } = await getMySQLConnections();
  for (var i in bookmarks) {
    var bookmark = bookmarks[i];
    var result = await saveBookmark(bookmark, ignore_folders, parent_id);
    if (result.status == "OK") {
      console.log("+1 bookmark");
      if (result.type == "folder") {
        await saveBookmarksRecursively(bookmark.children, ignore_folders, result.insertId);
      }
      else if (result.type == "ignored_folder") {
        await saveBookmarksRecursively(bookmark.children, ignore_folders, parent_id);
      }
    }
    else {
      console.log("Error saving bookmark: " + (bookmark.title || "N/A"));
    }
  }
}

// Function that saves bookmarks in the database. It receives parameters to import a specific folder, to ignore folders and a target folder.
async function saveBookmarksToDatabase(bookmarks, import_folder, ignore_folders, target_folder) {
  const { con, con2 } = await getMySQLConnections();
  var parent_id = 0
  if (target_folder != undefined) {
    parent_id = target_folder;
  }
  if (import_folder != "" && import_folder != undefined) {
    console.log("Before saveToDatabaseFromFolder().");
    var result = await saveBookmarksToDatabaseFromFolder(bookmarks, import_folder, ignore_folders, parent_id);
    if (result.status == "OK") {
      return {status: "OK"};
    }
    else {
      return {status: "NOK", error: result.error};
    }
  }
  else {
    await saveBookmarksRecursively(bookmarks, ignore_folders, parent_id);
    return {status: "OK"};
  }
}

// Function that saves bookmarks in the database from a specific folder. It receives parameters to ignore folders and a target folder.
async function saveBookmarksToDatabaseFromFolder(bookmarks, import_folder, ignore_folders, parent_id) {
  const { con, con2 } = await getMySQLConnections();
  var folder_to_import = searchRecursively(bookmarks, "title", import_folder);
  if (folder_to_import.length > 0) {
    folder_to_import = folder_to_import[0];
    console.log(folder_to_import);
    var result = await saveBookmark(folder_to_import, ignore_folders, parent_id);
    if (result.status == "OK" && result.type == "folder") {
      var parent_id = result.insertId;
      await saveBookmarksRecursively(folder_to_import.children, ignore_folders, parent_id);
    }
    else if (result.status == "OK" && result.type == "ignored_folder") {
      await saveBookmarksRecursively(folder_to_import.children, ignore_folders, parent_id);
    }
    return {status: "OK"};
  }
  else {
    return {status: "NOK", error: "Folder not found."};
  }
}

module.exports = {
    saveBookmark,
    saveBookmarksRecursively,
    saveBookmarksToDatabase,
    saveBookmarksToDatabaseFromFolder,
    default: {
        saveBookmark,
        saveBookmarksRecursively,
        saveBookmarksToDatabase,
        saveBookmarksToDatabaseFromFolder
    }
};