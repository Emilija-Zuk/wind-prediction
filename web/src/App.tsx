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
    // Nuclear option for Chrome mobile app
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Force immediate scroll
    window.scrollTo(0, 0);
    
    // Chrome app specific hack
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    
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
