import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import Navigation from "./components/Navigation/Navigation";
import Home from "./pages/Home/Home";
import Predictions from "./pages/Predictions/Predictions";
import HistoricalData from "./pages/HistoricalData/HistoricalData";
import About from "./pages/About/About";

// Component to scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Multiple scroll methods for Chrome mobile compatibility
    const scrollToTopImmediately = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Force Chrome mobile to scroll
      if (window.pageYOffset !== 0) {
        document.body.style.transform = 'translateY(0)';
        void document.body.offsetHeight; // Force reflow - fixed the error
        document.body.style.transform = '';
      }
    };

    // Execute immediately
    scrollToTopImmediately();
    
    // Chrome mobile backup - execute after a short delay
    setTimeout(scrollToTopImmediately, 50);
    
    // Final backup for stubborn Chrome mobile
    setTimeout(scrollToTopImmediately, 150);
    
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-container">
        <div className="main-container">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/historical-data" element={<HistoricalData />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
