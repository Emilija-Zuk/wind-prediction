import React from "react";
import "./App.css";

import Navigation from "./components/Navigation/Navigation";
import Intro from "./components/Intro/Intro";
import SubText from "./components/SubText/SubText";
import Features from "./components/Features/Features";
import IntroText from "./components/IntroText/IntroText";
import Buttons from "./components/Buttons/Buttons";
import About from "./components/About/About";

const App: React.FC = () => {
  return (
    <div className="app-container">
      <div className="main-container">
        <Navigation />
        <div className="main-section">
          <Intro />
          <div className="background-section">
            <SubText />
            <Features />
            <IntroText />
            <Buttons />
          </div>
          <About />
        </div>
      </div>
    </div>
  );
};

export default App;
