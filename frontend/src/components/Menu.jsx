import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../config.json";
import MenuItems from "./MenuItems";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate } from "react-router-dom";

const MySwal = withReactContent(Swal);

const Menu = () => {
  const menuItemsInitialState = [
    { title: "Home", link: "/" },
    { title: "Search", link: "/search" },
    { title: "Search Tags", link: "/search-tags" },
    { title: "Add File", link: "/add-file" },
    { title: "Add Category", link: "/add-category" },
    { title: "Add Tag", link: "/add-tag" },
    { title: "Bookmarks", link: "/bookmarks" },
    { title: "Pinned", link: "/pinned" },
  ];

  const [menuItems, setMenuItems] = useState(menuItemsInitialState);
  const navigate = useNavigate();

  function getChildren(parent_id, categories) {
    return categories.filter((c) => c?.parent_id === parent_id);
  }

  function getChildrenCount(parent_id, categories) {
    return categories.filter((c) => c?.parent_id === parent_id).length;
  }

  function addCategory(category, categories) {
    const obj = {
      title: category?.name ?? "Untitled",
      link: "/categories/" + (category?.id ?? ""),
      id: category?.id ?? "",
    };

    if (getChildrenCount(category?.id, categories) > 0) {
      obj.submenu = [];
      const children = getChildren(category?.id, categories);
      for (const child of children) {
        obj.submenu.push(addCategory(child, categories));
      }
    }
    return obj;
  }

  function loadCategories() {
    axios
      .get(config.BACKEND_URL + "/api/categories/list")
      .then((response) => {
        console.log("Categories API raw response:", response.data);

        const categories = response?.data?.data ?? [];
        if (!Array.isArray(categories)) {
          console.error("Expected array but got:", categories);
          return;
        }

        const categories_to_add = [];
        for (const category of categories) {
          if (!category) {
            console.warn("Skipping null/undefined category:", category);
            continue;
          }
          if (category.parent_id === 1) {
            categories_to_add.push(addCategory(category, categories));
          }
        }

        console.log("Final categories_to_add:", categories_to_add);

        setMenuItems((menuItems) => [...menuItemsInitialState, ...categories_to_add]);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function logout() {
    axios
      .post(config.BACKEND_URL + "/api/logout")
      .then((response) => {
        if (response?.data?.status === "OK") {
          console.log("You have logged out successfully.");
          navigate("/login");
        } else {
          MySwal.fire(response?.data?.error ?? "Logout failed");
        }
      })
      .catch((err) => {
        MySwal.fire(err.message);
      });
  }

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="left-sidebar col-md-2 full-min-height">
      <h2 className="brand">{config.SITENAME}</h2>
      <div className="menu-buttons">
        <div className="logout-btn" onClick={logout}>
          <i className="fa-solid fa-right-from-bracket fa-lg"></i>
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
