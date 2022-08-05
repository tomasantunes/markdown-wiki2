import { menuItems } from "../menuItems";
import MenuItems from "./MenuItems";

const Menu = () => {
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
