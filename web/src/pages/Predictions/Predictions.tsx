import React from "react";
import "./Predictions.css";
import currentData from "../../assets/data/current.json";
import WindChart from "../../components/WindChart/WindChart";

const Predictions: React.FC = () => {
  return (
    <div className="predictions-page">
      <div className="page-content">
        <h1>Current Wind</h1>
        <p className="chart-subtitle">Date: {currentData.metadata.date}</p>
        
        <WindChart data={currentData.data} />
      </div>
    </div>
  );
};

export default Predictions;