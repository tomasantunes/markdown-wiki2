import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config.json';
import FileUploader from './FileUploader';
import Select from 'react-select';
import AddImageURL from './AddImageURL';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

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
      "tags": tags.join(",")
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
          MySwal.fire("File has been uploaded successfully.");
        }
        else {
          console.log(response.data.error);
          MySwal.fire(response.data.error);
        }
      })
      .catch((err) => MySwal.fire("File Upload Error"));
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
        <h1>Add Media File</h1>
        <form onSubmit={submitNewFile}>
          <div className="form-group py-2">
              <FileUploader onFileSelectSuccess={(file) => changeAddMediaFileFile({file})} onFileSelectError={({ error}) => MySwal.fire(error)} />
          </div>
          <div className="form-group py-2">
              <label className="control-label">Category</label>
              <div>
                  <Select value={selectedCategory} options={categories} onChange={changeAddMediaFileCategory} />
              </div>
          </div>
          <div className="form-group py-2">
              <label className="control-label">Tags</label>
              <div>
                <Select isMulti value={selectedTags} options={tags} onChange={changeAddMediaFileTags} />
              </div>
          </div>
          <div className="form-group">
              <div style={{textAlign: "right"}}>
                  <button type="submit" className="btn btn-primary">Submit</button>
              </div>
          </div>
        </form>
        <AddImageURL />
      </div>
    </div>
  )
}
