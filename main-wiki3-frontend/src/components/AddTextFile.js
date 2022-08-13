import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import Select from 'react-select'

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
    "parentCategory": "",
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

  function changeNewFileParentCategory(e) {
    setNewFile({
      ...newFile,
      "parentCategory": e.target.value
    });
  }

  function changeNewFileCategory(item) {
    setNewFile({
      ...newFile,
      "category": item.label
    });
  }

  function changeNewFileTags(item) {
    var tags_temp = [];
    for (var i in item) {
      var tag = item[i];
      tags_temp.push(tag.label);
    }
    setNewFile({
      ...newFile,
      "tags": tags.join(",")
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
    axios.post(config.BACKEND_URL + '/api/files/insert', newFile)
    .then(function (response) {
      alert("A new file has been inserted.");
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
        var categories_temp = [];
        for (var i in response.data.data) {
          var category = response.data.data[i];
          categories_temp.push({value: category.id, label: category.name});
        }
        setCategories(categories_temp);
      }
    })
    .catch(function(err) {
      alert(err.message);
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
      alert(err.message);
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
              <label className="control-label">Parent Category</label>
              <div>
                  <input type="text" className="form-control input-lg" name="parentCategory" value={newFile.parentCategory} onChange={changeNewFileParentCategory}/>
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
