import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config.json';

export default function Bookmarks() {
  const [bookmarksText, setBookmarksText] = useState("");

  function loadBookmarks() {
    axios.get(config.BACKEND_URL + "/api/bookmarks").then(function(response){
        setBookmarksText(response.data);
    });
  }

  useEffect(() => {
    loadBookmarks();
  }, []);

  return (
    <div>{bookmarksText}</div>
  )
}
