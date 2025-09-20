import React from 'react';
import Menu from "./Menu";
import Search from './Search';

export default function SearchPage() {
  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <Search />
        </div>
      </div>
    </>
  )
}