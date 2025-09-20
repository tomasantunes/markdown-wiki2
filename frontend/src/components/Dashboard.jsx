import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config.json';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function Dashboard() {
  const [list10RandomSentences, setList10RandomSentences] = useState([]);
  const [listTop10Categories, setListTop10Categories] = useState([]);
  const [listTop10Tags, setListTop10Tags] = useState([]);
  const [list10MostRecent, setList10MostRecent] = useState([]);
  const [list10Largest, setList10Largest] = useState([]);
  const [listFilesWithoutTags, setListFilesWithoutTags] = useState([]);

  useEffect(() => {
    axios.get(config.BACKEND_URL + "/api/get-10-random-sentences")
      .then(res => setList10RandomSentences(res.data.data ?? []))
      .catch(console.error);

    axios.get(config.BACKEND_URL + "/api/get-top10-categories")
      .then(res => setListTop10Categories(res.data.data ?? []))
      .catch(console.error);

    axios.get(config.BACKEND_URL + "/api/get-top10-tags")
      .then(res => res.data.status === "OK" ? setListTop10Tags(res.data.data ?? []) : MySwal.fire(res.data.error))
      .catch(console.error);

    axios.get(config.BACKEND_URL + "/api/get-10-most-recent")
      .then(res => res.data.status === "OK" ? setList10MostRecent(res.data.data ?? []) : MySwal.fire(res.data.error))
      .catch(console.error);

    axios.get(config.BACKEND_URL + "/api/get-10-largest")
      .then(res => res.data.status === "OK" ? setList10Largest(res.data.data ?? []) : MySwal.fire(res.data.error))
      .catch(console.error);

    axios.get(config.BACKEND_URL + "/api/files/get-files-without-tags")
      .then(res => res.data.status === "OK" ? setListFilesWithoutTags(res.data.data ?? []) : MySwal.fire(res.data.error))
      .catch(console.error);
  }, []);

  return (
    <div className="col-md-10 full-min-height p-5">
      <h2>Dashboard</h2>

      <div className="row">
        {list10RandomSentences.length > 0 && (
          <div className="col-md-6">
            <div className="bg-grey p-3 mb-3 rounded">
              <h3>10 Random Sentences</h3>
              <ul>
                {list10RandomSentences.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          </div>
        )}

        {listTop10Categories.length > 0 && (
          <div className="col-md-6">
            <div className="bg-grey p-3 mb-3 rounded">
              <h3>Top 10 Categories</h3>
              <ol>
                {listTop10Categories.map((item, idx) => <li key={idx}>{item.name}</li>)}
              </ol>
            </div>
          </div>
        )}
      </div>

      <div className="row">
        {listTop10Tags.length > 0 && (
          <div className="col-md-6">
            <div className="bg-grey p-3 mb-3 rounded">
              <h3>Top 10 Tags</h3>
              <ol>
                {listTop10Tags.map((item, idx) => <li key={idx}>{item.name}</li>)}
              </ol>
            </div>
          </div>
        )}

        {list10MostRecent.length > 0 && (
          <div className="col-md-6">
            <div className="bg-grey p-3 mb-3 rounded">
              <h3>10 Most Recent Files</h3>
              <ul>
                {list10MostRecent.map((item, idx) => (
                  <li key={idx}><Link to={`/file/${item.id}`}>{item.title}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="row">
        {list10Largest.length > 0 && (
          <div className="col-md-6">
            <div className="bg-grey p-3 mb-3 rounded">
              <h3>Top 10 Largest Files</h3>
              <ol>
                {list10Largest.map((item, idx) => (
                  <li key={idx}><Link to={`/file/${item.id}`}>{item.title}</Link></li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>

      <div className="row">
        {listFilesWithoutTags.length > 0 && (
          <div className="col-md-6">
            <div className="bg-grey p-3 mb-3 rounded">
              <h3>Files Without Tags</h3>
              <ol>
                {listFilesWithoutTags.map((item, idx) => (
                  <li key={idx}><Link to={`/file/${item.id}`}>{item.title}</Link></li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
