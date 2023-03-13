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

export default function ListFiles({loadFiles, loadImageFiles, loadPDFFiles, files, setFiles, imageFiles, setImageFiles, pdfFiles, setPdfFiles, deleteCategory, category}) {
  const {id} = useParams();
  const location = useLocation();
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
  const sortOrders = [
    {value: "alpha-asc", label: "Alphabetical Ascending"},
    {value: "alpha-desc", label: "Alphabetical Descending"},
    {value: "date-asc", label: "Date Ascending"},
    {value: "date-desc", label: "Date Descending"},
    {value: "size-asc", label: "Size Ascending"},
    {value: "size-desc", label: "Size Descending"},
  ];
  const [selectedFile, setSelectedFile] = useState(null);

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedExtension, setSelectedExtension] = useState({});
  const [sortIndex, setSortIndex] = useState();
  const [selectedSortOrder, setSelectedSortOrder] = useState({value: "date-asc", label: "Date Ascending"});
  const [currentTab, setCurrentTab] = useState("files");
  const [subcategories, setSubcategories] = useState([]);
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
      }
      else {
        MySwal.fire(response.data.error);
      }
      setEditFile({
        id: response.data.data.id,
        title: response.data.data.title,
        content: response.data.data.content,
        category: response.data.data.category_id,
        tags: response.data.data.tags,
        extension: response.data.data.extension
      });
      $(".editFileModal").modal("show");
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
      }
      else {
        MySwal.fire(response.data.error);
      }
      setEditFile({
        id: response.data.data.id,
        title: response.data.data.title,
        content: "",
        category: response.data.data.category_id,
        tags: response.data.data.tags,
        extension: ""
      });
      $(".editImageModal").modal("show");
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    })

  }

  function closeEditImageModal() {
    $(".editImageModal").modal("hide");
  }

  function closeEditFileModal() {
    $(".editFileModal").modal("hide");
  }

  function showAppendToFile(id) {
    setAppendToFile({
      id: id,
      content: "",
    });
  }

  function deleteFile(id) {
    axios.post(config.BACKEND_URL + "/api/files/delete", {id: id})
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

  function submitEditImage(e) {
    e.preventDefault();
    axios.post(config.BACKEND_URL + '/api/images/edit', editFile)
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

  function submitAppendToFile(e) {
    e.preventDefault();
    axios.post(config.BACKEND_URL + '/api/files/append', appendToFile)
    .then(function (response) {
      if (response.data.status == "OK") {
        MySwal.fire("File has been appended sucessfully.");
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

  function changeSortIndex(e) {
    setSortIndex(e.target.value);
  }

  function changeSortOrder(item) {
    setSelectedSortOrder(item);
    var sorted = [];
    switch(item.value) {
      case "alpha-asc":
        sorted = [...files].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "alpha-desc":
        sorted = [...files].sort((a, b) => a.title.localeCompare(b.title)).reverse();
        break;
      case "date-asc":
        sorted = [...files].sort((a, b) => a["id"] - b["id"]);
        break;
      case "date-desc":
        sorted = [...files].sort((a, b) => a["id"] - b["id"]).reverse();
        break;
      case "size-asc":
        sorted = [...files].sort((a, b) => a["content"].length - b["content"].length);
        break;
      case "size-desc":
        sorted = [...files].sort((a, b) => a["content"].length - b["content"].length).reverse();
        break;
    }
    setFiles(sorted);
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
      "tags": tags_temp.join(",")
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
      loadFiles();
      MySwal.fire("File has been unpinned.");
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

  function submitSetSortIndex(e) {
    e.preventDefault();
    var data = {
      id: id,
      sort_index: sortIndex
    };

    axios.post(config.BACKEND_URL + "/api/categories/set-sort-index", data)
    .then(function(response) {
      if (response.data.status == "OK") {
        MySwal.fire(response.data.data)
        .then(function(value) {
          $(".setSortIndexModal").modal("hide");
        })
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

  useEffect(() => {
    loadImageFiles();
    loadFiles();
    loadPDFFiles();
  }, [id]);

  function scrollToFile() {
    const hash = location.hash
    const el = hash && document.getElementById(hash.substr(1))
    if (el) {    
        el.scrollIntoView({behavior: "smooth"})
    }
  }

  function loadSubcategories() {
    setSubcategories([]);
    axios.get(config.BACKEND_URL + "/api/categories/get-subcategories", {
      params: {
        id: id
      }
    })
    .then(function(response) {
      if (response.data.status == "OK") {
        setSubcategories(response.data.data);
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

  useEffect(() => {
    scrollToFile();
  }, [location.hash]);

  useEffect(() =>{
    loadCategories();
    loadSubcategories();
    loadTags();
    $(".modal").on("focus", function(event) { event.preventDefault(); })
  },[])
  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <div className="col-md-8 p-5">
            <h2>{category != undefined && category['name']}</h2>
            {deleteCategory != undefined && <button className="btn btn-danger btn-delete-category" onClick={deleteCategory}>Delete</button>}
            {category != undefined && <button className="btn btn-primary btn-set-sort-index" data-bs-toggle="modal" data-bs-target=".setSortIndexModal">Set Sort Index</button>}

            <ul class="nav nav-tabs my-3">
              <li class="nav-item">
                <a class={(currentTab == "files") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("files")}>Files</a>
              </li>
              <li class="nav-item">
                <a class={(currentTab == "images") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("images")}>Images</a>
              </li>
              <li class="nav-item">
                <a class={(currentTab == "pdfs") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("pdfs")}>PDFs</a>
              </li>
              <li class="nav-item">
                <a class={(currentTab == "folders") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("folders")}>Folders</a>
              </li>
            </ul>
            
            {currentTab == "files" && (
              <>
              <div style={{width: "200px", margin: "5px"}}>
                <Select value={selectedSortOrder} options={sortOrders} onChange={changeSortOrder}  />
              </div>
              <ul className="index">
                {files.map((file) => 
                  <li key={file['id']}>
                    <Link to={{ pathname: "/categories/" + id, hash: "#" + file['id'] }}>{file['title']}</Link>
                  </li>
                )}
              </ul>
              <ul className="files">
              {files.map((file) => 
                <li key={file['id']} id={file['id']} className="file-entry">
                  <div className="row">
                    <div className="col-md-8">
                      <h3>{file['title']}</h3>
                    </div>
                    <div className="col-md-4 text-end">
                      <div class="dropdown">
                        <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          Actions
                        </button>
                        <ul class="dropdown-menu">
                          {file['pinned'] == 0 ? <li><a class="dropdown-item" href="#" onClick={() => pinFile(file['id'])}>Pin</a></li> : <li><a class="dropdown-item" href="#" onClick={() => unpinFile(file['id'])}>Unpin</a></li>}
                          <li><a class="dropdown-item" href="#" onClick={(e) => {e.preventDefault(); showEditFile(file['id'])}}>Edit</a></li>
                          <li><a class="dropdown-item" href="#" onClick={() => showAppendToFile(file['id'])} data-bs-toggle="modal" data-bs-target=".appendModal">Append</a></li>
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
                </li>
              )}
              
              </ul>
              {files.length < 1 &&
                <h3>There are no files to display.</h3>
              }
              </>
            )}
            {currentTab == "images" && (
              <>
                <ul className="index">
                  {imageFiles.map((image) => 
                    <li key={image['id']}>
                      <Link to={{ pathname: "/categories/" + id, hash: "#" + image['id'] }}>{image['title']}</Link>
                    </li>
                  )}
                </ul>
                <ul className="image-files">
                  {imageFiles.map((image) => 
                    <li key={image['id']} id={image['id']} className="file-entry">
                      <div className="row">
                        <div className="col-md-8">
                          <h3>{image['title']}</h3>
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
                    </li>
                  )}
                </ul>
              </>
            )}
            {currentTab == "pdfs" && (
              <>
                <ul className="index">
                  {pdfFiles.map((pdf) => 
                    <li key={pdf['id']}>
                      <a href={"/api/get-file/" + path.basename(pdf['path'])}>{pdf['title']}</a>
                    </li>
                  )}
                </ul>
              </>
            )}
            {currentTab == "folders" && (
              <>
                <ul className="index">
                  {subcategories.map((f) => 
                    <li key={f['id']}>
                      <a href={"/categories/" + f['id']}>{f['name']}</a>
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      <div class="modal editFileModal" tabindex="-1">
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
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onClick={closeEditFileModal}>Close</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal editImageModal" tabindex="-1">
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
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onClick={closeEditImageModal}>Close</button>
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

      <div class="modal setSortIndexModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Set Sort Index</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
            <form onSubmit={submitSetSortIndex}>
                <div className="form-group py-2">
                    <label className="control-label">Sort Index</label>
                    <div>
                        <input type="text" className="form-control input-lg" name="sortIndex" value={sortIndex} onChange={changeSortIndex} />
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
      <AddCategoryModal />
      <AddTagModal />
    </>
  )
}
