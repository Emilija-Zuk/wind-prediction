import React, { useState, useEffect } from "react";
import "./Analysis.css";
import ErrorChart from "../../components/ErrorChart/ErrorChart";
import localData from "../../assets/data/analysis.json";   // test data

const Analysis: React.FC = () => {

 // current data
  const [chartData, setChartData] = useState<any>(localData);
  const [loading, setLoading] = useState(false);




  return (
    <div className="analysis-page">
      <div className="page-content">
        <h1>Analysis Wind Data</h1>
        <p>Access historical wind patterns and trends for better forecasting...</p>
        <ErrorChart data={chartData.data} />



      </div>
    </div>
  );
};

export default Analysis;