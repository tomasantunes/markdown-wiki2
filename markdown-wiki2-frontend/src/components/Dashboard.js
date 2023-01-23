import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from '../config.json';

export default function Dashboard() {
  const [list10RandomSentences, setList10RandomSentences] = useState([]);
  const [listTop10Categories, setListTop10Categories] = useState([]);
  const [listTop10Tags, setListTop10Tags] = useState([]);

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
        setListTop10Tags(response.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  useEffect(() => {
    load10RandomSentences();
    loadTop10Categories();
    loadTop10Tags();
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
    </div>
  )
}
