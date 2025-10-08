import React from "react";
import Button from "../Button/Button";
import "./Buttons.css";

const Buttons: React.FC = () => {
  return (
    <div className="buttons">
      <Button variant="primary" to="/predictions">
        Explore Predictions
      </Button>
      <Button variant="secondary" to="/analysis-data">
        View Prediction Analysis
      </Button>
    </div>
  );
};

export default Buttons;
