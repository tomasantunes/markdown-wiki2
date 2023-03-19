import axios from 'axios';
import React, {useEffect, useState} from 'react';
import { Link, useLocation } from 'react-router-dom';
import config from '../config.json';
import { useParams, useNavigate } from 'react-router-dom';
import Menu from './Menu';
import Select from 'react-select';
import path from 'path-browserify';
import $ from 'jquery';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import File from './File';

const MySwal = withReactContent(Swal);
window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
const bootstrap5DropdownMlHack = require('../bootstrap5-dropdown-ml-hack');

export default function ListFiles({loadFiles, loadImageFiles, loadPDFFiles, files, setFiles, imageFiles, setImageFiles, pdfFiles, setPdfFiles, deleteCategory, category, setCategory}) {
  const {id} = useParams();
  const location = useLocation();
  const sortOrders = [
    {value: "alpha-asc", label: "Alphabetical Ascending"},
    {value: "alpha-desc", label: "Alphabetical Descending"},
    {value: "date-asc", label: "Date Ascending"},
    {value: "date-desc", label: "Date Descending"},
    {value: "size-asc", label: "Size Ascending"},
    {value: "size-desc", label: "Size Descending"},
  ];
  const [selectedFile, setSelectedFile] = useState(null);
  const [sortIndex, setSortIndex] = useState();
  const [selectedSortOrder, setSelectedSortOrder] = useState({value: "date-asc", label: "Date Ascending"});
  const [currentTab, setCurrentTab] = useState("files");
  const [subcategories, setSubcategories] = useState([]);
  const [editCategoryName, setEditCategoryName] = useState("");
  const navigate = useNavigate();

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

  function submitEditCategoryName(e) {
    e.preventDefault();
    var data = {
      id: id,
      name: editCategoryName
    };

    axios.post(config.BACKEND_URL + "/api/categories/edit-name", data)
    .then(function(response) {
      if (response.data.status == "OK") {
        MySwal.fire(response.data.data)
        .then(function(value) {
          $(".editCategoryNameModal").modal("hide");
          window.location.reload();
        });
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

  function changeEditCategoryName(e) {
    setEditCategoryName(e.target.value);
  }

  function showEditCategoryName() {
    setEditCategoryName(category.name);
    $(".editCategoryNameModal").modal("show");
  }

  function closeEditCategoryName() {
    $(".editCategoryNameModal").modal("hide");
  }

  useEffect(() => {
    loadImageFiles();
    loadFiles();
    loadPDFFiles();
  }, [id]);

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

  useEffect(() =>{
    loadSubcategories();
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
            {category != undefined && <button className="btn btn-primary btn-edit-category-name" onClick={showEditCategoryName}>Edit Category Name</button>}

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
                    <Link to={"/file/" + file['id']}>{file['title']}</Link>
                  </li>
                )}
              </ul>
              <ul className="files">
              {files.map((file) => 
                <li className="file-entry">
                  <File id={file['id']} key={file['id']} />
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
                      <Link to={"/file/" + image['id']}>{image['title']}</Link>
                    </li>
                  )}
                </ul>
                <ul className="image-files">
                  {imageFiles.map((image) => 
                    <li className="file-entry">
                      <File id={image['id']} key={image['id']} />
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
          </div>
        </div>
      </div>
      <div class="modal editCategoryNameModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Category Name</h5>
              <button type="button" class="btn-close" onClick={closeEditCategoryName} aria-label="Close"></button>
            </div>
            <div class="modal-body">
            <form onSubmit={submitEditCategoryName}>
                <div className="form-group py-2">
                    <label className="control-label">Name</label>
                    <div>
                        <input type="text" className="form-control input-lg" name="editCategoryName" value={editCategoryName} onChange={changeEditCategoryName} />
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
    </>
  )
}
