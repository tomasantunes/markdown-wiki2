import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function AddTagForm() {
    const [newTag, setNewTag] = useState({
      "tag": ""
    });
  
    function changeNewTagTag(e) {
      setNewTag({
        ...newTag,
        "tag": e.target.value
      });
    }
  
    function submitNewTag(e) {
      e.preventDefault();

      if (newTag.tag.trim() == "") {
        MySwal.fire("Tag name cannot be empty.");
        return;
      }

      axios.post(config.BACKEND_URL + '/api/tags/insert', newTag)
      .then(function (response) {
        MySwal.fire("A new tag has been inserted successfully.").then(function(value) {
          window.location.reload();
        });
      })
      .catch(function (error) {
        console.log(error);
      });
    }
  
    return (
      <div className="col-md-4 full-min-height p-5">
        <div className="bg-grey p-5">
          <h1>Add Tag</h1>
          <form onSubmit={submitNewTag}>
            <div className="form-group py-2">
                <label className="control-label">Tag</label>
                <div>
                    <input type="text" className="form-control input-lg" name="tag" value={newTag.tag} onChange={changeNewTagTag}/>
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
    )
}
