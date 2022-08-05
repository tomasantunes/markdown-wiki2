import React, {useState, useEffect} from 'react';
import Menu from "./Menu";
import AddTextFile from './AddTextFile';
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
global.jQuery = $;

export default function Home() {
  useEffect(() => {

  }, []);
  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <AddTextFile />
        </div>
      </div>
    </>
  )
}
