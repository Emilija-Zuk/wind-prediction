import React, { useState, useEffect } from "react";
import "./Analysis.css";
import ErrorChart from "../../components/ErrorChart/ErrorChart";
import BarChart from "../../components/BarChart/BarChart";
import ScatterChart from "../../components/ScatterChart/ScatterChart";
import Button from "../../components/Button/Button";



const fmtBris = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane" }).format(d);

const addDaysStr = (yyyy_mm_dd: string, delta: number) => {
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d + delta);
  return fmtBris(new Date(t));
};

const Analysis: React.FC = () => {
  const analysisUrl =
    "https://fydlfscjee.execute-api.ap-southeast-2.amazonaws.com/test1/analysis";

  // today (Brisbane) as YYYY-MM-DD
  const todayBris = fmtBris(new Date());

  // LINE defaults: end = today, start = 3 days earlier (both Brisbane)
  const [startDateLine, setStartDateLine] = useState(addDaysStr(todayBris, -3));
  const [endDateLine, setEndDateLine] = useState(todayBris);

  // BAR defaults: start fixed to 2025-09-29, end = yesterday (Brisbane)
  const [startDateBar, setStartDateBar] = useState("2025-09-29");
  const [endDateBar, setEndDateBar] = useState(addDaysStr(todayBris, -1));

    // Scatter defaults: start fixed to 2025-09-29, end = yesterday (Brisbane)
  const [startDateScatter, setStartDateScatter] = useState("2025-09-29");
  const [endDateScatter, setEndDateScatter] = useState(addDaysStr(todayBris, -1));

  const [chartData, setChartData] = useState<any>(null);
  const [chartBarData, setBarChartData] = useState<any>(null);
  const [chartScatterData, setScatterChartData] = useState<any>(null);

  const [loadingLine, setLoadingLine] = useState(true);
  const [loadingBar, setLoadingBar] = useState(false);
  const [loadingScatter, setLoadingScatter] = useState(false);

  const [errorLine, setErrorLine] = useState<string | null>(null);
  const [errorBar, setErrorBar] = useState<string | null>(null);
  const [errorScatter, setErrorScatter] = useState<string | null>(null);

  // fetchers 
  const fetchLine = (start: string, end: string) => {
    const url = `${analysisUrl}?type=line&start=${start}&end=${end}`;
    console.log("Fetch LINE URL:", url);
    setLoadingLine(true);
    fetch(url, { headers: { "x-api-key": process.env.REACT_APP_API_KEY1 as string } })
      .then((r) => {
        if (!r.ok) throw new Error(`LINE ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setChartData(data);
        setErrorLine(null);
      })
      .catch((e) => {
        console.error(e);
        setErrorLine("Failed to load analysis data.");
      })
      .finally(() => setLoadingLine(false));
  };

  const fetchBar = (start: string, end: string) => {
    const url = `${analysisUrl}?type=bar&start=${start}&end=${end}`;
    console.log("Fetch BAR URL:", url);
    setLoadingBar(true);
    fetch(url, { headers: { "x-api-key": process.env.REACT_APP_API_KEY1 as string } })
      .then((r) => {
        if (!r.ok) throw new Error(`BAR ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setBarChartData(data);
        setErrorBar(null);
      })
      .catch((e) => {
        console.error(e);
        setErrorBar("Failed to load bar data.");
      })
      .finally(() => setLoadingBar(false));
  };

  const fetchScatter = (start: string, end: string) => {
    const url = `${analysisUrl}?type=line&start=${start}&end=${end}`;
    console.log("Fetch scatter URL:", url);
    setLoadingScatter(true);
    fetch(url, { headers: { "x-api-key": process.env.REACT_APP_API_KEY1 as string } })
      .then((r) => {
        if (!r.ok) throw new Error(`Scatter ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setScatterChartData(data);
        setErrorScatter(null);
      })
      .catch((e) => {
        console.error(e);
        setErrorScatter("Failed to load scatter data.");
      })
      .finally(() => setLoadingScatter(false));
  };



  // initial load
  useEffect(() => {
    fetchLine(startDateLine, endDateLine);
    fetchBar(startDateBar, endDateBar);
    fetchScatter(startDateScatter, endDateScatter);
  
  }, []);

  // line handlers
  const handleLineDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") setStartDateLine(value);
    else setEndDateLine(value);
  };
  const handleLineApply = () => {
    const s = new Date(startDateLine);
    const e = new Date(endDateLine);
    const days = (e.getTime() - s.getTime()) / 86_400_000;
    if (days < 0) return alert("End date must be after start date.");
    if (days > 7) return alert("Please select a maximum of 7 days.");
    fetchLine(startDateLine, endDateLine);
  };

  // bar handlers 
  const handleBarDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") setStartDateBar(value);
    else setEndDateBar(value);
  };
  const handleBarApply = () => {
    const s = new Date(startDateBar);
    const e = new Date(endDateBar);
    const days = (e.getTime() - s.getTime()) / 86_400_000;
    if (days < 0) return alert("End date must be after start date.");
    if (days > 31) return alert("Please select a maximum of 31 days.");
    fetchBar(startDateBar, endDateBar);
  };


// scatter handlers
  const handleScatterDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") setStartDateScatter(value);
    else setEndDateScatter(value);
  };
  const handleScatterApply = () => {
    const s = new Date(startDateScatter);
    const e = new Date(endDateScatter);
    const days = (e.getTime() - s.getTime()) / 86_400_000;
    if (days < 0) return alert("End date must be after start date.");
    if (days > 7) return alert("Please select a maximum of 7 days.");
    fetchScatter(startDateScatter, endDateScatter);
  };
  return (
    <div className="analysis-page">
      <div className="page-content">
        <h1>Analysis Wind Data</h1>
        <p>Comparison of forecast vs actual wind</p>

        {/* LINE */}
        {loadingLine && <p>Loading analysis data...</p>}
        {errorLine && <p className="error">{errorLine}</p>}
        {!loadingLine && !errorLine && chartData?.data && (
          <ErrorChart
            data={chartData.data}
            title="Analysis Wind Data"
            startDate={startDateLine}
            endDate={endDateLine}
            onDateChange={handleLineDateChange}
            onApply={handleLineApply}
          />
        )}

        {/* BAR */}
        <h1>Daily Error (MAE)</h1>
        {loadingBar && <p>Loading bar data...</p>}
        {errorBar && <p className="error">{errorBar}</p>}
        {!loadingBar && !errorBar && chartBarData?.data && (
          <BarChart
            data={chartBarData.data}
            startDate={startDateBar}
            endDate={endDateBar}
            onDateChange={handleBarDateChange}
            onApply={handleBarApply}
          />
        )}

        {/* SCATTER */}
        <h1>Forecast vs Actual (Scatter)</h1>
        {loadingScatter && <p>Loading scatter data...</p>}
{errorScatter && <p className="error">{errorScatter}</p>}
        {!loadingScatter && !errorScatter && chartScatterData?.data && (
          <ScatterChart
            data={chartScatterData.data}           
            startDate={startDateScatter}        
            endDate={endDateScatter}
            onDateChange={handleScatterDateChange}
            onApply={handleScatterApply}         
          />
        )}

          <div className="buttons" style={{ marginTop: '3rem' }}>
          <Button variant="primary" to="/predictions">
            Explore Predictions
          </Button>
          <Button variant="secondary" to="/">
            Home Page
          </Button>
        </div>


      </div>
    </div>
  );
};

export default Analysis;
