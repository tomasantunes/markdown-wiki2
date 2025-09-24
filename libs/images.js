const axios = require('axios');
const { getMySQLConnections } = require('./database');

// Function that downloads an image by URL, saves it in the media-files folder and inserts it in the database
async function downloadImage(imageUrl, category_id, tags, cb) {
  const { con, con2 } = await getMySQLConnections();
  axios
  .get(imageUrl, {
    responseType: 'arraybuffer'
  })
  .then(response => {
    var buffer = Buffer.from(response.data, 'binary');
    const contentType = response.headers['content-type'];
    const ext = extension(contentType);
    var new_filename = crypto.randomBytes(16).toString('hex');
    const filepath = __dirname + "/media-files/" + new_filename + ext;
    const filepath2 = "media-files/" + new_filename + ext;
    fs.writeFile(filepath, buffer, () => {
      console.log('File has been saved.');

      var sql = "INSERT INTO files (title, path, extension, category_id) VALUES (?, ?, ?, ?)";

      con.query(sql, [new_filename, filepath2, ext, category_id], async function(err, result) {
        if (err) {
          console.log(err);
          return;
        }

        var file_id = result.insertId;
        if (tags == undefined || tags == "") {
          deleteTagsFromFile(id, function(result) {
            console.log("Tags have been deleted.")
          });
        }
        else {
          var tags_arr = tags.split(",");
          await con2.query("DELETE FROM files_tags WHERE file_id = ?", [file_id]);
          for (var i in tags_arr) {
            console.log(tags_arr[i]);
            var result2 = await con2.query("SELECT id FROM tags WHERE name = ?", [tags_arr[i]]);
            if (result2[0].length > 0) {
              var tag_id = result2[0][0].id;
              await con2.query("INSERT INTO files_tags (file_id, tag_id) VALUES (?, ?)", [file_id, tag_id]);
            }
            else {
              cb({status: "NOK", error: "Tag not found."});
              return;
            }
            if (i == tags_arr.length - 1) {
              cb({status: "OK", data: "A file has been inserted successfully."});
              return;
            }
          }
        }
        
        cb({status: "OK", data: "A file has been inserted successfully."});
      });
    });
  })
  .catch(function(err) {
    console.log(err.message);
    cb({status: "NOK", error: err.message});
  });
  
}

module.exports = {
    downloadImage,
    default: {
        downloadImage
    }
};