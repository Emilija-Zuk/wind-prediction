import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navigation.css";

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    // Only add listener when menu is open
    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // cleanup listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className="navigation" ref={navRef}>
      <div className="nav-logo">
        <Link to="/">
          <img src="/images/logo.png?v=2" alt="Em's Apps Logo" className="logo-img" />
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="nav-desktop">
        <Link to="/predictions" className="nav-link">
          Predictions
        </Link>
        <Link to="/analysis-data" className="nav-link">
          Analysis
        </Link>
        <Link to="/about" className="nav-link">
          About
        </Link>
      </div>

      {/* Mobile Navigation */}
      <div className="nav-mobile">
        <button
          className={`hamburger ${isMobileMenuOpen ? "active" : ""}`}
          onClick={toggleMobileMenu}
        >
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </button>

        <div className={`mobile-dropdown ${isMobileMenuOpen ? "open" : ""}`}>
          <Link
            to="/predictions"
            className="mobile-nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Predictions
          </Link>
          <Link
            to="/analysis-data"
            className="mobile-nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Analysis
          </Link>
          <Link
            to="/about"
            className="mobile-nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
