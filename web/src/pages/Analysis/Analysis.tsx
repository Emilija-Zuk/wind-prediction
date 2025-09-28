import React, { useState, useEffect } from "react";
import "./Analysis.css";
import ErrorChart from "../../components/ErrorChart/ErrorChart";
import localData from "../../assets/data/analysis.json";   // fallback if API fails

const Analysis: React.FC = () => {
  const [chartData, setChartData] = useState<any>(localData);

  const analysisUrl =
    "https://fydlfscjee.execute-api.ap-southeast-2.amazonaws.com/test1/analysis";

  useEffect(() => {
    fetch(analysisUrl, {
      headers: { "x-api-key": process.env.REACT_APP_API_KEY1 as string }
    })
      .then(res => res.json())
      .then(data => {
        console.log("analysis data", data);
        const today = new Date().toISOString().slice(0, 10);
        const key   = `GC${today}.json`;
        if (data[key]) setChartData(data[key]);
      })
      .catch(err => console.error("Failed to load analysis data:", err));
  }, []); // run only once on mount

  return (
    <div className="analysis-page">
      <div className="page-content">
        <h1>Analysis Wind Data</h1>
        <p>Comparison of forecast vs actual wind for today (and yesterday is also in the API output).</p>
        <ErrorChart data={chartData.data} />
      </div>
    </div>
  );
};

export default Analysis;
