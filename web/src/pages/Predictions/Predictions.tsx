import React, { useState } from "react";
import "./Predictions.css";
import WindChart from "../../components/WindChart/WindChart";
import localData from "../../assets/data/data.json";   // current-wind default


const Predictions: React.FC = () => {
  // current data
  const [chartData, setChartData] = useState<any>(localData);
  const [loading, setLoading] = useState(false);

  // forecast data
  const [forecastData, setForecastData] = useState<any>(localData);
  const [forecastLoading, setForecastLoading] = useState(false);

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

  const refreshForecast = () => {
    setForecastLoading(true);
    fetch(forecastUrl, {
      headers: { "x-api-key": process.env.REACT_APP_API_KEY1 as string }
    })
      .then(res => res.json())
          .then(data => {
      console.log('forecast data', data);
      setForecastData(data);
    })
      .catch(console.error)
      .finally(() => setForecastLoading(false));
  };

  return (
    <div className="predictions-page">
      <div className="page-content">
        <h1>Live Wind Report Gold Coast Seaway</h1>

        <WindChart data={chartData.data} />
        <button
          className="refresh-button"
          onClick={refreshCurrent}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh Current Wind"}
        </button>

        <h1>Forecast Wind</h1>

        <WindChart data={forecastData.data} />
        <button
          className="refresh-button"
          onClick={refreshForecast}
          disabled={forecastLoading}
        >
          {forecastLoading ? "Refreshing…" : "Refresh Forecast"}
        </button>
      </div>
    </div>
  );
};

export default Predictions;
