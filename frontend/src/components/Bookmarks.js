import React, {useState, useEffect} from 'react';
import axios from 'axios';
import Menu from './Menu';
import config from '../config.json';
import Select from 'react-select';

export default function Bookmarks() {
  const [bookmarksFolders, setBookmarksFolders] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [folder, setFolder] = useState();

  function changeFolder(folder) {
    setFolder(folder);
  }

  function getChildrenFolders(folder) {
    var children = [];
    console.log(folder.children);
    for (var i in folder.children) {
      if (folder.children[i].type != "bookmark") {
        children.push(folder.children[i]);
      }
      if (folder.children[i].type != "bookmark" && folder.children[i].children.length > 0) {
        var children2 = getChildrenFolders(folder.children[i]);
        for (var j in children2) {
          children.push(children2[j]);
        }
      }
    }
    console.log(children);
    return children;
  }

  function loadBookmarksFolders() {
    console.log(bookmarks);
    var folders = [];
    for (var i in bookmarks) {
      if (bookmarks[i].type != "bookmark") {
        folders.push({value: bookmarks[i].title, label: bookmarks[i].title});
        var children = getChildrenFolders(bookmarks[i]);
        for (var j in children) {
          folders.push({value: children[j].title, label: children[j].title});
        }
      }
    }
    console.log(folders);
    setBookmarksFolders(folders);
  }

  function loadBookmarks() {
    axios.get(config.BACKEND_URL + "/api/bookmarks/get-all")
    .then(function(response) {
      console.log(response.data);
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
            <Select value={folder} options={bookmarksFolders} onChange={changeFolder} />
            {/* TODO: Create table to show bookmarks for each folder */}
          </div>
        </div>
      </div>
    </>
  )
}
