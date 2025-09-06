import React from "react";
import "./Buttons.css";

const Buttons: React.FC = () => (
  <div className="buttons">
    <button className="btn btn-primary">Explore Predictions</button>
    <button className="btn btn-secondary">View Historical Data</button>
  </div>
);

export default Buttons;
