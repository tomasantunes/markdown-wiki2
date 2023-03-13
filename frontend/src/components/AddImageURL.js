import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config.json';
import Select from 'react-select';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AddCategoryModal from './AddCategoryModal';
import AddTagModal from './AddTagModal';
import CategoriesSelectMenu from './CategoriesSelectMenu';
import TagSelectMenu from './TagSelectMenu';

const MySwal = withReactContent(Swal);

export default function AddImageURL() {
  const [addImageURL, setAddImageURL] = useState({
    imageUrl: "",
    category: "",
    tags: ""
  });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState();
  const [selectedTags, setSelectedTags] = useState();
  var categories_to_add = [];

  function changeAddImageURLCategory(item) {
    setAddImageURL({
      ...addImageURL,
      "category": item.value
    });
    setSelectedCategory(item);
  }

  function changeAddImageURLTags(items) {
    var tags_temp = [];
    for (var i in items) {
      var tag = items[i];
      tags_temp.push(tag.label);
    }
    setAddImageURL({
      ...addImageURL,
      "tags": tags.join(",")
    });
    setSelectedTags(items);
  }

  function changeAddImageURL(e) {
    setAddImageURL({
      ...addImageURL,
      "imageUrl": e.target.value
    });
  }


  const submitNewImageURL = (e) => {
    e.preventDefault();

    if (addImageURL.imageUrl.trim() == "" || addImageURL.category == "") {
      MySwal.fire("Fields cannot be empty.");
      return;
    }
  
    axios
      .post(config.BACKEND_URL + "/api/upload-image-url", addImageURL)
      .then((response) => {
        if (response.data.status == "OK") {
          MySwal.fire("Image has been added successfully.").then(function(value) {
            setAddImageURL({
              imageUrl: "",
              category: "",
              tags: ""
            });
            setSelectedCategory({});
            setSelectedTags([]);
          });
        }
        else {
          console.log(response.data.error);
          MySwal.fire(response.data.error);
        }
      })
      .catch((err) => MySwal.fire("There was an error adding the image."));
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
      <h1>Add Image URL</h1>
      <form onSubmit={submitNewImageURL}>
          <div className="form-group py-2">
              <input type="text" class="form-control" value={addImageURL.imageUrl} onChange={changeAddImageURL} />
          </div>
          <div className="form-group py-2">
              <label className="control-label">Category</label>
              <div>
                  <Select value={selectedCategory} options={categories} onChange={changeAddImageURLCategory}  components={{ Menu: CategoriesSelectMenu }} />
              </div>
          </div>
          <div className="form-group py-2">
              <label className="control-label">Tags</label>
              <div>
              <Select isMulti value={selectedTags} options={tags} onChange={changeAddImageURLTags} components={{ Menu: TagSelectMenu }} />
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
