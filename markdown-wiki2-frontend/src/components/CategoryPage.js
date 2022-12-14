import axios from 'axios';
import React, {useEffect, useState} from 'react';
import { Link, useLocation } from 'react-router-dom';
import config from '../config.json';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'
import { CsvToHtmlTable } from 'react-csv-to-table';
import Menu from './Menu';
import Select from 'react-select';
import path from 'path-browserify';

export default function CategoryPage() {
  const {id} = useParams();
  const location = useLocation();
  const [files, setFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [editFile, setEditFile] = useState({
    id: "",
    title: "",
    content: "",
    category: "",
    tags: "",
    extension: ""
  });
  const [appendToFile, setAppendToFile] = useState({
    id: "",
    content: ""
  });
  const extensions = [
    {value: "md", label: "Markdown - MD"},
    {value: "txt", label: "Text - TXT"},
    {value: "csv", label: "Comma Separated Values - CSV"},
    {value: "json", label: "JavaScript Object Notation - JSON"}
  ];

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedExtension, setSelectedExtension] = useState({});

  function showEditFile(e) {
    var id = e.target.value;
    
    axios.get(config.BACKEND_URL + "/api/files/getone", {
      params: {
        id: id
      }
    })
    .then(function(response) {
      setSelectedCategory({value:response.data.data.category_id, label: response.data.data.category_name});
      var extension = extensions.filter(e => {
        return e.value === response.data.data.extension
      });
      setSelectedExtension(extension);
      if (response.data.data.hasOwnProperty("tags")) {
        var tags_sel = [];
        var tags_arr = response.data.data.tags.split(",");
        for (var i in tags_arr) {
          var tag = tags.filter(t => {
            return t.label === tags_arr[i];
          })[0];
          tags_sel.push(tag);
        }
        setSelectedTags(tags_sel);
      }
      setEditFile({
        id: response.data.data.id,
        title: response.data.data.title,
        content: response.data.data.content,
        category: response.data.data.category_id,
        tags: response.data.data.tags,
        extension: response.data.data.extension
      });
    })
    .catch(function(err) {
      alert(err.message);
    })
  }

  function showAppendToFile(e) {
    var id = e.target.value;
    
    setAppendToFile({
      id: id,
      content: "",
    });
  }

  function deleteFile(e) {
    axios.post(config.BACKEND_URL + "/api/files/delete", {id: e.target.value})
    .then(function(response) {
      loadFiles();
      alert("File has been deleted.")
    })
    .catch(function(err) {
      alert(err.message);
    });
  }

  function submitEditFile(e) {
    e.preventDefault();
    axios.post(config.BACKEND_URL + '/api/files/edit', editFile)
    .then(function (response) {
      if (response.data.status == "OK") {
        alert("File has been edited sucessfully.");
        loadFiles();
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  function submitAppendToFile(e) {
    e.preventDefault();
    axios.post(config.BACKEND_URL + '/api/files/append', appendToFile)
    .then(function (response) {
      if (response.data.status == "OK") {
        alert("File has been appended sucessfully.");
        loadFiles();
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  function changeAppendToFileContent(e) {
    setAppendToFile({
      ...appendToFile,
      "content": e.target.value
    });
  }

  function changeEditFileTitle(e) {
    setEditFile({
      ...editFile,
      "title": e.target.value
    });
  }

  function changeEditFileContent(e) {
    setEditFile({
      ...editFile,
      "content": e.target.value
    });
  }

  function changeEditFileCategory(item) {
    setEditFile({
      ...editFile,
      "category": item.value
    });
  }

  function changeEditFileTags(items) {
    var tags_temp = [];
    for (var i in items) {
      var tag = items[i];
      tags_temp.push(tag.label);
    }
    setEditFile({
      ...editFile,
      "tags": tags.join(",")
    });
  }

  function changeEditFileExtension(item) {
    setEditFile({
      ...editFile,
      "extension": item.value
    });
  }

  function loadFiles() {
    setFiles([]);
    axios.get(config.BACKEND_URL + "/api/files/get-files-from-category", {
      params: {
        id: id
      }
    })
    .then(function(response) {
      if (response['data'].status == "OK") {
        setFiles(response['data']['data']);
      }
      else {
        console.log(response['data'].error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function loadImageFiles() {
    setImageFiles([]);
    axios.get(config.BACKEND_URL + "/api/files/get-image-files-from-category", {
      params: {
        id: id
      }
    })
    .then(function(response) {
      if (response['data'].status == "OK") {
        setImageFiles(response['data']['data']);
      }
      else {
        console.log(response['data'].error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

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
      alert(err.message);
    }); 
  }

  useEffect(() => {
    loadImageFiles();
    loadFiles();
  }, [id]);

  useEffect(() => {
    const hash = location.hash
    const el = hash && document.getElementById(hash.substr(1))
    if (el) {    
        el.scrollIntoView({behavior: "smooth"})
    }
  }, [location.hash])

  useEffect(() =>{
    loadImageFiles();
    loadFiles();
    loadCategories();
    loadTags();
  },[])
  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <div className="col-md-8 p-5">
            <h3>Index</h3>
            <ul className="index">
              {imageFiles.map((image) => 
                <li key={image['id']}>
                  <Link to={{ pathname: "/categories/" + id, hash: "#" + image['id'] }}>{image['title']}</Link>
                </li>
              )}
              {files.map((file) => 
                <li key={file['id']}>
                  <Link to={{ pathname: "/categories/" + id, hash: "#" + file['id'] }}>{file['title']}</Link>
                </li>
              )}
            </ul>
            <ul className="image-files">
              {imageFiles.map((image) => 
                <li key={image['id']} id={image['id']}>
                  <div className="row">
                    <div className="col-md-8">
                      <h3>{image['title']}</h3>
                    </div>
                    <div className="col-md-4 text-end">
                      <button class="btn btn-danger delete-btn" value={image['id']} onClick={deleteFile}>Delete</button>
                    </div>
                  </div>
                  <img src={config.BACKEND_URL + "/api/images/get/" + path.basename(image['path'])} />
                </li>
              )}
            </ul>
            <ul className="files">
            {files.map((file) => 
              <li key={file['id']} id={file['id']}>
                <div className="row">
                  <div className="col-md-8">
                    <h3>{file['title']}</h3>
                  </div>
                  <div className="col-md-4 text-end">
                    <button class="btn btn-primary edit-btn" value={file['id']} onClick={showEditFile} data-bs-toggle="modal" data-bs-target=".editFileModal">Edit</button>
                    <button class="btn btn-primary append-btn" value={file['id']} onClick={showAppendToFile} data-bs-toggle="modal" data-bs-target=".appendModal">Append</button>
                    <button class="btn btn-danger delete-btn" value={file['id']} onClick={deleteFile}>Delete</button>
                  </div>
                </div>
                {file['extension'] == "md" &&
                    <ReactMarkdown>{file['content']}</ReactMarkdown>
                }
                {file['extension'] == "txt" &&
                  <p>{file['content']}</p>
                }
                {file['extension'] == "csv" &&
                  <CsvToHtmlTable
                    data={file['content']}
                    csvDelimiter=","
                    tableClassName="table table-striped table-hover"
                  />
                }
                {file['extension'] == "json" &&
                  <p>{JSON.stringify(JSON.parse(file['content']), null, 2)}</p>
                }
                
              </li>
            )}
            </ul>
            {files.length < 1 &&
              <h3>There are no files to display.</h3>
            }
          </div>
        </div>
      </div>

      <div class="modal editFileModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit File</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
            <form onSubmit={submitEditFile}>
                <div className="form-group py-2">
                    <label className="control-label">Title</label>
                    <div>
                        <input type="text" className="form-control input-lg" name="content" value={editFile.title} onChange={changeEditFileTitle} />
                    </div>
                </div>
                <div className="form-group py-2">
                    <label className="control-label">Content</label>
                    <div>
                        <textarea className="form-control input-lg" name="content" value={editFile.content} onChange={changeEditFileContent} rows={15}></textarea>
                    </div>
                </div>
                <div className="form-group py-2">
                    <label className="control-label">Category</label>
                    <div>
                        <Select value={selectedCategory}options={categories} onChange={changeEditFileCategory} />
                    </div>
                </div>
                <div className="form-group py-2">
                    <label className="control-label">Tags</label>
                    <div>
                      <Select isMulti value={selectedTags} options={tags} onChange={changeEditFileTags} />
                    </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Extension</label>
                  <Select value={selectedExtension} options={extensions} onChange={changeEditFileExtension} />
                </div>
                <div className="form-group">
                    <div style={{textAlign: "right"}}>
                        <button type="submit" className="btn btn-primary">Save</button>
                    </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal appendModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Append To File</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
            <form onSubmit={submitAppendToFile}>
                <div className="form-group py-2">
                    <label className="control-label">Content</label>
                    <div>
                        <textarea className="form-control input-lg" name="content" value={appendToFile.content} onChange={changeAppendToFileContent} rows={15}></textarea>
                    </div>
                </div>
                <div className="form-group">
                    <div style={{textAlign: "right"}}>
                        <button type="submit" className="btn btn-primary">Save</button>
                    </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
