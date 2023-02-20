import React, {useState, useEffect} from 'react';
import axios from 'axios';
import Menu from './Menu';
import config from '../config.json';
import Select from 'react-select';
import FileUploader from './FileUploader';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import ReactPaginate from 'react-paginate';
import $ from 'jquery';

const MySwal = withReactContent(Swal);
window.jQuery = $;
window.$ = $;
global.jQuery = $;
const bootstrap = require('bootstrap');

export default function Bookmarks() {
  const [bookmarkFolders, setBookmarkFolders] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState();
  const [bookmarksFile, setBookmarksFile] = useState();
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(0);
  const bookmarksPerPage = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [editBookmark, setEditBookmark] = useState({
    id: "",
    title: "",
    url: "",
    tags: "",
    parent_id: ""
  });
  const [editBookmarkSelectedFolder, setEditBookmarkSelectedFolder] = useState();

  function changeSelectedFolder(item) {
    setSelectedFolder(item);
  }

  function changeBookmarksFile({file}) {
    setBookmarksFile(file);
  }

  function changeEditBookmarkFolder(item) {
    setEditBookmarkSelectedFolder(item);
    setEditBookmark({...editBookmark, parent_id: item.value});
  }

  function changeEditBookmarkTitle(e) {
    setEditBookmark({...editBookmark, title: e.target.value});
  }

  function changeEditBookmarkUrl(e) {
    setEditBookmark({...editBookmark, url: e.target.value});
  }

  function changeEditBookmarkTags(e) {
    setEditBookmark({...editBookmark, tags: e.target.value});
  }

  function submitEditBookmark(e) {
    e.preventDefault();
    if (editBookmark.title.trim() == "" || editBookmark.url.trim() == "" || editBookmark.parent_id == "") {
      MySwal.fire("Fields cannot be empty.");
      return;
    }
    
    axios.post(config.BACKEND_URL + "/api/bookmarks/edit", editBookmark)
    .then(function(response) {
      if (response.data.status == "OK") {
        $(".editBookmarkModal").modal("hide");
        MySwal.fire("Bookmark has been edited successfully.").then(function(value) {
          loadBookmarks();
        });
      }
      else {
        MySwal.fire("Error editing bookmark: " + response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
      MySwal.fire("Error editing bookmark: " + err.message);
    });
  }

  function showEditBookmark(e) {
    var id = e.target.value;
    axios.get(config.BACKEND_URL + "/api/bookmarks/getone", {
      params: {
        id: id
      }
    })
    .then(function(response) {
      if (response.data.status == "OK") {
        var bookmark = response.data.data;
        setEditBookmark({
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          tags: bookmark.tags,
          parent_id: bookmark.parent_id
        });
        setEditBookmarkSelectedFolder(bookmarkFolders.find(function(item) {
          return item.value == bookmark.parent_id;
        }));
        $(".editBookmarkModal").modal("show");
      }
      else {
        MySwal.fire("Error loading bookmark: " + response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
      MySwal.fire("Error loading bookmark: " + err.message);
    });
  }

  function uploadBookmarksFile() {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", bookmarksFile);
    axios.post(config.BACKEND_URL + "/api/upload-bookmarks", formData)
    .then(function(response) {
      if (response.data.status == "OK") {
        setIsUploading(false);
        MySwal.fire("Bookmarks file has been uploaded successfully.").then(function(value) {
          loadBookmarkFolders();
        });
      }
      else {
        setIsUploading(false);
        MySwal.fire("Error uploading bookmarks file: " + response.data.error);
      }
    })
    .catch(function(err) {
      setIsUploading(false);
      console.log(err);
      MySwal.fire("Error uploading bookmarks file: " + err.message);
    })
  }
  
  function loadBookmarks() {
    console.log(selectedFolder);
    console.log(selectedFolder != undefined);
    if (selectedFolder != undefined) {
      axios.get(config.BACKEND_URL + "/api/get-bookmarks-from-folder", {
        params: {
          folder_id: selectedFolder.value,
          offset: page * bookmarksPerPage, 
          limit: bookmarksPerPage
        }
      })
      .then(function(response) {
        if (response.data.status == "OK") {
          console.log(response.data.data.bookmarks);
          setBookmarks(response.data.data.bookmarks);
          setTotalPages(Math.ceil(response.data.data.count / bookmarksPerPage));
        }
        else {
          MySwal.fire("Error loading bookmarks: " + response.data.error);
        }
      })
      .catch(function(err) {
        console.log(err);
        MySwal.fire(err.message);
      })
    }
  }

  function changePage({ selected }) {
    setPage(selected);
  }

  function getChildrenFolders(folder1, folders1, level) {
    level++;
    var children = [];
    var prefix = ">>> ".repeat(level);
    for (var i in folders1) {
      var child = folders1[i];
      if (child.parent_id == folder1.id) {
        children.push({value: child.id, label: prefix + child.title});
        children = children.concat(getChildrenFolders(child, folders1, level));
      }
    }
    return children;
  }

  function loadBookmarkFolders() {
    axios.get(config.BACKEND_URL + "/api/bookmarks/get-folders")
    .then(function(response) {
      if (response.data.status == "OK") {
        console.log()
        if (response.data.data.length > 0) {
          var folders1 = response.data.data;
          var folders_to_add = [];
          var folder1 = {id: 0};
          var children = getChildrenFolders(folder1, folders1, -1);
          folders_to_add = folders_to_add.concat(children);
          setBookmarkFolders(folders_to_add);
        }
        else {
          setBookmarkFolders([]);
        }
      }
      else {
        MySwal.fire("Error loading bookmark folders.");
      }
    })
    .catch(function(err) {
      console.log(err);
      MySwal.fire(err.message);
    })
  }
  
  useEffect(() => {
    loadBookmarks();
  }, [page]);

  useEffect(() => {
    setPage(0);
    loadBookmarks();
  }, [selectedFolder]);

  useEffect(() => {
    loadBookmarkFolders();
  }, []);

  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <div className="col-md-10 full-min-height p-5">
            <h2>Bookmarks</h2>
            
            <div className="upload-bookmarks">
              <h4>Upload Bookmarks(HTML)</h4>
              <FileUploader onFileSelectSuccess={(file) => changeBookmarksFile({file})} onFileSelectError={({error}) => MySwal.fire(error)} />
              <button className="btn btn-primary btn-upload-bookmarks" onClick={uploadBookmarksFile}>Upload</button>
              {isUploading && <p>Uploading...</p>}
            </div>
            <div>
              <h4>Select Folder</h4>
              <Select value={selectedFolder} options={bookmarkFolders} onChange={changeSelectedFolder} />
            </div>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>URL</th>
                  <th>Tags</th>
                  <th>Options</th>
                </tr>
              </thead>
              <tbody>
                {bookmarks.map((bookmark) => (
                  <tr key={bookmark.id}>
                    <td>{bookmark.id}</td>
                    <td>{bookmark.title}</td>
                    <td><a href={bookmark.url}>{bookmark.url}</a></td>
                    <td>{bookmark.tags}</td>
                    <td><button className="btn btn-primary" onClick={showEditBookmark} value={bookmark.id}>Edit</button></td>
                  </tr>
                  ))}
              </tbody>
            </table>
            <ReactPaginate
              previousLabel={"Previous"}
              nextLabel={"Next"}
              pageCount={totalPages}
              onPageChange={changePage}
              containerClassName={"navigationButtons"}
              previousLinkClassName={"previousButton"}
              nextLinkClassName={"nextButton"}
              disabledClassName={"navigationDisabled"}
              activeClassName={"navigationActive"}
            />
          </div>
        </div>
      </div>
      <div class="modal editBookmarkModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Bookmark</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
            <form onSubmit={submitEditBookmark}>
                <div className="form-group py-2">
                    <label className="control-label">Title</label>
                    <div>
                        <input type="text" className="form-control input-lg" name="title" value={editBookmark.title} onChange={changeEditBookmarkTitle} />
                    </div>
                </div>
                <div className="form-group py-2">
                    <label className="control-label">URL</label>
                    <div>
                        <input type="text" className="form-control input-lg" name="url" value={editBookmark.url} onChange={changeEditBookmarkUrl} />
                    </div>
                </div>
                <div className="form-group py-2">
                    <label className="control-label">Folder</label>
                    <div>
                        <Select value={editBookmarkSelectedFolder} options={bookmarkFolders} onChange={changeEditBookmarkFolder} />
                    </div>
                </div>
                <div className="form-group py-2">
                    <label className="control-label">Tags</label>
                    <div>
                        <input type="text" className="form-control input-lg" name="tags" value={editBookmark.tags} onChange={changeEditBookmarkTags} />
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
