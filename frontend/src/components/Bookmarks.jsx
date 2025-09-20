import React, {useState, useEffect} from 'react';
import axios from 'axios';
import Menu from './Menu';
import config from '../config.json';
import Select from 'react-select';
import FileUploader from './FileUploader';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import ReactPaginate from 'react-paginate';

const MySwal = withReactContent(Swal);

export default function Bookmarks() {
  const [bookmarkFolders, setBookmarkFolders] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState();
  const [bookmarksFile, setBookmarksFile] = useState();
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(0);
  const bookmarksPerPage = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [newBookmark, setNewBookmark] = useState({
    title: "",
    url: "",
    tags: "",
    parent_id: ""
  });
  const [editBookmark, setEditBookmark] = useState({
    id: "",
    title: "",
    url: "",
    tags: "",
    parent_id: ""
  });
  const [newBookmarkParent, setNewBookmarkParent] = useState("");
  const [editBookmarkSelectedFolder, setEditBookmarkSelectedFolder] = useState();
  const [enableImportFolder, setEnableImportFolder] = useState(false);
  const [importFolder, setImportFolder] = useState("");
  const [ignoreFolders, setIgnoreFolders] = useState(false);
  const [enableTargetFolder, setEnableTargetFolder] = useState(false);
  const [targetFolder, setTargetFolder] = useState("");
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [newFolderParent, setNewFolderParent] = useState();
  const [removeDupsFolder, setRemoveDupsFolder] = useState();
  const [isRemovingDups, setIsRemovingDups] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [currentTab, setCurrentTab] = useState("list");

  function changeNewBookmarkParent(item) {
    setNewBookmark({...newBookmark, parent_id: item.value});
    setNewBookmarkParent(item);
  }

  function changeNewBookmarkTags(e) {
    setNewBookmark({...newBookmark, tags: e.target.value});
  }

  function changeNewBookmarkTitle(e) {
    setNewBookmark({...newBookmark, title: e.target.value});
  }

  function changeNewBookmarkUrl(e) {
    setNewBookmark({...newBookmark, url: e.target.value});
  }

  function createBookmark(e) {
    e.preventDefault();
    if (newBookmark.title.trim() == "" || newBookmark.url.trim() == "" || newBookmark.parent_id.toString() == "") {
      MySwal.fire("Fields cannot be empty.");
      return;
    }

    axios.post(config.BACKEND_URL + "/api/bookmarks/create-bookmark", newBookmark)
    .then(function(response) {
      if (response.data.status == "OK") {
        console.log("Bookmark has been created.");
        MySwal.fire("Bookmark has been created.");
        setNewBookmark({
          title: "",
          url: "",
          tags: "",
          parent_id: ""
        });
        setNewBookmarkParent("");
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

  function changeSearchQuery(e) {
    setSearchQuery(e.target.value);
  }

  function submitSearch(e) {
    e.preventDefault();
    if (searchQuery.trim() == "") {
      MySwal.fire("Search query cannot be empty.");
      return;
    }
    setResults([]);
    axios.get(config.BACKEND_URL + "/api/bookmarks/search", {
      params: {
        query: searchQuery
      }
    })
    .then(function(response) {
      if (response.data.status == "OK") {
        console.log("Search has been successful.");
        setResults(response.data.data);
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

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

  function changeEnableImportFolder(e) {
    setEnableImportFolder(e.target.checked);
  }

  function changeImportFolder(e) {
    setImportFolder(e.target.value);
  }

  function changeIgnoreFolders(e) {
    setIgnoreFolders(e.target.checked);
  }

  function changeEnableTargetFolder(e) {
    setEnableTargetFolder(e.target.checked);
  }

  function changeTargetFolder(item) {
    setTargetFolder(item);
  }

  function changeNewFolderTitle(e) {
    setNewFolderTitle(e.target.value);
  }

  function changeNewFolderParent(item) {
    setNewFolderParent(item);
  }

  function changeRemoveDupsFolder(item) {
    setRemoveDupsFolder(item);
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
        var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.editBookmarkModal'))
        modal.hide();
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
        var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.editBookmarkModal'))
        modal.show();
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

  function deleteBookmark(e) {
    MySwal.fire({
      title: "Are you sure?",
      showConfirmButton: true,
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        axios.post(config.BACKEND_URL + "/api/bookmarks/delete", {id: e.target.value})
        .then(function(response) {
          if (response.data.status == "OK") {
            MySwal.fire("Bookmark has been deleted.").then(function(value) {
              loadBookmarks();
            });
          }
          else {
            MySwal.fire("Error: " + response.data.error);
          }
        })
        .catch(function(err) {
          MySwal.fire("Error: " + err.message);
        })
      }
    })
  }

  function removeBookmarkDups() {
    setIsRemovingDups(true);
    var data = {
      folder_id: removeDupsFolder.value
    };

    axios.post(config.BACKEND_URL + "/api/bookmarks/remove-dups", data)
    .then(function(response) {
      if (response.data.status == "OK") {
        setIsRemovingDups(false);
        MySwal.fire("Duplicates have been removed successfully.").then(function(value) {
          window.location.reload();
        });
      }
      else {
        setIsRemovingDups(false);
        MySwal.fire("Error removing duplicates: " + response.data.error);
      }
    })
    .catch(function(err) {
      setIsRemovingDups(false);
      console.log(err);
      MySwal.fire("Error removing duplicates: " + err.message);
    });
  }

  function createBookmarkFolder() {
    var data = {
      title: newFolderTitle,
      parent_id: newFolderParent.value
    };

    axios.post(config.BACKEND_URL + "/api/bookmarks/create-folder", data)
    .then(function(response) {
      if (response.data.status == "OK") {
        MySwal.fire("Folder has been created successfully.").then(function(value) {
          setNewFolderTitle("");
          setNewFolderParent({});
          loadBookmarkFolders();
        });
      }
      else {
        MySwal.fire("Error creating folder: " + response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
      MySwal.fire("Error creating folder: " + err.message);
    });
  }

  function uploadBookmarksFile() {
    if (ignoreFolders == true && targetFolder == undefined) {
      MySwal.fire("Target folder cannot be empty when ignoring folders.");
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", bookmarksFile);
    formData.append("import_folder", importFolder);
    formData.append("ignore_folders", ignoreFolders);
    if (targetFolder != undefined) {
      formData.append("target_folder", targetFolder.value);
    }
    axios.post(config.BACKEND_URL + "/api/upload-bookmarks", formData)
    .then(function(response) {
      if (response.data.status == "OK") {
        setIsUploading(false);
        MySwal.fire("Bookmarks file has been uploaded successfully.").then(function(value) {
          window.location.reload();
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

  function deleteAllBookmarks() {
    MySwal.fire({
      title: 'Are you sure you want to delete all bookmarks?',
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: 'Yes',
      denyButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        axios.post(config.BACKEND_URL + "/api/bookmarks/delete-all")
        .then(function(response) {
          if (response.data.status == "OK") {
            MySwal.fire("All bookmarks have been deleted successfully.").then(function(value) {
              window.location.reload();
            });
          }
          else {
            MySwal.fire("Error deleting bookmarks: " + response.data.error);
          }
        })
        .catch(function(err) {
          console.log(err);
          MySwal.fire("Error deleting bookmarks: " + err.message);
        });
      }
    });
  }
  
  function loadBookmarks() {
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
          folders_to_add.push({value: 0, label: "Root"});
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
    if (ignoreFolders == true) {
      setEnableTargetFolder(true);
    }
  }, [ignoreFolders]);

  useEffect(() => {
    if (!enableImportFolder) {
      setImportFolder("");
    }
  }, [enableImportFolder]);

  useEffect(() => {
    if (!enableTargetFolder) {
      setTargetFolder(undefined);
    }
  }, [enableTargetFolder]);

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
            <div className="row">
              <div className="col-md-12">
                <h2>Bookmarks</h2>
                <button className="btn btn-danger btn-delete-all-bookmarks" onClick={deleteAllBookmarks}>Delete All</button>
              </div>
            </div>
            <div className="row">

              <ul class="nav nav-tabs">
                <li class="nav-item">
                  <a class={(currentTab == "list") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("list")}>List</a>
                </li>
                <li class="nav-item">
                  <a class={(currentTab == "import") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("import")}>Import</a>
                </li>
                <li class="nav-item">
                  <a class={(currentTab == "add-bookmark") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("add-bookmark")}>Add Bookmark</a>
                </li>
                <li class="nav-item">
                  <a class={(currentTab == "add-folder") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("add-folder")}>Add Folder</a>
                </li>
                <li class="nav-item">
                  <a class={(currentTab == "remove-dups") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("remove-dups")}>Remove Duplicates</a>
                </li>
                <li class="nav-item">
                  <a class={(currentTab == "search") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("search")}>Search</a>
                </li>
              </ul>

              {currentTab == "import" &&
              <div className="col-md-6 p-3">
                
                <div className="upload-bookmarks">
                  <h4>Upload Bookmarks(HTML)</h4>
                  <div className="form-control bg-grey upload-bookmarks-control">
                    <p>Import folder</p>
                    <input type="checkbox" className="form-check-input" name="enableImportFolder" checked={enableImportFolder} onChange={changeEnableImportFolder} />
                    {enableImportFolder && <input type="text" className="form-control my-2" name="importFolder" value={importFolder} onChange={changeImportFolder} />}
                  </div>
                  <div className="form-control bg-grey upload-bookmarks-control">
                    <p>Ignore folders</p>
                    <input type="checkbox" className="form-check-input" name="ignoreFolders" checked={ignoreFolders} onChange={changeIgnoreFolders} />
                  </div>
                  <div className="form-control bg-grey upload-bookmarks-control">
                    <p>Target folder</p>
                    <input type="checkbox" className="form-check-input" name="enableTargetFolder" checked={enableTargetFolder} onChange={changeEnableTargetFolder} />
                    {enableTargetFolder && <Select className="my-2" value={targetFolder} options={bookmarkFolders} onChange={changeTargetFolder} />}
                  </div>
                  
                  <FileUploader onFileSelectSuccess={(file) => changeBookmarksFile({file})} onFileSelectError={({error}) => MySwal.fire(error)} />
                  <button className="btn btn-primary btn-upload-bookmarks" onClick={uploadBookmarksFile}>Upload</button>
                  {isUploading && <p>Uploading...</p>}
                </div>
              </div>
              }
              {currentTab == "add-bookmark" &&
              <div className="col-md-6 p-3">
                <div className="add-bookmark">
                  <h4>Add Bookmark</h4>
                  <p>Title</p>
                  <input type="text" className="form-control my-2" name="bookmarkTitle" value={newBookmark.title} onChange={changeNewBookmarkTitle} />
                  <p>URL</p>
                  <input type="text" className="form-control my-2" name="bookmarkUrl" value={newBookmark.url} onChange={changeNewBookmarkUrl} />
                  <p>Tags</p>
                  <input type="text" className="form-control my-2" name="bookmarkTags" value={newBookmark.tags} onChange={changeNewBookmarkTags} />
                  <p>Parent</p>
                  <Select className="my-2" value={newBookmarkParent} options={bookmarkFolders} onChange={changeNewBookmarkParent} />
                  <button className="btn btn-primary btn-add-bookmark" onClick={createBookmark}>Add</button>
                </div>
              </div>
              }
              {currentTab == "add-folder" &&
              <div className="col-md-6 p-3">
                <div className="add-bookmark-folder">
                  <h4>Add Folder</h4>
                  <p>Title</p>
                  <input type="text" className="form-control my-2" name="folderTitle" value={newFolderTitle} onChange={changeNewFolderTitle} />
                  <p>Parent</p>
                  <Select className="my-2" value={newFolderParent} options={bookmarkFolders} onChange={changeNewFolderParent} />
                  <button className="btn btn-primary btn-add-bookmark-folder" onClick={createBookmarkFolder}>Add</button>
                </div>
              </div>
              }
              {currentTab == "remove-dups" &&
              <div className="col-md-6 p-3">
                <div className="remove-bookmark-dups">
                  <h4>Remove Duplicates</h4>
                  <p>Folder</p>
                  <Select className="my-2" value={removeDupsFolder} options={bookmarkFolders} onChange={changeRemoveDupsFolder} />
                  <button className="btn btn-primary btn-remove-bookmark-dups" onClick={removeBookmarkDups}>Remove</button>
                  {isRemovingDups && <p>Removing duplicates...</p>}
                </div>
              </div>
              }
            </div>
            {currentTab == "list" &&
            <div className="row">
              <div className="col-md-12 p-3">
                <h3>List Bookmarks</h3>
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
                        <td>
                          <button className="btn btn-primary btn-edit-bookmark" onClick={showEditBookmark} value={bookmark.id}>Edit</button>
                          <button className="btn btn-danger btn-delete-bookmark" onClick={deleteBookmark} value={bookmark.id}>Delete</button>
                        </td>
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
            }
            {currentTab == "search" &&
              <div className="row">
                <div className="col-md-12 p-3">
                  <div className="bg-grey p-5">
                    <form onSubmit={submitSearch}>
                        <div class="mb-3">
                          <input type="text" class="form-control" value={searchQuery} onChange={changeSearchQuery} />
                        </div>
                        <div class="d-flex justify-content-end">
                          <button type="submit" class="btn btn-primary">Search</button>
                        </div>
                    </form>

                    <table className="table">
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
                        
                        {results.map((bookmark) => {
                          return (
                            <tr key={bookmark.id}>
                              <td>{bookmark.id}</td>
                              <td>{bookmark.title}</td>
                              <td><a href={bookmark.url}>{bookmark.url}</a></td>
                              <td>{bookmark.tags}</td>
                              <td><button className="btn btn-primary" onClick={showEditBookmark} value={bookmark.id}>Edit</button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {results.length < 1 &&
                      <h3>There are no results to display.</h3>
                    }
                  </div>
                </div>
              </div>
            }
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
          </div>
        </div>
      </div>
    </>
  )
}
