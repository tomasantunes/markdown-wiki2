import React, {useState, useEffect} from 'react';
import Menu from "./Menu";
import Search from './Search';
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
          <Search />
        </div>
      </div>
    </>
  )
}
