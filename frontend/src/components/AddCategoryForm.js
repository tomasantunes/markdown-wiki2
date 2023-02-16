import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config.json';
import Select from 'react-select';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function AddCategoryForm() {
  const [categories, setCategories] = useState([]);
  const [selectedParentCategory, setSelectedParentCategory] = useState();
  const [newCategory, setNewCategory] = useState({
    "parentCategory": "",
    "category": ""
  });

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

    if (newCategory.category.trim() == "" || newCategory.parentCategory.trim() == "") {
      MySwal.fire("Fields cannot be empty.");
      return;
    }

    axios.post(config.BACKEND_URL + '/api/categories/insert', newCategory)
    .then(function (response) {
      console.log(response['data']);
      MySwal.fire("New category has been added.")
      .then((value) => {
        window.location.reload();
      });
    })
    .catch(function (error) {
      console.log(error);
      MySwal.fire("There was an error adding the new category.");
    });
  }

  function loadCategories() {
    setCategories([]);
    axios.get(config.BACKEND_URL + "/api/categories/list")
    .then(function(response) {
      if (response.data.status == "OK") {
        var categories = response['data']['data'];
        var categories_to_add = [];
        categories_to_add.push({label: "root", value: "1"});
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

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="col-md-4 full-min-height p-5">
      <div className="bg-grey p-5">
        <h1>Add Category</h1>
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
  )
}
