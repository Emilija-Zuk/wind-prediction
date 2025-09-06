import React, { useState } from "react";
import "./Navigation.css";

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const menuItems = [
    { label: "Predictions", href: "#predictions" },
    { label: "Historical Data", href: "#historical" },
    { label: "About", href: "#about" }
  ];

  return (
    <nav className="navigation">
      {/* Logo */}
      <div className="nav-logo">
        <img src="/images/logo.png" alt="Em" className="logo-img" />
      </div>

      {/* Desktop Menu */}
      <div className="nav-desktop">
        {menuItems.map((item, index) => (
          <a key={index} href={item.href} className="nav-link">
            {item.label}
          </a>
        ))}
      </div>

      {/* Mobile Menu */}
      <div className="nav-mobile">
        <button 
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <div className={`mobile-dropdown ${isMenuOpen ? 'open' : ''}`}>
          {menuItems.map((item, index) => (
            <a 
              key={index} 
              href={item.href} 
              className="mobile-nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
