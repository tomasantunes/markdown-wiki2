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
  const [bookmarkFolders, setBookmarkFolders] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [folder, setFolder] = useState();
  const [bookmarksFile, setBookmarksFile] = useState();
  const [isUploading, setIsUploading] = useState(false);

  function changeFolder(folder) {
    setFolder(folder);
  }

  function changeBookmarksFile({file}) {
    setBookmarksFile(file);
  }

  function uploadBookmarksFile() {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", bookmarksFile);
    axios.post(config.BACKEND_URL + "/api/upload-bookmarks", formData)
    .then(function(response) {
      if (response.data.status == "OK") {
        setIsUploading(false);
        MySwal.fire("Bookmarks file has been uploaded successfully.");
        //loadBookmarks();
      }
      else {
        setIsUploading(false);
        MySwal.fire("Error uploading bookmarks file.");
      }
    })
    .catch(function(err) {
      setIsUploading(false);
      console.log(err);
      MySwal.fire("Error uploading bookmarks file.");
    })
  }
  
  function loadBookmarks() {
    axios.get(config.BACKEND_URL + "/api/bookmarks/get-all")
    .then(function(response) {
      if (response.data.status == "OK") {
        setBookmarks(response.data.data);
      }
    });
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
        var folders1 = response.data.data;
        var folders_to_add = [];
        var folder1 = {id: 0};
        var children = getChildrenFolders(folder1, folders1, -1);
        folders_to_add = folders_to_add.concat(children);
        setBookmarkFolders(folders_to_add);
      }
      else {
        MySwal.fire("Error loading bookmark folders.");
      }
    });
  }
  

  useEffect(() => {
    if (bookmarks.length > 0) {
      
    }
  }, [bookmarks]);

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
              <Select value={folder} options={bookmarkFolders} onChange={changeFolder} />
            </div>
            {/* TODO: Create table to show bookmarks for each folder */}
          </div>
        </div>
      </div>
    </>
  )
}
