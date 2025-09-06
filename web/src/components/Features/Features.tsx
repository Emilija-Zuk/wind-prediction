import React from "react";
import "./Features.css";

const features = [
  { title: "AI-Powered Accuracy", text: "Machine learning models trained on real meteorological datasets" },
  { title: "Real-time Wind Data", text: "Live wind speed and direction monitoring with instant updates" },
  // { title: "Accurate Forecasts", text: "Precise wind predictions for a desired location" },
  // { title: "Modern Interface", text: "Clean, responsive design built with modern React architecture" },
];

const Features: React.FC = () => (
  <div className="features-grid">
    {features.map((f, i) => (
      <div className="features-item" key={i}>
        <h3>{f.title}</h3>
        <p>{f.text}</p>
      </div>
    ))}
  </div>
);

export default Features;
