import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import {useNavigate} from 'react-router-dom';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  function changeUser(event) {
    setUser(event.target.value);
  }

  function changePass(event) {
    setPass(event.target.value);
  }

  function requestLogin() {
    axios.post(config.BACKEND_URL + "/api/check-login", {user, pass})
    .then(res => {
      if (res.data.status == "OK") {
        console.log(res.data.data);
        var login_id = res.data.data.login_id;
        if (login_id != -1) {
          Swal.fire({
            title: 'Enter PIN',
            input: 'text',
            showCancelButton: true,
            showConfirmButton: true,
            showCloseButton: true,
          }).then((result) => {
            console.log(result.value);
            console.log(login_id);
            axios.post(config.BACKEND_URL + "/api/check-pin", {login_id: login_id, pin: result.value})
            .then(function(response) {
              if (response.data.status == "OK") {
                navigate("/dashboard");
              }
              else {
                MySwal.fire(response.data.error);
              }
            })
            .catch(function(err) {
              MySwal.fire(err.message);
            });
          });
        }
        else {
          axios.post(config.BACKEND_URL + "/api/check-pin", {login_id: login_id, pin: ""})
          .then(function(response) {
            if (response.data.status == "OK") {
              navigate("/dashboard");
            }
            else {
              MySwal.fire(response.data.error);
            }
          })
          .catch(function(err) {
            MySwal.fire(err.message);
          });
        }
      }
      else {
        MySwal.fire(res.data.error);
      }
    })
    .catch(err => {
      MySwal.fire(err.message);
    });
  }

  const handleKeyDown = e => {
    if (e.keyCode === 13) {
      requestLogin();
    }
  };

  return (
    <div className="login-box">
      <div style={{textAlign: "center"}}>
        <h3>Login</h3>
      </div>
      <div className="form-group">
          <label>Username</label>
          <input type="text" className="form-control" value={user} onChange={changeUser} onKeyDown={handleKeyDown} />
      </div>
      <div className="form-group mb-4">
          <label>Password</label>
          <input type="password" className="form-control" value={pass} onChange={changePass} onKeyDown={handleKeyDown} />
      </div>
      <div style={{textAlign: "right"}}>
          <button className="btn btn-primary" onClick={requestLogin}>Login</button>
      </div>
    </div>
  )
}
