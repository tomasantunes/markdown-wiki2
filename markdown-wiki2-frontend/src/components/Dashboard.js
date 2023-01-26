import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import {Link} from 'react-router-dom';

export default function Dashboard() {
  const [list10RandomSentences, setList10RandomSentences] = useState([]);
  const [listTop10Categories, setListTop10Categories] = useState([]);
  const [listTop10Tags, setListTop10Tags] = useState([]);
  const [list10MostRecent, setList10MostRecent] = useState([]);
  const [list10Largest, setList10Largest] = useState([]);

  function load10RandomSentences() {
    axios
      .get(config.BACKEND_URL + "/api/get-10-random-sentences")
      .then((response) => {
        setList10RandomSentences(response.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function loadTop10Categories() {
    axios
      .get(config.BACKEND_URL + "/api/get-top10-categories")
      .then((response) => {
        setListTop10Categories(response.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function loadTop10Tags() {
    axios
      .get(config.BACKEND_URL + "/api/get-top10-tags")
      .then((response) => {
        console.log(response.data);
        if (response.data.status == "OK") {
          setListTop10Tags(response.data.data);
        }
        else {
          alert(response.data.error);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function load10MostRecent() {
    axios
      .get(config.BACKEND_URL + "/api/get-10-most-recent")
      .then((response) => {
        console.log(response.data);
        if (response.data.status == "OK") {
          setList10MostRecent(response.data.data);
        }
        else {
          alert(response.data.error);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function load10Largest() {
    axios
      .get(config.BACKEND_URL + "/api/get-10-largest")
      .then((response) => {
        console.log(response.data);
        if (response.data.status == "OK") {
          setList10Largest(response.data.data);
        }
        else {
          alert(response.data.error);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  useEffect(() => {
    load10RandomSentences();
    loadTop10Categories();
    loadTop10Tags();
    load10MostRecent();
    load10Largest();
  }, []);
  return (
    <div className="col-md-10 full-min-height p-5">
      <h2>Dashboard</h2>
      <h3>10 Random Sentences</h3>
      <ul className="list-10-random-sentence">
        {list10RandomSentences.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <h3>Top 10 Categories</h3>
      <ol className="list-top10-categories">
        {listTop10Categories.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ol>
      <h3>Top 10 Tags</h3>
      <ol className="list-top10-tags">
        {listTop10Tags.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ol>
      <h3>10 Most Recent Files</h3>
      <ul className="list-10-most-recent">
        {list10MostRecent.map((item, index) => (
          <li key={index}><Link to={"/categories/" + item.category_id + "#" + item.id}>{item.title}</Link></li>
        ))}
      </ul>
      <h3>Top 10 Largest Files</h3>
      <ol className="list-top10-largest-files">
        {list10Largest.map((item, index) => (
          <li key={index}><Link to={"/categories/" + item.category_id + "#" + item.id}>{item.title}</Link></li>
        ))}
      </ol>
    </div>
  )
}
