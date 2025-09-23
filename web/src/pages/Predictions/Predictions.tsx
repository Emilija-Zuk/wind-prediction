import React, { useState, useEffect } from "react";
import "./Predictions.css";
import WindChart from "../../components/WindChart/WindChart";
import localData from "../../assets/data/data.json";   // current-wind default

const Predictions: React.FC = () => {
  // current data
  const [chartData, setChartData] = useState<any>(localData);
  const [loading, setLoading] = useState(false);

  // forecast data
  const [forecastData, setForecastData] = useState<any>(localData);

  const currentUrl  = "https://fydlfscjee.execute-api.ap-southeast-2.amazonaws.com/test1/submit";
  const forecastUrl = "https://fydlfscjee.execute-api.ap-southeast-2.amazonaws.com/test1/forecast";

  const refreshCurrent = () => {
    setLoading(true);
    fetch(currentUrl, {
      headers: { "x-api-key": process.env.REACT_APP_API_KEY1 as string }
    })
      .then(res => res.json())
      .then(data => setChartData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // load forecast data once when component mounts
  useEffect(() => {
    fetch(forecastUrl, {
      headers: { "x-api-key": process.env.REACT_APP_API_KEY1 as string }
    })
      .then(res => res.json())
      .then(data => {
        console.log("forecast data", data);
        setForecastData(data);
      })
      .catch(console.error);
  }, []);  // run only once

  return (
    <div className="predictions-page">
      <div className="page-content">
              <button
          className="refresh-button"
          onClick={refreshCurrent}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh Current Wind"}
        </button>
        <h1>Live Wind Report Gold Coast Seaway</h1>


        <WindChart data={chartData.data} />


        <h1>Forecast Wind</h1>
        <WindChart data={forecastData.data} />
        {/* second refresh button removed */}
      </div>
    </div>
  );
};

export default Predictions;
