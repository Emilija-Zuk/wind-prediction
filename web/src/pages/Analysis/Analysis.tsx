import React, { useState, useEffect } from "react";
import "./Analysis.css";
import ErrorChart from "../../components/ErrorChart/ErrorChart";

const Analysis: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const analysisUrl =
    "https://fydlfscjee.execute-api.ap-southeast-2.amazonaws.com/test1/analysis";

  useEffect(() => {
    setLoading(true);
    fetch(analysisUrl, {
      headers: { "x-api-key": process.env.REACT_APP_API_KEY1 as string }
    })
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log("analysis data", data);
        // API returns one combined dataset, just use directly
        setChartData(data);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to load analysis data:", err);
        setError("Failed to load analysis data.");
      })
      .finally(() => setLoading(false));
  }, []); // run only once on mount

  return (
    <div className="analysis-page">
      <div className="page-content">
        <h1>Analysis Wind Data</h1>
        <p>
          Comparison of forecast vs actual wind for today and recent days.
        </p>

        {loading && <p>Loading analysis data...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && chartData && chartData.data && (
          <ErrorChart data={chartData.data} />
        )}
      </div>
    </div>
  );
};

export default Analysis;
