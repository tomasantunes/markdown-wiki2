import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config.json';
import FileUploader from './FileUploader';
import Select from 'react-select';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AddCategoryModal from './AddCategoryModal';
import AddTagModal from './AddTagModal';
import CategoriesSelectMenu from './CategoriesSelectMenu';
import TagSelectMenu from './TagSelectMenu';
import $ from 'jquery';

const MySwal = withReactContent(Swal);
window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
const bootstrap5DropdownMlHack = require('../bootstrap5-dropdown-ml-hack');

export default function AddMediaFile() {
  const [addMediaFile, setAddMediaFile] = useState({
    file: "",
    category: "",
    tags: ""
  });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState();
  const [selectedTags, setSelectedTags] = useState();
  var categories_to_add = [];

  function changeAddMediaFileCategory(item) {
    setAddMediaFile({
      ...addMediaFile,
      "category": item.value
    });
    setSelectedCategory(item);
  }

  function changeAddMediaFileTags(items) {
    var tags_temp = [];
    for (var i in items) {
      var tag = items[i];
      tags_temp.push(tag.label);
    }
    setAddMediaFile({
      ...addMediaFile,
      "tags": tags_temp.join(",")
    });
    setSelectedTags(items);
  }

  function changeAddMediaFileFile({file}) {
    setAddMediaFile({
      ...addMediaFile,
      "file": file
    });
  }


  const submitNewFile = (e) => {
    e.preventDefault();

    if (addMediaFile.file == "" || addMediaFile.category == "") {
      MySwal.fire("Fields cannot be empty.");
      return;
    }

    const formData = new FormData();
    formData.append("file", addMediaFile.file);
    formData.append("category", addMediaFile.category);
    formData.append("tags", addMediaFile.tags);
  
    axios
      .post(config.BACKEND_URL + "/api/upload-media-file", formData)
      .then((response) => {
        if (response.data.status == "OK") {
          MySwal.fire("File has been uploaded successfully.").then(function(value) {
            setAddMediaFile({
              file: "",
              category: "",
              tags: ""
            });
            setSelectedCategory({});
            setSelectedTags([]);
            $("input[type=file]").val('');
          });
        }
        else {
          console.log(response.data.error);
          MySwal.fire(response.data.error);
        }
      })
      .catch((err) => MySwal.fire("File Upload Error"));
  };

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
    <>
    <div className="bg-grey p-5 rounded">
      <h1>Add Media File</h1>
      <p>Supported file types: JPG, JPEG, PNG, GIF, JFIF, WEBP, PDF</p>
      <form onSubmit={submitNewFile}>
        <div className="form-group py-2">
            <FileUploader onFileSelectSuccess={(file) => changeAddMediaFileFile({file})} onFileSelectError={({ error}) => MySwal.fire(error)} />
        </div>
        <div className="form-group py-2">
            <label className="control-label">Category</label>
            <div>
                <Select value={selectedCategory} options={categories} onChange={changeAddMediaFileCategory} components={{ Menu: CategoriesSelectMenu }}/>
            </div>
        </div>
        <div className="form-group py-2">
            <label className="control-label">Tags</label>
            <div>
              <Select isMulti value={selectedTags} options={tags} onChange={changeAddMediaFileTags} components={{ Menu: TagSelectMenu }}/>
            </div>
        </div>
        <div className="form-group">
            <div style={{textAlign: "right"}}>
                <button type="submit" className="btn btn-primary">Submit</button>
            </div>
        </div>
      </form>
    </div>
    <AddCategoryModal />
    <AddTagModal />
    </>
  )
}
