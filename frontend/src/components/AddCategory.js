import React from 'react';
import Menu from './Menu';
import AddCategoryForm from './AddCategoryForm';

export default function AddCategory() {
  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <AddCategoryForm />
        </div>
      </div>
    </>
  )
}
