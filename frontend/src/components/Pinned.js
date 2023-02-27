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
import $ from 'jquery';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
window.jQuery = $;
window.$ = $;
global.jQuery = $;
const bootstrap = require('bootstrap');

export default function Pinned() {
  const location = useLocation();
  const [files, setFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);
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
  const [selectedFile, setSelectedFile] = useState(null);

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedExtension, setSelectedExtension] = useState({});
  const [firstLoadFilesDone, setFirstLoadFilesDone] = useState(false);
  var categories_to_add = [];

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
        pinned: response.data.data.pinned,
        extension: response.data.data.extension
      });
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    })
  }

  function showEditImage(e) {
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
        content: "",
        category: response.data.data.category_id,
        tags: response.data.data.tags,
        extension: ""
      });
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    })

  }

  function submitEditImage(e) {
    e.preventDefault();
    axios.post(config.BACKEND_URL + '/api/images/edit', editFile)
    .then(function (response) {
      if (response.data.status == "OK") {
        MySwal.fire("File has been edited sucessfully.");
        loadFiles();
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
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
      MySwal.fire("File has been deleted.")
      .then(function(value) {
        loadFiles();
      });
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

  function submitEditFile(e) {
    e.preventDefault();
    axios.post(config.BACKEND_URL + '/api/files/edit', editFile)
    .then(function (response) {
      if (response.data.status == "OK") {
        MySwal.fire("File has been edited sucessfully.")
        .then(function(value) {
          $(".editFileModal").modal("hide");
          loadFiles();
        });
      }
      else {
        MySwal.fire(response.data.error);
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
        MySwal.fire("File has been edited sucessfully.")
        .then(function(value) {
          $(".editImageModal").modal("hide");
          loadFiles();
        });
      }
      else {
        MySwal.fire(response.data.error);
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
    setSelectedCategory(item);
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
    setSelectedTags(items);
  }

  function pinFile(e) {
    axios.post(config.BACKEND_URL + "/api/files/pin", {id: e.target.value})
    .then(function(response) {
      loadFiles();
      MySwal.fire("File has been pinned.");
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

  function unpinFile(e) {
    axios.post(config.BACKEND_URL + "/api/files/unpin", {id: e.target.value})
    .then(function(response) {
      MySwal.fire("File has been unpinned.");
      loadFiles();
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

  function changeEditFileExtension(item) {
    setEditFile({
      ...editFile,
      "extension": item.value
    });
  }

  function loadFiles() {
    axios.get(config.BACKEND_URL + "/api/files/get-pinned-files")
    .then(function(response) {
      if (response['data'].status == "OK") {
        setFiles(response['data']['data']);
      }
      else {
        if (response['data'].code == 101) {
          setFiles([]);
        }
        console.log(response['data'].error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function loadImageFiles() {
    axios.get(config.BACKEND_URL + "/api/files/get-pinned-images")
    .then(function(response) {
      if (response['data'].status == "OK") {
        setImageFiles(response['data']['data']);
      }
      else {
        if (response['data'].code == 101) {
          setImageFiles([]);
        }
        console.log(response['data'].error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function loadPDFFiles() {
    axios.get(config.BACKEND_URL + "/api/files/get-pinned-pdf-files")
    .then(function(response) {
      if (response['data'].status == "OK") {
        setPdfFiles(response['data']['data']);
      }
      else {
        if (response['data'].code == 101) {
          setPdfFiles([]);
        }
        console.log(response['data'].error);
      }
    })
    .catch(function(err) {
      console.log(err);
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

  function scrollToFile() {
    const hash = location.hash
    const el = hash && document.getElementById(hash.substr(1))
    if (el) {    
        el.scrollIntoView({behavior: "smooth"})
    }
  }

  useEffect(() => {
    scrollToFile();
  }, [location.hash]);

  useEffect(() => {
    console.log(firstLoadFilesDone);
    if (!firstLoadFilesDone && files.length > 0) {
      scrollToFile();
      setFirstLoadFilesDone(true);
    }
  }, [files]);

  useEffect(() =>{
    loadCategories();
    loadTags();
    loadImageFiles();
    loadFiles();
    loadPDFFiles();
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
                  <Link to={{ pathname: "/pinned", hash: "#" + image['id'] }}>{image['title']}</Link>
                </li>
              )}
              {pdfFiles.map((pdf) => 
                <li key={pdf['id']}>
                  <a href={"/api/get-file/" + path.basename(pdf['path'])}>{pdf['title']}</a>
                </li>
              )}
              {files.map((file) => 
                <li key={file['id']}>
                  <Link to={{ pathname: "/pinned", hash: "#" + file['id'] }}>{file['title']}</Link>
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
                      {image['pinned'] == 0 ? <button class="btn btn-primary pin-btn" value={image['id']} onClick={pinFile}>Pin</button> : <button class="btn btn-secondary pin-btn" value={image['id']} onClick={unpinFile}>Unpin</button>}
                      <button class="btn btn-primary edit-btn" value={image['id']} onClick={showEditImage} data-bs-toggle="modal" data-bs-target=".editImageModal">Edit</button>
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
                    {file['pinned'] == 0 ? <button class="btn btn-primary pin-btn" value={file['id']} onClick={pinFile}>Pin</button> : <button class="btn btn-secondary pin-btn" value={file['id']} onClick={unpinFile}>Unpin</button>}
                    <button class="btn btn-primary edit-btn" value={file['id']} onClick={showEditFile} data-bs-toggle="modal" data-bs-target=".editFileModal">Edit</button>
                    <button class="btn btn-primary append-btn" value={file['id']} onClick={showAppendToFile} data-bs-toggle="modal" data-bs-target=".appendModal">Append</button>
                    <a class="btn btn-secondary download-btn" value={file['id']} href={"/api/download-text-file/" + file['id']}>Download</a>
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

      <div class="modal editImageModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Image</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
            <form onSubmit={submitEditImage}>
                <div className="form-group py-2">
                    <label className="control-label">Title</label>
                    <div>
                        <input type="text" className="form-control input-lg" name="content" value={editFile.title} onChange={changeEditFileTitle} />
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
