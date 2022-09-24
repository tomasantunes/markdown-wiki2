import React from 'react';
import Menu from './Menu';
import AddTextFile from './AddTextFile';
import AddMediaFile from './AddMediaFile'

export default function AddFile() {
  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <AddTextFile />
          <AddMediaFile />
        </div>
      </div>
    </>
  )
}
