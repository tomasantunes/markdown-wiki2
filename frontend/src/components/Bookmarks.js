import React, {useState, useEffect} from 'react';
import axios from 'axios';
import Menu from './Menu';
import config from '../config.json';
import Select from 'react-select';
import FileUploader from './FileUploader';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function Bookmarks() {
  const [bookmarksFolders, setBookmarksFolders] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [folder, setFolder] = useState();
  const [bookmarksFile, setBookmarksFile] = useState();

  function changeFolder(folder) {
    setFolder(folder);
  }

  function getChildrenFolders(folder, level) {
    var children = [];
    level += 1;
    var prefix = ">>> ".repeat(level);
    for (var i in folder.children) {
      if (folder.children[i].type != "bookmark") {
        children.push({value: folder.children[i].title, label: prefix + folder.children[i].title});
      }
      if (folder.children[i].type != "bookmark" && folder.children[i].children.length > 0) {
        var children2 = getChildrenFolders(folder.children[i], level);
        console.log(prefix);
        for (var j in children2) {
          children.push(children2[j]);
        }
      }
    }
    return children;
  }

  function changeBookmarksFile({file}) {
    setBookmarksFile(file);
  }

  function uploadBookmarksFile() {
    const formData = new FormData();
    formData.append("file", bookmarksFile);
    axios.post(config.BACKEND_URL + "/api/upload-bookmarks", formData)
    .then(function(response) {
      if (response.data.status == "OK") {
        MySwal.fire("Bookmarks file has been uploaded successfully.");
        loadBookmarks();
      }
      else {
        MySwal.fire("Error uploading bookmarks file.");
      }
    })
    .catch(function(err) {
      console.log(err);
      MySwal.fire("Error uploading bookmarks file.");
    })
  }

  function loadBookmarksFolders() {
    var folders = [];
    for (var i in bookmarks) {
      if (bookmarks[i].type != "bookmark") {
        var level = 0;
        folders.push({value: bookmarks[i].title, label: bookmarks[i].title});
        var children = getChildrenFolders(bookmarks[i], level);
        for (var j in children) {
          folders.push(children[j]);
        }
      }
    }
    setBookmarksFolders(folders);
  }

  function loadBookmarks() {
    axios.get(config.BACKEND_URL + "/api/bookmarks/get-all")
    .then(function(response) {
      if (response.data.status == "OK") {
        setBookmarks(response.data.data);
      }
    });
  }

  useEffect(() => {
    if (bookmarks.length > 0) {
      loadBookmarksFolders();
    }
  }, [bookmarks]);

  useEffect(() => {
    loadBookmarks();
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
            </div>
            <div>
              <h4>Select Folder</h4>
              <Select value={folder} options={bookmarksFolders} onChange={changeFolder} />
            </div>
            {/* TODO: Create table to show bookmarks for each folder */}
          </div>
        </div>
      </div>
    </>
  )
}
