import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config.json';
import Select from 'react-select';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import $ from 'jquery';

const MySwal = withReactContent(Swal);
window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
const bootstrap5DropdownMlHack = require('../bootstrap5-dropdown-ml-hack');

export default function AddTagModal({id}) {
  const [newTag, setNewTag] = useState("");

  function close() {
    $('.addTagModal').modal('hide');
  }

  function changeNewTag(e) {
    setNewTag(e.target.value);
  }

  function submitNewTag(e) {
    e.preventDefault();

    if (newTag.trim() == "") {
      MySwal.fire("Fields cannot be empty.");
      return;
    }

    axios.post(config.BACKEND_URL + '/api/tags/insert', {tag: newTag})
    .then(function (response) {
      MySwal.fire("New tag has been added.")
      .then((value) => {
        $('.addTagModal').modal('hide');
        setNewTag("");
      });
    })
    .catch(function (error) {
      console.log(error);
      MySwal.fire("There was an error adding the new tag.");
    });
  }

  return (
    <div class="modal addTagModal" id={"addTagModal" + id} tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Tag</h5>
            <button type="button" class="btn-close" onClick={close} aria-label="Close"></button>
          </div>
          <div class="modal-body">
          <form onSubmit={submitNewTag}>
              <div className="form-group py-2">
                <label className="control-label">Tag</label>
                <div>
                    <input type="text" className="form-control input-lg" name="tag" value={newTag} onChange={changeNewTag}/>
                </div>
              </div>
              <div className="form-group">
                  <div style={{textAlign: "right"}}>
                      <button type="submit" className="btn btn-primary">Submit</button>
                  </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}