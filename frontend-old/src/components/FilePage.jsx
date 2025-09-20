import React from 'react';
import File from './File';
import Menu from './Menu';
import { useParams } from 'react-router-dom';
import AddCategoryModal from './AddCategoryModal';
import AddTagModal from './AddTagModal';

export default function FilePage() {
  const { id } = useParams();

  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <div className="col-md-8 p-5">
            <File id={id}/>
          </div>
        </div>
      </div>
      <AddCategoryModal />
      <AddTagModal />
    </>
  )
}
