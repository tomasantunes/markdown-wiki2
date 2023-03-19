import axios from 'axios';
import React, {useEffect, useState} from 'react';
import { Link, useLocation } from 'react-router-dom';
import config from '../config.json';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'
import { CsvToHtmlTable } from 'react-csv-to-table';
import Menu from './Menu';
import Select from 'react-select';
import path from 'path-browserify';
import $ from 'jquery';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AddCategoryModal from './AddCategoryModal';
import AddTagModal from './AddTagModal';
import CategoriesSelectMenu from './CategoriesSelectMenu';
import TagSelectMenu from './TagSelectMenu';

const MySwal = withReactContent(Swal);
window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
const bootstrap5DropdownMlHack = require('../bootstrap5-dropdown-ml-hack');

export default function File({id}) {
  const [file, setFile] = useState();
  const [image, setImage] = useState();
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

  var categories_to_add = [];
  const navigate = useNavigate();

  function showEditFile(id) {

    loadTags();
    axios.get(config.BACKEND_URL + "/api/files/getone", {
      params: {
        id: id
      }
    })
    .then(function(response) {
      console.log(response.data);
      if (response.data.status == "OK") {
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
        else {
          setSelectedTags([]);
        }
        setEditFile({
          id: response.data.data.id,
          title: response.data.data.title,
          content: response.data.data.content,
          category: response.data.data.category_id,
          tags: response.data.data.tags,
          extension: response.data.data.extension
        });
        $("#editFileModal" + id).modal("show");
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    })
  }

  function showEditImage(id) {
    loadTags();
    axios.get(config.BACKEND_URL + "/api/files/getone", {
      params: {
        id: id
      }
    })
    .then(function(response) {
      if (response.data.status == "OK") {
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
        else {
          setSelectedTags([]);
        }
        setEditFile({
          id: response.data.data.id,
          title: response.data.data.title,
          content: "",
          category: response.data.data.category_id,
          tags: response.data.data.tags,
          extension: ""
        });
        $("#editImageModal" + id).modal("show");
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    })

  }

  function closeEditImageModal() {
    $("#editImageModal" + id).modal("hide");
  }

  function closeEditFileModal() {
    $("#editFileModal" + id).modal("hide");
  }

  function closeAppendModal() {
    $("#appendModal" + id).modal("hide");
  }

  function showAppendToFile(id) {
    setAppendToFile({
      id: id,
      content: "",
    });
    $("#appendModal" + id).modal('show');
  }

  function deleteFile(id) {
    axios.post(config.BACKEND_URL + "/api/files/delete", {id: id})
    .then(function(response) {
      MySwal.fire("File has been deleted.")
      .then(function(value) {
        loadFile();
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
          $("#editFileModal" + id).modal("hide");
          loadFile();
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

  function submitEditImage(e) {
    e.preventDefault();
    axios.post(config.BACKEND_URL + '/api/images/edit', editFile)
    .then(function (response) {
      if (response.data.status == "OK") {
        MySwal.fire("File has been edited sucessfully.")
        .then(function(value) {
          $("#editImageModal" + id).modal("hide");
          loadFile();
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
        MySwal.fire("File has been appended sucessfully.");
        loadFile();
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

  function changeEditFileExtension(item) {
    setEditFile({
      ...editFile,
      "extension": item.value
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
      "tags": tags_temp.join(",")
    });
    setSelectedTags(items);
  }

  function pinFile(e) {
    axios.post(config.BACKEND_URL + "/api/files/pin", {id: e.target.value})
    .then(function(response) {
      loadFile();
      MySwal.fire("File has been pinned.");
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

  function unpinFile(e) {
    axios.post(config.BACKEND_URL + "/api/files/unpin", {id: e.target.value})
    .then(function(response) {
      loadFile();
      MySwal.fire("File has been unpinned.");
    })
    .catch(function(err) {
      MySwal.fire(err.message);
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

  function loadFile() {
    axios.get(config.BACKEND_URL + '/api/files/getone/', {params: {id: id}})
    .then(function (response) {
      if (response.data.status == "OK") {
        var extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".jfif"];
        if (extensions.includes("."+response.data.data.extension)) {
          setImage(response.data.data);
        }
        else {
          setFile(response.data.data);
        }
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  useEffect(() => {
    loadCategories();
    loadTags();
    loadFile();
  }, []);
  return (
    <>
      {file != undefined && (
        <>
          <div className="file-entry">
            <div className="row">
              <div className="col-md-8">
                <h3><a href={"/files/" + file['id']}>{file['title']}</a></h3>
              </div>
              <div className="col-md-4 text-end">
                <div class="dropdown">
                  <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Actions
                  </button>
                  <ul class="dropdown-menu">
                    {file['pinned'] == 0 ? <li><a class="dropdown-item" href="#" onClick={() => pinFile(file['id'])}>Pin</a></li> : <li><a class="dropdown-item" href="#" onClick={() => unpinFile(file['id'])}>Unpin</a></li>}
                    <li><a class="dropdown-item" href="#" onClick={(e) => {e.preventDefault(); showEditFile(file['id'])}}>Edit</a></li>
                    <li><a class="dropdown-item" href="#" onClick={(e) => {e.preventDefault(); showAppendToFile(file['id'])}}>Append</a></li>
                    <li><a class="dropdown-item" href={"/api/download-text-file/" + file['id']}>Download</a></li>
                    <li><a class="dropdown-item" href="#" onClick={() => deleteFile(file['id'])}>Delete</a></li>
                  </ul>
                </div>
                
              </div>
            </div>
            <div className="file-content">
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
            </div>
          </div>
        </>
      )}
      {image != undefined && (
        <>
          <div className="file-entry">
              <div className="row">
              <div className="col-md-8">
                  <h3><a href={"/files/" + image['id']}>{image['title']}</a></h3>
              </div>
              <div className="col-md-4 text-end">
                  <div class="dropdown">
                  <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      Actions
                  </button>
                  <ul class="dropdown-menu">
                      {image['pinned'] == 0 ? <li><a class="dropdown-item" href="#" onClick={() => pinFile(image['id'])}>Pin</a></li> : <li><a class="dropdown-item" href="#" onClick={() => unpinFile(image['id'])}>Unpin</a></li>}
                      <li><a class="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); showEditImage(image['id'])}}>Edit</a></li>
                      <li><a class="dropdown-item" href="#" onClick={() => deleteFile(image['id'])}>Delete</a></li>
                  </ul>
                  </div>
              </div>
              </div>
              <img src={config.BACKEND_URL + "/api/images/get/" + path.basename(image['path'])} />
          </div>
        </>
      )}

      <div class="modal editFileModal" id={"editFileModal" + id} tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit File</h5>
              <button type="button" class="btn-close" onClick={closeEditFileModal} aria-label="Close"></button>
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
                        <Select value={selectedCategory} options={categories} onChange={changeEditFileCategory} components={{ Menu: CategoriesSelectMenu }}/>
                    </div>
                </div>
                <div className="form-group py-2">
                    <label className="control-label">Tags</label>
                    <div>
                      <Select isMulti value={selectedTags} options={tags} onChange={changeEditFileTags} components={{ Menu: TagSelectMenu }}/>
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
          </div>
        </div>
      </div>

      <div class="modal editImageModal" id={"editImageModal" + id} tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Image</h5>
              <button type="button" class="btn-close" onClick={closeEditImageModal} aria-label="Close"></button>
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
                        <Select value={selectedCategory} options={categories} onChange={changeEditFileCategory} components={{ Menu: CategoriesSelectMenu }}/>
                    </div>
                </div>
                <div className="form-group py-2">
                    <label className="control-label">Tags</label>
                    <div>
                      <Select isMulti value={selectedTags} options={tags} onChange={changeEditFileTags} components={{ Menu: TagSelectMenu }}/>
                    </div>
                </div>
                <div className="form-group">
                    <div style={{textAlign: "right"}}>
                        <button type="submit" className="btn btn-primary">Save</button>
                    </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div class="modal appendModal"  id={"appendModal" + id} tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Append To File</h5>
              <button type="button" class="btn-close" onClick={closeAppendModal} aria-label="Close"></button>
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
          </div>
        </div>
      </div>
      <AddCategoryModal />
      <AddTagModal />
    </>
  )
}
