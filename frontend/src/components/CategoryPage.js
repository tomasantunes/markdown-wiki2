import axios from 'axios';
import React, {useEffect, useState} from 'react';
import config from '../config.json';
import { useParams, useNavigate } from 'react-router-dom';
import ListFiles from './ListFiles.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function CategoryPage() {
  const {id} = useParams();
  const [category, setCategory] = useState({
    "name": ""
  });
  const [files, setFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);
  const navigate = useNavigate();

  function loadFiles() {
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
    axios.get(config.BACKEND_URL + "/api/files/get-pdf-files-from-category", {
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
          setPdfFiles([]);
        }
        console.log(response['data'].error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function loadCategoryInfo() {
    axios.get(config.BACKEND_URL + "/api/categories/getone", {
      params: {
        id: id
      }
    })
    .then(function(response) {
      if (response.data.status == "OK") {
        setCategory(response.data.data);
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

  function deleteCategory() {
    MySwal.fire({
      title: 'Are you sure you want to delete this category? All the files in this category will be deleted.',
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: 'Yes',
      denyButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        axios.post(config.BACKEND_URL + "/api/categories/delete", {id: id})
        .then(function(response) {
          if (response.data.status == "OK") {
            MySwal.fire('This category has been deleted.')
            .then(function(value) {
              navigate("/");
            })
          }
          else {
            MySwal.fire('There was an error deleting this category.');
          }
        })
        .catch(function(err) {
          MySwal.fire(err.message);
        });
      }
    })
  }

  useEffect(() => {
    loadCategoryInfo();
  }, []);
  
  return (
    <ListFiles loadFiles={loadFiles} loadImageFiles={loadImageFiles} loadPDFFiles={loadPDFFiles} files={files} imageFiles={imageFiles} pdfFiles={pdfFiles} setFiles={setFiles} setImageFiles={setImageFiles} setPdfFiles={setPdfFiles} deleteCategory={deleteCategory} category={category} />
  );
}
