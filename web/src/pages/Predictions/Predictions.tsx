import React, { useState, useEffect } from "react";
import "./Predictions.css";
import WindChart from "../../components/WindChart/WindChart";
import Button from "../../components/Button/Button";
import localData from "../../assets/data/data.json";

const Predictions: React.FC = () => {
  // current data
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // forecast data
  const [forecastData, setForecastData] = useState<any | null>(null);

  const currentUrl  = "https://fydlfscjee.execute-api.ap-southeast-2.amazonaws.com/test1/submit";
  const forecastUrl = "https://fydlfscjee.execute-api.ap-southeast-2.amazonaws.com/test1/forecast";

  const refreshCurrent = () => {
    setLoading(true);
    fetch(currentUrl, {
      headers: { "x-api-key": process.env.REACT_APP_API_KEY1 as string }
    })
      .then(res => res.json())
    
      .then(data => {
        console.log("current wind data", data);
        setChartData(data);
      })
      
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // load data once when component mounts
  useEffect(() => {
    // current wind data
    refreshCurrent();
    
    // forecast data
    fetch(forecastUrl, {
      headers: { "x-api-key": process.env.REACT_APP_API_KEY1 as string }
    })
      .then(res => res.json())
      .then(data => {
        // console.log("forecast data", data);
        setForecastData(data);
      })
      .catch(console.error);
  }, []);  // run only once

  return (
    <div className="predictions-page">
      <div className="page-content">
        <h1 className="main-title">Gold Coast Seaway</h1>
        <p className="location-subtitle">Live Wind Data & Forecasts</p>
        
        <h2>Current Wind</h2>
        {chartData
          ? <WindChart data={chartData.data} />
          : <p>Loading current wind data…</p>}
        
        <div className="chart-controls">
          {/* <button
            className="refresh-button"
            onClick={refreshCurrent}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button> */}
          <p className="chart-hint">Click on the graph for detailed info</p>
        </div>

        <h2>Wind Forecast</h2>
        {forecastData
          ? (
            <>
              <WindChart data={forecastData.data} />
              <p className="chart-hint" style={{ marginTop: '0.3rem' }}>Click on the graph for detailed info</p>
            </>
          )
          : <p>Loading forecast…</p>}

        <div className="buttons" style={{ marginTop: '2.5rem' }}>
          <Button variant="primary" to="/analysis-data">
            View Prediction Analysis
          </Button>
          <Button variant="secondary" to="/">
            Home Page
          </Button>
        </div>
              
      </div>
    </div>
  );
};

export default Predictions;
