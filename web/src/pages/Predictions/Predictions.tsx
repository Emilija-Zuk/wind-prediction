import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./Predictions.css";
import currentData from "../../assets/data/current.json";

const Predictions: React.FC = () => {
  const yAxisRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkResize = () => setIsMobile(window.innerWidth <= 900);
    checkResize();
    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, []);

  useEffect(() => {
    if (!yAxisRef.current || !chartRef.current || !containerRef.current) return;

    d3.select(yAxisRef.current).selectAll("*").remove();
    d3.select(chartRef.current).selectAll("*").remove();

    const containerWidth = containerRef.current.offsetWidth;
    const margin = { top: 40, right: 20, bottom: 60, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const height = 200;

    const parseTime = d3.timeParse("%H:%M");
    const data = currentData.data.map(d => ({
      time: parseTime(d.x)!,
      windSpeed: d.y
    }));

    const recentData = data.slice(-72);
    const chartWidth = isMobile ? width * 2.5 : width;

    const xScale = d3.scaleTime()
      .domain(d3.extent(recentData, d => d.time) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 30])
      .range([height, 0]);

    // Y-axis setup
    const yAxis = d3.select(yAxisRef.current)
      .attr("width", margin.left)
      .attr("height", height + margin.top + margin.bottom);

    const yGroup = yAxis.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    yGroup.append("g")
      .call(d3.axisLeft(yScale).tickValues([0, 5, 10, 15, 20, 25, 30]));

    yGroup.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Wind Speed (knots)");

    // Main chart setup
    const chart = d3.select(chartRef.current)
      .attr("width", chartWidth)
      .attr("height", height + margin.top + margin.bottom);

    const chartGroup = chart.append("g")
      .attr("transform", `translate(0,${margin.top})`);

    const line = d3.line<{ time: Date; windSpeed: number }>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.windSpeed))
      .curve(d3.curveMonotoneX);

    // X-axis
    chartGroup.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d => d3.timeFormat("%H:%M")(d as Date))
        .ticks(d3.timeHour.every(1)));

    // chartGroup.append("text")
    //   .attr("x", chartWidth / 2)
    //   .attr("y", height + 45)
    //   .style("text-anchor", "middle")
    //   .style("font-size", "14px")
    //   .text("Time");

    // Grid lines
    chartGroup.append("g")
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat(() => "")
        .ticks(d3.timeHour.every(1)))
      .attr("transform", `translate(0,${height})`)
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3);

    chartGroup.append("g")
      .call(d3.axisLeft(yScale)
        .tickSize(-chartWidth)
        .tickFormat(() => "")
        .tickValues([0, 5, 10, 15, 20, 25, 30]))
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3);

    // Draw line and dots
    chartGroup.append("path")
      .datum(recentData)
      .attr("fill", "none")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 3)
      .attr("d", line);

    chartGroup.selectAll(".dot")
      .data(recentData.filter((_, i) => i % 6 === 0))
      .enter().append("circle")
      .attr("cx", d => xScale(d.time))
      .attr("cy", d => yScale(d.windSpeed))
      .attr("r", 4)
      .attr("fill", "#2563eb");

    // Auto-scroll on mobile
    if (isMobile && scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = chartWidth - width;
        }
      }, 100);
    }

  }, [isMobile]);

  return (
    <div className="predictions-page">
      <div className="page-content">
        <h1>Current Wind</h1>
        <p className="chart-subtitle">Date: {currentData.metadata.date}</p>

        <div className={`chart-container ${isMobile ? 'mobile-chart' : ''}`} ref={containerRef}>
          <div style={{ display: 'flex' }}>
            <svg ref={yAxisRef} style={{ flexShrink: 0 }}></svg>
            <div 
              ref={scrollRef}
              style={{ 
                overflowX: isMobile ? 'auto' : 'hidden',
                overflowY: 'hidden',
                flexGrow: 1
              }}
            >
              <svg ref={chartRef}></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predictions;