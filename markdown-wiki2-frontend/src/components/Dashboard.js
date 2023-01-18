import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from '../config.json';

export default function Dashboard() {
  const [list10RandomSentences, setList10RandomSentences] = useState([]);

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

  useEffect(() => {
    load10RandomSentences();
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
    </div>
  )
}
