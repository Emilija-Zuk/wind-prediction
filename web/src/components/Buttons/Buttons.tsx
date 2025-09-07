import React from "react";
import { useNavigate } from "react-router-dom";
import "./Buttons.css";

const Buttons: React.FC = () => {
  const navigate = useNavigate();

  const handlePredictionsClick = () => {
    navigate("/predictions");
  };

  const handleHistoricalClick = () => {
    navigate("/historical-data");
  };

  return (
    <div className="buttons">
      <button className="btn btn-primary" onClick={handlePredictionsClick}>
        Explore Predictions
      </button>
      <button className="btn btn-secondary" onClick={handleHistoricalClick}>
        View Historical Data
      </button>
    </div>
  );
};

export default Buttons;
