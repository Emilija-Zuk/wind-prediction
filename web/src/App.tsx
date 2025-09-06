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
              <p>
                Predict wind at <b>Gold Coast Seaway.</b> Perfect for kite surfers, surfers
                and sailors.
              </p>
            <Features />
              <div className="intro-text">
              <p>
                Do you live far from your <b>favourite kite spot?</b>
                <br />
                The wind is <b>on!</b> But will it <em>stay</em> for the next few hours?  
                Is it <b>worth the drive??</b>
                <br /><br />
                <strong>Check here first</strong>, then get out on the water. Yeew!
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
