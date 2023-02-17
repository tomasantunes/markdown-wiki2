import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import MenuItems from "./MenuItems";

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

  /*
  function loadCategoriesOld() {
    setMenuItems(menuItemsInitialState);
    axios.get(config.BACKEND_URL + '/api/categories/list')
    .then(function (response) {
      var categories = response['data']['data'];
      var categories_to_add = [];
      for (var i in categories) {
        var menuItem = categories[i];
        if (menuItem.parent_id == 1) {
          var obj = {title: menuItem.name, link: "/categories/" + menuItem.id, id: menuItem.id};
          for (var j in categories) {
            var menuItem2 = categories[j];
            if (menuItem2.parent_id == obj.id) {
              var obj2 = {title: menuItem2.name, link: "/categories/" + menuItem2.id, id: menuItem2.id};
              if (!obj.hasOwnProperty('submenu')) {
                obj['submenu'] = [];
              }
              obj.submenu.push(obj2);
              for (var k in categories) {
                var menuItem3 = categories[k];
                if (menuItem3.parent_id == obj2.id) {
                  var obj3 = {title: menuItem3.name, link: "/categories/" + menuItem3.id, id: menuItem3.id};
                  if (!obj2.hasOwnProperty('submenu')) {
                    obj2['submenu'] = [];
                  }
                  obj2.submenu.push(obj3);
                }
              }
            }
          }
          categories_to_add.push(obj);
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
  */

  useEffect(() => {
    loadCategories();
  }, []);
  return (
    <div className="left-sidebar col-md-2 full-min-height">
      <ul className="menus">
        <h2 className="brand">{config['SITENAME']}</h2>
        {menuItems.map((menu, index) => {
          const depthLevel = 0;
          return <MenuItems items={menu} key={index} depthLevel={depthLevel} />;
        })}
      </ul>
    </div>
  );
};

export default Menu;
