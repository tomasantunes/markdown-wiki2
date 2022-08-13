import axios from 'axios';
import React, {useEffect, useState} from 'react';
import config from '../config.json';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'
import { CsvToHtmlTable } from 'react-csv-to-table';
import Menu from './Menu';

export default function CategoryPage() {
  const {id} = useParams();
  const [files, setFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  function loadFiles() {
    setFiles([]);
    axios.get(config.BACKEND_URL + "/api/files/get-files-from-category", {
      params: {
        id: id
      }
    })
    .then(function(response) {
      if (response['data'].status == "OK") {
        setFiles(response['data']['data']);
      }
      else {
        console.log(response['data'].error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function loadImageFiles() {
    setImageFiles([]);
    axios.get(config.BACKEND_URL + "/api/files/get-image-files-from-category", {
      params: {
        id: id
      }
    })
    .then(function(response) {
      if (response['data'].status == "OK") {
        setImageFiles(response['data']['data']);
      }
      else {
        console.log(response['data'].error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  useEffect(() => {
    loadImageFiles();
    loadFiles();
  }, [id]); 

  useEffect(() =>{
    loadImageFiles();
    loadFiles();
  },[])
  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <div className="col-md-8 p-5">
            <ul className="image-files">
              {imageFiles.map((image) => 
                <li key={image['id']}>
                  <img src={config.BACKEND_URL + "/api/images/get/" + image.title + "." + image.extension} />
                </li>
              )}
            </ul>
            <ul className="files">
            {files.map((file) => 
              <li key={file['id']}>
                <h3>{file['title']}</h3>
                
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
