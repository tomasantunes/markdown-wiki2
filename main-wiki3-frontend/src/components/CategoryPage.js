import axios from 'axios';
import React, {useEffect, useState} from 'react';
import config from '../config.json';
import { useParams } from 'react-router-dom';
import Menu from './Menu';

export default function CategoryPage() {
  const {id} = useParams();
  const [files, setFiles] = useState([]);

  console.log(id);

  function loadFiles() {
    axios.get(config.BACKEND_URL + "/api/files/get-files-from-category", {
      params: {
        id: id
      }
    })
    .then(function(response) {
      if (response['data'].status == "OK") {
        setFiles(response['data']['data']);
        console.log(response['data']);
      }
      else {
        console.log(response['data'].error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  useEffect(() =>{
    loadFiles();
  },[])
  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <div className="col-md-8 p-5">
            <ul className="files">
            {files.map((file) => 
              <li key={file['id']}>
                <h3>{file['title']}</h3>
                <p>{file['content']}</p>
              </li>
            )}
            </ul>
            {files.length < 1 &&
              <h3>There are no files to display.</h3>
            }
          </div>
        </div>
      </div>
    </>
  )
}
