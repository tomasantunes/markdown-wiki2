import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import Dropdown from "./Dropdown";

const MenuItems = ({ items, depthLevel }) => {
  const [dropdown, setDropdown] = useState(false);
  const [mouseLeaveEvent, setMouseLeaveEvent] = useState();

  let ref = useRef();

  useEffect(() => {
    const handler = (event) => {
      if (dropdown && ref.current && !ref.current.contains(event.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      // Cleanup the event listener
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [dropdown]);

  const onMouseEnter = () => {
    clearTimeout(mouseLeaveEvent);
    window.innerWidth > 960 && setDropdown(true);
  };

  const onMouseLeave = () => {
    setMouseLeaveEvent(setTimeout(function() {
      window.innerWidth > 960 && setDropdown(false);
    }, 750));
  };

  return (
    <li
      className="menu-items"
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {items.submenu ? (
        <>
          <Link 
            type="button"
            aria-haspopup="menu" 
            aria-expanded={dropdown ? "true" : "false"} 
            to={items.link}
          >
            {items.title}{" "}
            {depthLevel > 0 ? <span onClick={() => setDropdown((prev) => !prev)}>&raquo;</span> : <span onClick={() => setDropdown((prev) => !prev)} className="arrow" />}  
          </Link>
          
          <Dropdown
            depthLevel={depthLevel}
            submenus={items.submenu}
            dropdown={dropdown}
          />
        </>
      ) : (
        <Link to={items.link}>{items.title}</Link>
      )}
    </li>
  );
};

export default MenuItems;
