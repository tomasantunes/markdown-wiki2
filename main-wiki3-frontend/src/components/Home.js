import React, {useState, useEffect} from 'react';
import Navbar from "./Navbar";
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
global.jQuery = $;

export default function Home() {
  useEffect(() => {

  }, []);
  return (
    <header>
      <div className="nav-area">
        <a href="/#" className="logo">
          Logo
        </a>
        <Navbar />
      </div>
    </header>
  )
}
