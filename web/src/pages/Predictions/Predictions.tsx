import React, { useEffect, useState } from "react";
import "./Predictions.css";
import WindChart from "../../components/WindChart/WindChart";

const Predictions: React.FC = () => {
  const [apiData, setApiData] = useState<any>(null);

  const apiUrl = "https://fydlfscjee.execute-api.ap-southeast-2.amazonaws.com/test1/submit";

  useEffect(() => {
    fetch(apiUrl, {
      headers: {
        "x-api-key": process.env.REACT_APP_API_KEY1 as string
      }
    })
      .then(res => res.json())
      .then(data => setApiData(data))
      .catch(err => console.error(err));
  }, []);

  
  const chartData = apiData;

  return (
    <div className="predictions-page">
      <div className="page-content">
        <h1>Live Wind Report Gold Coast Seaway</h1>

        {/* only show chart when data is ready */}
        {apiData ? (
          <WindChart data={apiData.data} />
        ) : (
          <p>Loading wind data…</p>
        )}
      </div>
    </div>
  );
};

export default Predictions;
