import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import MenuItems from "./MenuItems";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([
    {title: "Home", link: "/"},
    {title: "Add File", link: "/add-file"},
    {title: "Add Category", link: "/add-category"},
    {title: "Add Tag", link: "/add-tag"},
  ]);

  function loadCategories() {
    axios.get(config.BACKEND_URL + '/api/categories/list')
    .then(function (response) {
      console.log(response['data']);
      for (var i in response['data']) {
        var menuItem = response['data'][i];
        if (menuItem.parent_id == 1) {
          var obj = {title: menuItem.name, id: menuItem.id, submenu: []};
          for (var j in response['data']) {
            var menuItem2 = response['data'][j];
            if (menuItem2.parent_id == obj.id) {
              var obj2 = {title: menuItem2.name, id: menuItem2.id, submenu: []};
              obj.submenu.push(obj2);
              for (var k in response['data']) {
                var menuItem3 = response['data'][k];
                if (menuItem3.parent_id == obj2.id) {
                  var obj3 = {title: menuItem3.name, id: menuItem3.id};
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
