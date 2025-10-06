import React from "react";
import Intro from "../../components/Intro/Intro";
import SubText from "../../components/SubText/SubText";
import Features from "../../components/Features/Features";
import IntroText from "../../components/IntroText/IntroText";
import Buttons from "../../components/Buttons/Buttons";
import About from "../../components/About/About";

import "./Home.css";


const Home: React.FC = () => {
  return (
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
  );
};

export default Home;