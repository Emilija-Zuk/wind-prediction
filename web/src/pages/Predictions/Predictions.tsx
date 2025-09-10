import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./Predictions.css";
import currentData from "../../assets/data/current.json";

const Predictions: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Get container width
    const containerWidth = containerRef.current.offsetWidth;
    
    // Chart dimensions
    const margin = { top: 40, right: 40, bottom: 60, left: 70 };
    const width = containerWidth - margin.left - margin.right - 64;
    const height = 300 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse time and prepare data
    const parseTime = d3.timeParse("%H:%M");
    const allData = currentData.data.map(d => ({
      time: parseTime(d.x)!,
      windSpeed: d.y,
      timeString: d.x
    }));

    // Get last 12 hours of data
    const last12HoursData = allData.slice(-72);

    // Set scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(last12HoursData, d => d.time) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 30])
      .range([height, 0]);

    // Create line
    const line = d3.line<{ time: Date; windSpeed: number; timeString: string }>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.windSpeed))
      .curve(d3.curveMonotoneX);

    // X axis with hourly labels
    const formatTime = d3.timeFormat("%H:%M");
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat((d) => formatTime(d as Date))
        .ticks(d3.timeHour.every(1))
        .tickSize(6));

    // Small ticks every 10 minutes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(() => "")
        .ticks(d3.timeMinute.every(10))
        .tickSize(3))
      .selectAll("text").remove();

    // Y axis every 5 knots
    g.append("g")
      .call(d3.axisLeft(yScale)
        .ticks(6)
        .tickValues([0, 5, 10, 15, 20, 25, 30]));

    // Axis labels
    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Time (Last 12 Hours)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 20)
      .attr("x", 0 - (height / 2))
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Wind Speed (knots)");

    // Draw the line
    g.append("path")
      .datum(last12HoursData)
      .attr("fill", "none")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Add dots
    g.selectAll(".dot")
      .data(last12HoursData.filter((_, i) => i % 6 === 0))
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.time))
      .attr("cy", d => yScale(d.windSpeed))
      .attr("r", 4)
      .attr("fill", "#2563eb");

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat(() => "")
        .ticks(d3.timeHour.every(1))
      )
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3);

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(() => "")
        .tickValues([0, 5, 10, 15, 20, 25, 30])
      )
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3);

  }, []);

  return (
    <div className="predictions-page">
      <div className="page-content">
        <h1>Current Wind</h1>
        <p className="chart-subtitle">
          Date: {currentData.metadata.date} 
        </p>
        <div className="chart-container" ref={containerRef}>
          <svg ref={svgRef}></svg>
        </div>
      </div>
    </div>
  );
};

export default Predictions;