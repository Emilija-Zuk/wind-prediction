import React from "react";
import "./About.css";
// Try using require instead of import
const about1 = require("../../assets/images/about1.jpg");
const about2 = require("../../assets/images/about2.jpg");
const about3 = require("../../assets/images/about3.jpg");
const about4 = require("../../assets/images/about4.jpg");
const about5 = require("../../assets/images/about5.jpg");
const about6 = require("../../assets/images/about6.jpg");

const About: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-content">
        <h1>About Wind Prediction</h1>
        
        <img src={about1} alt="Currumbin Gold Coast kite spot" className="about-image float-right first-image" />
        
        <p>
          Welcome to my website! This is one of my favourite kite and surf spots in Currumbin, Gold Coast!
        </p>
        
        <p>
          I decided to design wind predictions to help our fellow kiters and myself, of course, predict wind conditions more accurately. 
          It's difficult to trust forecasts sometimes, and it's frustrating to drive half an hour to the spot, set up all your gear, 
          only to have the wind drop! Or go for a surf in the morning when there's no wind, and suddenly it picks up once you got in the surf and waves get messy!
        </p>

        <img src={about2} alt="Kiting setup and wind conditions" className="about-image float-left" />

        <p>
          My app is designed to use machine learning and nearby weather station data to look for patterns and predict what happens 
          within the next few hours. For example, if wind is picking up in Byron Bay, it could pick up on the Gold Coast in half an hour or so.
        </p>
        
        <p>
          I'm planning to set up the machine learning model to train every 3 hours daily with deep learning, plus quick 10-second 
          prediction training whenever someone clicks on the predictions page!
        </p>
        
        <p>
          I believe this could help our friendly kiting community on the Gold Coast.
        </p>

        <img src={about3} alt="Machine learning and weather prediction" className="about-image center-image" />

        <img src={about4} alt="Kite Safari Queensland" className="about-image float-right" />
        
        <p>
          If it works successfully, I could implement it for other stations! Check out my friend kiting at Kite Safari up north in Queensland!
        </p>

        <img src={about5} alt="Surfing holidays with friends" className="about-image float-left" />
        
        <p>
          I also enjoy learning to surf and going on surfing holidays with friends and meeting new friends along the way!
        </p>

        <div className="clearfix"></div>
        
        <img src={about6} alt="Meeting new friends" className="about-image bottom-wide-image" />
      </div>
    </div>
  );
};

export default About;