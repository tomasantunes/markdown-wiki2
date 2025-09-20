import React from 'react';
import Menu from "./Menu";
import Dashboard from './Dashboard';

export default function Home() {
  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <Dashboard />
        </div>
      </div>
    </>
  )
}
