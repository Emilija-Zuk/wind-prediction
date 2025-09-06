import React from "react";
import "./App.css";

import Logo from "./components/Logo/Logo";
import Intro from "./components/Intro/Intro";
import Features from "./components/Features/Features";
import Buttons from "./components/Buttons/Buttons";
import About from "./components/About/About";

const App: React.FC = () => {
  return (
    <div className="app-container">
      <div className="main-container">
        <Logo />
        <div className="main-section">
          <Intro />
          <div className="background-section">

            <Features />
                        <div className="intro-text">
              <p>
                Do you live far from your favourite kite spot?
                <br />
                The wind is ON! But will it stick around for the next few hours?  
                Is it worth the drive??
                <br /><br />
                Check here first, then get out on the water. Yeew!
              </p>
            </div>
            <Buttons />
          </div>
          <About />
        </div>
      </div>
    </div>
  );
};

export default App;
