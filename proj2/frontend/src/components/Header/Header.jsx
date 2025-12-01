import React, { useContext } from "react";
import "./Header.css";
import { ThemeContext } from "../../Context/ThemeContext";

const Header = () => {
  const { theme } = useContext(ThemeContext);

  const handleViewMenu = () => {
    const section = document.getElementById("explore-menu");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={`header ${theme}`}>
      <div className="header-contents">
        <h2>Byte into the future of food</h2>
        <p>
          Elevate your dining experience with ByteBite. Discover handcrafted
          meals from top local chefs, delivered seamlessly. Taste the blend of
          quality, speed, and innovation.
        </p>
        <button className="header-cta" onClick={handleViewMenu}>
          View Menu
        </button>
      </div>
    </div>
  );
};

export default Header;
