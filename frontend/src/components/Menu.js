import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import MenuItems from "./MenuItems";
import $ from 'jquery';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {useNavigate} from 'react-router-dom';

const MySwal = withReactContent(Swal);
window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
const bootstrap5DropdownMlHack = require('../bootstrap5-dropdown-ml-hack');

const Menu = () => {
  const menuItemsInitialState = [
    {title: "Home", link: "/"},
    {title: "Search", link: "/search"},
    {title: "Add File", link: "/add-file"},
    {title: "Add Category", link: "/add-category"},
    {title: "Add Tag", link: "/add-tag"},
    {title: "Bookmarks", link: "/bookmarks"},
    {title: "Pinned", link: "/pinned"},
  ];

  const [menuItems, setMenuItems] = useState(menuItemsInitialState);
  const navigate = useNavigate();

  function getChildren(parent_id, categories) {
    var children = [];
    for (var i in categories) {
      var category = categories[i];
      if (category.parent_id == parent_id) {
        children.push(category);
      }
    }
    return children;
  }

  function getChildrenCount(parent_id, categories) {
    var count = 0;
    for (var i in categories) {
      var category = categories[i];
      if (category.parent_id == parent_id) {
        count++;
      }
    }
    return count;
  }

  function addCategory(category, categories) {
    var obj = {title: category.name, link: "/categories/" + category.id, id: category.id};
    if (getChildrenCount(category.id, categories) > 0) {
      obj['submenu'] = [];
      var children = getChildren(category.id, categories);
      for (var i in children) {
        obj['submenu'].push(addCategory(children[i], categories));
      }
    }
    return obj;
  }

  function loadCategories() {
    setMenuItems(menuItemsInitialState);
    axios.get(config.BACKEND_URL + '/api/categories/list')
    .then(function (response) {
      var categories = response['data']['data'];
      var categories_to_add = [];
      for (var i in categories) {
        var category = categories[i];
        if (category.parent_id == 1) {
          categories_to_add.push(addCategory(category, categories));
        }
      }
      setMenuItems(
        menuItems => [...menuItems, ...categories_to_add]
      );
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  function logout() {
    axios.post(config.BACKEND_URL + '/api/logout')
    .then(function(response) {
      if (response.data.status == "OK") {
        console.log("You have logged out successfully.");
        navigate("/login");
      }
      else {
        MySwal.fire(response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire(err.message);
    });
  }

  useEffect(() => {
    loadCategories();
  }, []);
  return (
    <div className="left-sidebar col-md-2 full-min-height">
      <h2 className="brand">{config['SITENAME']}</h2>
      <div className="menu-buttons">
        <div className="logout-btn" onClick={logout}>
          <i class="fa-solid fa-right-from-bracket fa-lg"></i>
        </div>
      </div>
      <ul className="menus">
        {menuItems.map((menu, index) => {
          const depthLevel = 0;
          return <MenuItems items={menu} key={index} depthLevel={depthLevel} />;
        })}
      </ul>
    </div>
  );
};

export default Menu;
