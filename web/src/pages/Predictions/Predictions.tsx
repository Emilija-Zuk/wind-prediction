import React, { useState } from "react";
import "./Predictions.css";
import WindChart from "../../components/WindChart/WindChart";
import localData from "../../assets/data/data.json";   // default data

const Predictions: React.FC = () => {
  const [chartData, setChartData] = useState<any>(localData); // start with local data
  const [loading, setLoading] = useState(false);

  const apiUrl = "https://fydlfscjee.execute-api.ap-southeast-2.amazonaws.com/test1/submit";

  const refreshData = () => {
    setLoading(true);
    fetch(apiUrl, {
      headers: {
        "x-api-key": process.env.REACT_APP_API_KEY1 as string
      }
    })
      .then(res => res.json())
      .then(data => setChartData(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <div className="predictions-page">
      <div className="page-content">
        <h1>Live Wind Report Gold Coast Seaway</h1>

        <WindChart data={chartData.data} />

        <button className="refresh-button" onClick={refreshData} disabled={loading} >
          {loading ? "Refreshing…" : "Refresh Data"}
        </button>
      </div>
    </div>
  );
};

export default Predictions;
