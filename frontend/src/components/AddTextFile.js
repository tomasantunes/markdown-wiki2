import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import Select from 'react-select';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function AddTextFile() {
  const extensions = [
    {value: "md", label: "Markdown - MD"},
    {value: "txt", label: "Text - TXT"},
    {value: "csv", label: "Comma Separated Values - CSV"},
    {value: "json", label: "JavaScript Object Notation - JSON"}
  ];
  const [newFile, setNewFile] = useState({
    "title": "",
    "content": "",
    "extension": "",
    "category": "",
    "tags": ""
  });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  function changeNewFileTitle(e) {
    setNewFile({
      ...newFile,
      "title": e.target.value
    });
  }

  function changeNewFileContent(e) {
    setNewFile({
      ...newFile,
      "content": e.target.value
    });
  }

  function changeNewFileCategory(item) {
    setNewFile({
      ...newFile,
      "category": item.value
    });
  }

  function changeNewFileTags(items) {
    var tags_temp = [];
    for (var i in items) {
      var tag = items[i];
      tags_temp.push(tag.label);
    }
    setNewFile({
      ...newFile,
      "tags": tags_temp.join(",")
    });
  }

  function changeNewFileExtension(item) {
    setNewFile({
      ...newFile,
      "extension": item.value
    });
  }

  function submitNewFile(e) {
    e.preventDefault();
    if (newFile.title.trim() == "" || newFile.extension.trim() == "" || newFile.category == "" || newFile.content.trim() == "") {
      MySwal.fire("Fields cannot be empty.");
      return;
    }
    axios.post(config.BACKEND_URL + '/api/files/insert', newFile)
    .then(function (response) {
      if (response.data.status == "OK") {
        MySwal.fire("A new file has been inserted.");
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  function loadCategories() {
    setCategories([]);
    axios.get(config.BACKEND_URL + "/api/categories/list")
    .then(function(response) {
      if (response.data.status == "OK") {
        var categories = response['data']['data'];
        var categories_to_add = [];
        for (var i in categories) {
          var menuItem = categories[i];
          if (menuItem.parent_id == 1) {
            var obj = {label: menuItem.name, value: menuItem.id};
            categories_to_add.push(obj);
            for (var j in categories) {
              var menuItem2 = categories[j];
              if (menuItem2.parent_id == obj.value) {
                var obj2 = {label: ">>> " + menuItem2.name, value: menuItem2.id};
                categories_to_add.push(obj2);
                for (var k in categories) {
                  var menuItem3 = categories[k];
                  if (menuItem3.parent_id == obj2.value) {
                    var obj3 = {label: ">>> >>> " + menuItem3.name, value: menuItem3.id};
                    categories_to_add.push(obj3);
                  }
                }
              }
            }
          }
        }
        setCategories(categories_to_add);
      }
    })
    .catch(function(err) {
      console.log(err.message);
    }); 
  }

  function loadTags() {
    setTags([]);
    axios.get(config.BACKEND_URL + "/api/tags/list")
    .then(function(response) {
      if (response.data.status == "OK") {
        var tags_temp = [];
        for (var i in response.data.data) {
          var tag = response.data.data[i];
          tags_temp.push({value: tag.id, label: tag.name});
        }
        setTags(tags_temp);
      }
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    }); 
  }

  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  return (
    <div className="col-md-4 full-min-height p-5">
      <div className="bg-grey p-5">
        <h1>Add Text File</h1>
        <form onSubmit={submitNewFile}>
          <div className="form-group py-2">
              <label className="control-label">Title</label>
              <div>
                  <input type="text" className="form-control input-lg" name="content" value={newFile.title} onChange={changeNewFileTitle} />
              </div>
          </div>
          <div className="form-group py-2">
              <label className="control-label">Content</label>
              <div>
                  <textarea className="form-control input-lg" name="content" value={newFile.content} onChange={changeNewFileContent} rows={15}></textarea>
              </div>
          </div>
          <div className="form-group py-2">
              <label className="control-label">Category</label>
              <div>
                  <Select options={categories} onChange={changeNewFileCategory} />
              </div>
          </div>
          <div className="form-group py-2">
              <label className="control-label">Tags</label>
              <div>
                <Select isMulti options={tags} onChange={changeNewFileTags} />
              </div>
          </div>
          <div className="form-group py-2">
            <label className="control-label">Extension</label>
            <Select options={extensions} onChange={changeNewFileExtension} />
          </div>
          <div className="form-group">
              <div style={{textAlign: "right"}}>
                  <button type="submit" className="btn btn-primary">Submit</button>
              </div>
          </div>
        </form>
      </div>
    </div>
  )
}
