import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import Navigation from "./components/Navigation/Navigation";
import Home from "./pages/Home/Home";
import Predictions from "./pages/Predictions/Predictions";
import HistoricalData from "./pages/HistoricalData/HistoricalData";
import About from "./pages/About/About";

const App: React.FC = () => {
  return (
    <Router>
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
