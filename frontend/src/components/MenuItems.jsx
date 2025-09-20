import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Dropdown from "./Dropdown";

const MenuItems = ({ items, depthLevel }) => {
  const [dropdown, setDropdown] = useState(false);
  const [mouseLeaveEvent, setMouseLeaveEvent] = useState();
  const ref = useRef();

  useEffect(() => {
    const handler = (event) => {
      if (dropdown && ref.current && !ref.current.contains(event.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [dropdown]);

  const onMouseEnter = () => {
    clearTimeout(mouseLeaveEvent);
    window.innerWidth > 960 && setDropdown(true);
  };

  const onMouseLeave = () => {
    setMouseLeaveEvent(
      setTimeout(() => {
        window.innerWidth > 960 && setDropdown(false);
      }, 750)
    );
  };

  const hasSubmenu = Array.isArray(items?.submenu) && items.submenu.length > 0;

  return (
    <li
      className="menu-items"
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {hasSubmenu ? (
        <>
          <Link
            type="button"
            aria-haspopup="menu"
            aria-expanded={dropdown ? "true" : "false"}
            to={items?.link ?? "#"}
          >
            {items?.title ?? "Untitled"}{" "}
            {depthLevel > 0 ? (
              <span onClick={() => setDropdown((prev) => !prev)}>&raquo;</span>
            ) : (
              <span
                onClick={() => setDropdown((prev) => !prev)}
                className="arrow"
              />
            )}
          </Link>

          <Dropdown
            depthLevel={depthLevel}
            submenus={items.submenu}
            dropdown={dropdown}
          />
        </>
      ) : (
        <Link to={items?.link ?? "#"}>{items?.title ?? "Untitled"}</Link>
      )}
    </li>
  );
};

export default MenuItems;
