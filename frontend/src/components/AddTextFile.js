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
  const [selectedCategory, setSelectedCategory] = useState();
  const [selectedTags, setSelectedTags] = useState();
  var categories_to_add = [];

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
    setSelectedCategory(item);
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
    setSelectedTags(items);
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

  function getChildren(parent_id, categories) {
    var children = [];
    for (var i in categories) {
      var category = categories[i];
      if (category.parent_id == parent_id) {
        children.push(category);
      }
    }
    return children;
  }

  function getChildrenCount(parent_id, categories) {
    var count = 0;
    for (var i in categories) {
      var category = categories[i];
      if (category.parent_id == parent_id) {
        count++;
      }
    }
    return count;
  }

  function addCategory(category, categories, level) {
    var prefix = ">>> ".repeat(level);
    var obj = {label: prefix + category.name, value: category.id};
    categories_to_add.push(obj);
    if (getChildrenCount(category.id, categories) > 0) {
      level += 1;
      var children = getChildren(category.id, categories);
      for (var i in children) {
        addCategory(children[i], categories, level);
      }
    }
  }

  function loadCategories() {
    console.log("Loading categories recursively...");
    setCategories([]);
    axios.get(config.BACKEND_URL + '/api/categories/list')
    .then(function (response) {
      var categories = response['data']['data'];
      categories_to_add = [];
      for (var i in categories) {
        var category = categories[i];
        if (category.parent_id == 1) {
          addCategory(category, categories, 0);
        }
      }
      setCategories(categories_to_add);
    })
    .catch(function (error) {
      console.log(error);
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
    <div className="bg-grey p-5 rounded">
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
                <Select value={selectedCategory} options={categories} onChange={changeNewFileCategory} />
            </div>
        </div>
        <div className="form-group py-2">
            <label className="control-label">Tags</label>
            <div>
              <Select isMulti value={selectedTags} options={tags} onChange={changeNewFileTags} />
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
  )
}
