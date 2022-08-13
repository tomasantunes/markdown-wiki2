import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import FileUploader from './FileUploader';

export default function AddMediaFile() {
  const [addMediaFile, setAddMediaFile] = useState({
    file: "",
    category: "",
    parentCategory: "",
    tags: ""
  });

  function changeAddMediaFileParentCategory(e) {
    setAddMediaFile({
      ...addMediaFile,
      "parentCategory": e.target.value
    });
  }

  function changeAddMediaFileCategory(e) {
    setAddMediaFile({
      ...addMediaFile,
      "category": e.target.value
    });
  }

  function changeAddMediaFileTags(e) {
    setAddMediaFile({
      ...addMediaFile,
      "tags": e.target.value
    });
  }

  function changeAddMediaFileFile({file}) {
    setAddMediaFile({
      ...addMediaFile,
      "file": file
    });
  }


  const submitNewFile = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", addMediaFile.file);
    formData.append("category", addMediaFile.category);
    formData.append("parentCategory", addMediaFile.parentCategory);
    formData.append("tags", addMediaFile.tags);
  
    axios
      .post(config.BACKEND_URL + "/api/upload-media-file", formData)
      .then((response) => {
        if (response.data.status == "OK") {
          alert("File has been uploaded successfully.");
        }
        else {
          console.log(response.data.error);
          alert(response.data.error);
        }
      })
      .catch((err) => alert("File Upload Error"));
  };
  return (
    <div className="col-md-4 full-min-height p-5">
      <div className="bg-grey p-5">
        <h1>Add Media File</h1>
        <form onSubmit={submitNewFile}>
          <div className="form-group py-2">
              <FileUploader onFileSelectSuccess={(file) => changeAddMediaFileFile({file})} onFileSelectError={({ error}) => alert(error)} />
          </div>
          <div className="form-group py-2">
            <label className="control-label">Parent Category</label>
            <div>
                <input type="text" className="form-control input-lg" name="parentCategory" value={addMediaFile.parentCategory} onChange={changeAddMediaFileParentCategory}/>
            </div>
        </div>
        <div className="form-group py-2">
            <label className="control-label">Category</label>
            <div>
                <input type="text" className="form-control input-lg" name="category" value={addMediaFile.category} onChange={changeAddMediaFileCategory}/>
            </div>
        </div>
        <div className="form-group py-2">
            <label className="control-label">Tags</label>
            <div>
                <input type="text" className="form-control input-lg" name="tags" value={addMediaFile.tags} onChange={changeAddMediaFileTags}/>
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
