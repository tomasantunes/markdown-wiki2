import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import swal from '@sweetalert/with-react';

export default function AddCategoryForm() {
  const [newCategory, setNewCategory] = useState({
    "parentCategory": "",
    "category": ""
  });

  function changeNewCategoryParentCategory(e) {
    setNewCategory({
      ...newCategory,
      "parentCategory": e.target.value
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
      swal("Fields cannot be empty.");
      return;
    }

    axios.post(config.BACKEND_URL + '/api/categories/insert', newCategory)
    .then(function (response) {
      console.log(response['data']);
    })
    .catch(function (error) {
      console.log(error);
    });
  }

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
                  <input type="text" className="form-control input-lg" name="parentCategory" value={newCategory.parentCategory} onChange={changeNewCategoryParentCategory}/>
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
