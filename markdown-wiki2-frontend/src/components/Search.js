import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import {Link} from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);

  function changeSearchQuery(e) {
    setSearchQuery(e.target.value);
  }

  function submitSearch(e) {
    e.preventDefault();
    if (searchQuery.trim() == "") {
      MySwal.fire("Search query cannot be empty.");
      return;
    }
    setResults([]);
    axios.get(config.BACKEND_URL + "/api/files/search", {
      params: {
        searchQuery: searchQuery
      }
    })
    .then(function(response) {
      if (response.data.status == "OK") {
        console.log("Search has been successful.");
        setResults(response.data.data);
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

  return (
    <div className="col-md-8 full-min-height p-5">
      <div className="bg-grey p-5">
        <form onSubmit={submitSearch}>
            <div class="mb-3">
              <input type="text" class="form-control" value={searchQuery} onChange={changeSearchQuery} />
            </div>
            <div class="d-flex justify-content-end">
              <button type="submit" class="btn btn-primary">Search</button>
            </div>
        </form>
        <table className="table">
          <thead>
            <tr>
              <th style={{width: "25%"}}>Type</th>
              <th style={{width: "75%"}}>Title</th>
            </tr>
          </thead>
          <tbody>
            
              {results.map((result) => {
                var link = "";
                if (result['type'] == "category") {
                  link = "/categories/" + result['id'];
                }
                else if (result['type'] == "file") {
                  link = "/categories/" + result['category_id'] + "#" + result['id'];
                }
                else if (result['type'] == "tag") {
                  link = "/tag/" + result['id'];
                }

                return (
                  <tr key={result['id']}>
                    <td>{result['type']}</td>
                    <td><Link to={link}>{result['name']}</Link></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        {results.length < 1 &&
          <h3>There are no results to display.</h3>
        }
      </div>
    </div>
  )
}
