import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);

  function changeSearchQuery(e) {
    setSearchQuery(e.target.value);
  }

  function submitSearch(e) {
    e.preventDefault();
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
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      alert(err.message);
    });
  }

  return (
    <div className="col-md-8 full-min-height p-5">
      <div className="bg-grey p-5">
        <form onSubmit={submitSearch}>
            <div class="mb-3">
              <input type="text" class="form-control" value={searchQuery} onChange={changeSearchQuery} />
            </div>
            <button type="submit" class="btn btn-primary">Search</button>
        </form>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Parent Category</th>
            </tr>
          </thead>
          <tbody>
            
              {results.map((result) => 
                <tr key={result['id']}>
                  <td>{result['id']}</td>
                  <td>{result['title']}</td>
                  <td>{result['category_name']}</td>
                  <td>{result['parent_category_name']}</td>
                </tr>  
              )}

            {results.length < 1 &&
              <h3>There are no results to display.</h3>
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
