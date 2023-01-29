import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config.json';
import Select from 'react-select';
import swal from '@sweetalert/with-react';

export default function AddImageURL() {
  const [addImageURL, setAddImageURL] = useState({
    imageUrl: "",
    category: "",
    tags: ""
  });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  function changeAddImageURLCategory(item) {
    setAddImageURL({
      ...addImageURL,
      "category": item.value
    });
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
      swal("Fields cannot be empty.");
      return;
    }
  
    axios
      .post(config.BACKEND_URL + "/api/upload-image-url", addImageURL)
      .then((response) => {
        if (response.data.status == "OK") {
          swal("Image has been added successfully.");
        }
        else {
          console.log(response.data.error);
          swal(response.data.error);
        }
      })
      .catch((err) => swal("There was an error adding the image."));
  };

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
      swal(err.message);
    }); 
  }

  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  return (
    <>
      <h1>Add Image URL</h1>
      <form onSubmit={submitNewImageURL}>
          <div className="form-group py-2">
              <input type="text" class="form-control" value={addImageURL.imageUrl} onChange={changeAddImageURL} />
          </div>
          <div className="form-group py-2">
              <label className="control-label">Category</label>
              <div>
                  <Select options={categories} onChange={changeAddImageURLCategory} />
              </div>
          </div>
          <div className="form-group py-2">
              <label className="control-label">Tags</label>
              <div>
              <Select isMulti options={tags} onChange={changeAddImageURLTags} />
              </div>
          </div>
          <div className="form-group">
              <div style={{textAlign: "right"}}>
                  <button type="submit" className="btn btn-primary">Submit</button>
              </div>
          </div>
      </form>
    </>
  )
}
