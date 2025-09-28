import React from "react";
import { useNavigate } from "react-router-dom";
import "./Buttons.css";

const Buttons: React.FC = () => {
  const navigate = useNavigate();

  const handlePredictionsClick = () => {
    navigate("/predictions");
  };

  const handleAnalysisClick = () => {
    navigate("/analysis-data");
  };

  return (
    <div className="buttons">
      <button className="btn btn-primary" onClick={handlePredictionsClick}>
        Explore Predictions
      </button>
      <button className="btn btn-secondary" onClick={handleAnalysisClick}>
        View Prediction Analysis
      </button>
    </div>
  );
};

export default Buttons;
