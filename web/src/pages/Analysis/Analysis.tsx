import React, { useState, useEffect } from "react";
import "./Analysis.css";
import ErrorChart from "../../components/ErrorChart/ErrorChart";

const Analysis: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Defaults: end = today , start = 3 days earlier for brisbane
  const endDefault = new Date().toLocaleDateString("en-CA", {
    timeZone: "Australia/Brisbane",
  });

  const startDefault = new Date(
    //  midnight in Brisbane 
    new Date(`${endDefault}T00:00:00+10:00`).getTime() - 3 * 24 * 60 * 60 * 1000
  ).toLocaleDateString("en-CA", { timeZone: "Australia/Brisbane" });

  const [startDate, setStartDate] = useState(startDefault);
  const [endDate, setEndDate] = useState(endDefault);


  const analysisUrl =
    "https://fydlfscjee.execute-api.ap-southeast-2.amazonaws.com/test1/analysis";

  const fetchData = (start: string, end: string) => {
    const graphType = "line";
    const url = `${analysisUrl}?type=${graphType}&start=${start}&end=${end}`;
    console.log("📡 Fetch URL:", url);

    setLoading(true);
    fetch(url, {
      headers: { "x-api-key": process.env.REACT_APP_API_KEY1 as string },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("analysis data", data);
        setChartData(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load analysis data:", err);
        setError("Failed to load analysis data.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(startDate, endDate);
  }, []);

  const handleDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  const handleApply = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffDays = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      alert("End date must be after start date.");
      return;
    }
    if (diffDays > 7) {
      alert("Please select a maximum of 7 days.");
      return;
    }

    fetchData(startDate, endDate);
  };

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
          <ErrorChart
            data={chartData.data}
            title="Analysis Wind Data"
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
            onApply={handleApply}
          />
        )}
      </div>
    </div>
  );
};

export default Analysis;
