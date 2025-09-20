import axios from 'axios';
import React, {useEffect, useState} from 'react';
import config from '../config.json';
import ListFiles from './ListFiles.js';


export default function Pinned() {
  const [files, setFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);

  function loadFiles() {
    axios.get(config.BACKEND_URL + "/api/files/get-pinned-files")
    .then(function(response) {
      if (response['data'].status == "OK") {
        setFiles(response['data']['data']);
      }
      else {
        if (response['data'].code == 101) {
          setFiles([]);
        }
        console.log(response['data'].error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function loadImageFiles() {
    axios.get(config.BACKEND_URL + "/api/files/get-pinned-images")
    .then(function(response) {
      if (response['data'].status == "OK") {
        setImageFiles(response['data']['data']);
      }
      else {
        if (response['data'].code == 101) {
          setImageFiles([]);
        }
        console.log(response['data'].error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function loadPDFFiles() {
    axios.get(config.BACKEND_URL + "/api/files/get-pinned-pdf-files")
    .then(function(response) {
      if (response['data'].status == "OK") {
        setPdfFiles(response['data']['data']);
      }
      else {
        if (response['data'].code == 101) {
          setPdfFiles([]);
        }
        console.log(response['data'].error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  return (
    <ListFiles loadFiles={loadFiles} loadImageFiles={loadImageFiles} loadPDFFiles={loadPDFFiles} files={files} imageFiles={imageFiles} pdfFiles={pdfFiles} setFiles={setFiles} setImageFiles={setImageFiles} setPdfFiles={setPdfFiles}/>
  )
}
