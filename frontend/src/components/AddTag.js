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
    setTags([]);
    axios.get(config.BACKEND_URL + "/api/tags/list")
    .then(function(response) {
      console.log(response.data);
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
                {tags.map((tag) => (
                  <li key={tag.id}>{tag.name}</li>
                ))};
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
