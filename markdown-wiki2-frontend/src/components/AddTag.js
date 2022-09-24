import React from 'react';
import Menu from './Menu';
import AddTagForm from './AddTagForm';

export default function AddTag() {
  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <AddTagForm />
        </div>
      </div>
    </>
  )
}
