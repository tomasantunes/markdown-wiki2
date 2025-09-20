import React, {useState, useEffect} from 'react';
import Menu from "./Menu";
import config from '../config.json';
import {Link} from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Select from 'react-select';
import axios from 'axios';

const MySwal = withReactContent(Swal);

export default function SearchTags() {
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [results, setResults] = useState([]);

  function changeSelectedTags(items) {
    setSelectedTags(items);
  }

  function submitSearch(e) {
    e.preventDefault();
    if (selectedTags.length < 1) {
      MySwal.fire("Please select at least one tag.");
      return;
    }
    setResults([]);
    var tags_arr = [];
    for (var i in selectedTags) {
      tags_arr.push(selectedTags[i].value);
    }
    var tags_str = tags_arr.join(",");
    axios.get(config.BACKEND_URL + "/api/files/search-tags", {
      params: {
        tags: tags_str
      }
    })
    .then(function(response) {
      if (response.data.status == "OK") {
        console.log(response.data.data);
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
  
  function loadTags() {
    setTags([]);
    axios.get(config.BACKEND_URL + "/api/tags/list")
    .then(function(response) {
      if (response.data.status == "OK") {
        var tags_temp = [];
        for (var i in response.data.data) {
          var tag = response.data.data[i];
          tags_temp.push({value: tag.id, label: tag.name});
        }
        setTags(tags_temp);
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
          <div className="col-md-8 full-min-height p-5">
            <div className="bg-grey p-5">
              <form onSubmit={submitSearch}>
                  <div class="mb-3">
                  <Select isMulti value={selectedTags} options={tags} onChange={changeSelectedTags} />
                  </div>
                  <div class="d-flex justify-content-end">
                    <button type="submit" class="btn btn-primary">Search</button>
                  </div>
              </form>
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                  </tr>
                </thead>
                <tbody>
                  
                    {results.map((result) => {
                      var link = "/file/" + result['id'];

                      return (
                        <tr key={result['id']}>
                          <td><Link to={link}>{result['title']}</Link></td>
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
        </div>
      </div>
    </>
  )
}