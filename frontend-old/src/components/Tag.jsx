import axios from 'axios';
import React, {useEffect, useState} from 'react';
import config from '../config.json';
import { useParams } from 'react-router-dom';
import ListFiles from './ListFiles.js';

export default function Lolololololol() {
  const {id} = useParams();
  const [files, setFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);

  function loadFiles() {
    axios.get(config.BACKEND_URL + "/api/files/get-files-from-tag", {
      params: {
        id: id
      }
    })
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
    axios.get(config.BACKEND_URL + "/api/files/get-image-files-from-tag", {
      params: {
        id: id
      }
    })
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
    axios.get(config.BACKEND_URL + "/api/files/get-pdf-files-from-tag", {
      params: {
        id: id
      }
    })
    .then(function(response) {
      if (response['data'].status == "OK") {
        setPdfFiles(response['data']['data']);
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

  return (
    <ListFiles loadFiles={loadFiles} loadImageFiles={loadImageFiles} loadPDFFiles={loadPDFFiles} files={files} imageFiles={imageFiles} pdfFiles={pdfFiles} setFiles={setFiles} setImageFiles={setImageFiles} setPdfFiles={setPdfFiles}/>
  );
}
