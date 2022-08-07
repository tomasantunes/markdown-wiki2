import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import MenuItems from "./MenuItems";

const Menu = () => {
  const menuItemsInitialState = [
    {title: "Home", link: "/"},
    {title: "Add File", link: "/add-file"},
    {title: "Add Category", link: "/add-category"},
    {title: "Add Tag", link: "/add-tag"},
  ];

  const [menuItems, setMenuItems] = useState(menuItemsInitialState);

  function loadCategories() {
    setMenuItems(menuItemsInitialState);
    axios.get(config.BACKEND_URL + '/api/categories/list')
    .then(function (response) {
      console.log(response['data']);
      var categories = response['data']['data'];
      for (var i in categories) {
        var menuItem = categories[i];
        console.log(menuItem);
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
          setMenuItems(
            menuItems => [...menuItems, obj]
          );
        }
      }
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  useEffect(() => {
    loadCategories();
  }, []);
  return (
    <div className="left-sidebar col-md-2 full-min-height">
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
