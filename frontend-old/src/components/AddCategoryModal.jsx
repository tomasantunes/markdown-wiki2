import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config.json';
import Select from 'react-select';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import $ from 'jquery';

const MySwal = withReactContent(Swal);
window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
const bootstrap5DropdownMlHack = require('../bootstrap5-dropdown-ml-hack');

export default function AddCategoryModal({reload}) {
  const [categories, setCategories] = useState([]);
  const [selectedParentCategory, setSelectedParentCategory] = useState();
  const [newCategory, setNewCategory] = useState({
    "parentCategory": "",
    "category": ""
  });
  var categories_to_add = [];

  function close() {
    $('.addCategoryModal').modal('hide');
  }

  function changeNewCategoryParentCategory(item) {
    setSelectedParentCategory(item);
    setNewCategory({
      ...newCategory,
      "parentCategory": item.value
    });
  }

  function changeNewCategoryCategory(e) {
    setNewCategory({
      ...newCategory,
      "category": e.target.value
    });
  }

  function submitNewCategory(e) {
    e.preventDefault();

    if (newCategory.category.trim() == "" || newCategory.parentCategory == "") {
      MySwal.fire("Fields cannot be empty.");
      return;
    }

    axios.post(config.BACKEND_URL + '/api/categories/insert', newCategory)
    .then(function (response) {
      console.log(response['data']);
      MySwal.fire("New category has been added.")
      .then((value) => {
        $('.addCategoryModal').modal('hide');
        setNewCategory({
            "parentCategory": "",
            "category": ""
        });
        setSelectedParentCategory({});
        reload();
      });
    })
    .catch(function (error) {
      console.log(error);
      MySwal.fire("There was an error adding the new category.");
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
      categories_to_add.push({label: "Root", value: "1"});
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

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div class="modal addCategoryModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Category</h5>
            <button type="button" class="btn-close" onClick={close} aria-label="Close"></button>
          </div>
          <div class="modal-body">
          <form onSubmit={submitNewCategory}>
              <div className="form-group py-2">
                <label className="control-label">Category</label>
                <div>
                    <input type="text" className="form-control input-lg" name="category" value={newCategory.category} onChange={changeNewCategoryCategory}/>
                </div>
              </div>
              <div className="form-group py-2">
                <label className="control-label">Parent Category</label>
                <div>
                  <Select value={selectedParentCategory} options={categories} onChange={changeNewCategoryParentCategory} />
                </div>
            </div>
              <div className="form-group">
                  <div style={{textAlign: "right"}}>
                      <button type="submit" className="btn btn-primary">Submit</button>
                  </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}