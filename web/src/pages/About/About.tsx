import React from "react";
import "./About.css";
// Try using require instead of import
const about1 = require("../../assets/images/about1.jpg");
const about2 = require("../../assets/images/about2.jpg");
const about3 = require("../../assets/images/about3.jpg");
const about6 = require("../../assets/images/about6.jpg");

const About: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-content">
        <h1>About Wind Prediction</h1>
        
        <div className="intro-section">
          <img src={about1} alt="Currumbin Gold Coast kite spot" className="about-image float-right first-image" />
          
          <p>
            <strong>Wind Prediction</strong> gives short-range wind guidance for the <strong>Gold Coast</strong> so kitesurfers and surfers can plan with more confidence. Public forecasts are useful, but they can miss local effects. This tool focuses on the next few hours at beach level.
          </p>
        </div>
        
        <h2>How it works</h2>
        <ul>
          <li>Uses supervised <strong> machine-learning models</strong> trained on historical weather data.</li>
          <li>Blends those models with <strong>live station feeds</strong> (wind speed, gusts, direction, pressure, temperature).</li>
          <li>Looks for upstream signals and short-term patterns to infer what comes next.</li>
        </ul>
        
        <p>
          Example: rising wind in Byron Bay often arrives on the Gold Coast shortly after - the system learns and tracks that relationship.
        </p>

        <div className="clearfix"></div>

        <img src={about2} alt="Kiting" className="about-image float-left" />

        <h2>Update cycle</h2>
        <ul>
          <li><strong>Full model retrain</strong> every few hours - deep learning.</li>
          <li><strong>On-demand quick updates</strong> when a user requests a fresh run on the Predictions page.</li>
        </ul>
        
        <h2>Why it helps</h2>
        <ul>
          <li>Emphasizes <strong>short-range forecasting</strong> (the next 1–3 hours), not just daily forecasts.</li>
          <li>Adjusts quickly to <strong>real observations</strong>, reducing the chance of driving to the spot only to find the wind has dropped.</li>
        </ul>

        <div className="clearfix"></div>
        
        <img src={about3} alt="Kitesurfing community" className="about-image large-center" />
        
        <h2>Scalable design</h2>
        <p>
          The same pipeline can be deployed to additional stations across Queensland and beyond with minimal setup.
        </p>
        
        <img src={about6} alt="Surfing group" className="about-image medium-center" />
      </div>
    </div>
  );
};

export default About;