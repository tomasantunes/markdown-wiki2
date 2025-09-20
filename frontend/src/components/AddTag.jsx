import React, {useEffect, useState} from 'react';
import Menu from './Menu';
import AddTagForm from './AddTagForm';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import config from '../config.json';

const MySwal = withReactContent(Swal);

export default function AddTag() {
  const [tags, setTags] = useState([]);

  function loadTags() {
    axios.get(config.BACKEND_URL + "/api/tags/list")
    .then(function(response) {
      if (response.data.status == "OK") {
        setTags(response.data.data);
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

  function deleteTag(id, index) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // User clicked "Yes"
        console.log('Confirmed!');

        axios.post(config.BACKEND_URL + "/api/tags/delete", {id: id})
        .then(function(response) {
          if (response.data.status == "OK") {
            setTags((prevTags) => prevTags.filter(tag => tag.id !== id));
            MySwal.fire("Tag has been deleted.");
          }
          else {
            MySwal.fire(response.data.error);
          }
        })
        .catch(function(err) {
          MySwal.fire(err.message);
        });
      } else {
        // User cancelled
        console.log('Cancelled');
      }
    });
  }

  useEffect(() => {
    loadTags();
  }, []);
  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <AddTagForm />
          <div className="col-md-4 full-min-height p-5">
            <div className="bg-grey p-5">
              <ul>
                {tags.map((tag, index) => (
                  <li key={tag.id}>{tag.name} <button className="btn btn-sm btn-danger" onClick={() => deleteTag(tag.id, index) }><i class="fa-solid fa-trash"></i></button></li>
                ))};
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
