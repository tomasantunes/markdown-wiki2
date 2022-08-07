import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import Select from 'react-select'

export default function AddTextFile() {
  const extensions = [
    {value: "md", label: "Markdown - MD"},
    {value: "txt", label: "Text - TXT"},
    {value: "csv", label: "Comma Separated Values - CSV"}
  ];
  const [newFile, setNewFile] = useState({
    "title": "",
    "content": "",
    "extension": "",
    "parentCategory": "",
    "category": "",
    "tags": ""
  });

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

  function changeNewFileCategory(e) {
    setNewFile({
      ...newFile,
      "category": e.target.value
    });
  }

  function changeNewFileTags(e) {
    setNewFile({
      ...newFile,
      "tags": e.target.value
    });
  }

  function submitNewFile(e) {
    e.preventDefault();
    axios.post(config.BACKEND_URL + '/api/files/insert', newFile)
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
                  <input type="text" className="form-control input-lg" name="category" value={newFile.category} onChange={changeNewFileCategory}/>
              </div>
          </div>
          <div className="form-group py-2">
              <label className="control-label">Tags</label>
              <div>
                  <input type="text" className="form-control input-lg" name="tags" value={newFile.tags} onChange={changeNewFileTags}/>
              </div>
          </div>
          <div className="form-group py-2">
            <label className="control-label">Extension</label>
            <Select options={extensions} />
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
