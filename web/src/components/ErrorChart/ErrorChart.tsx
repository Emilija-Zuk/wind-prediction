import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./ErrorChart.css";

interface ErrorChartProps {
  data: Array<{ time: string; actual: number; predicted: number }>;
  title?: string;
  className?: string;
  startDate?: string;
  endDate?: string;
  onDateChange?: (type: "start" | "end", value: string) => void;
  onApply?: () => void;
}

const ErrorChart: React.FC<ErrorChartProps> = ({
  data,
  title,
  className = "",
  startDate,
  endDate,
  onDateChange,
  onApply,
}) => {
  const yAxisRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data?: { actual: number; predicted: number; time: string; error: number };
  }>({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    const checkResize = () => setIsMobile(window.innerWidth <= 768);
    checkResize();
    window.addEventListener("resize", checkResize);
    return () => window.removeEventListener("resize", checkResize);
  }, []);

  useEffect(() => {
    if (!yAxisRef.current || !chartRef.current || !containerRef.current) return;

    // clear old chart
    d3.select(yAxisRef.current).selectAll("*").remove();
    d3.select(chartRef.current).selectAll("*").remove();

    const containerWidth = containerRef.current.offsetWidth;
    const margin = { top: 40, right: 20, bottom: 60, left: 50 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const height = 200;

    // convert data to date objects from ISO time ===
    const chartData = data.map(d => ({
      time: new Date(d.time),
      actual: d.actual,
      predicted: d.predicted
    }));

    if (!chartData.length) return;

    // determine full time span of data
    const [dataStart, dataEnd] = d3.extent(chartData, d => d.time) as [Date, Date];
    const dataSpanMs = dataEnd.getTime() - dataStart.getTime();

    // how many hours should fill the visible width
    const baseHoursVisible = isMobile ? 5 : 12;
    const visibleSpanMs = baseHoursVisible * 3600_000;

    // width so baseHoursVisible fills the viewport, but still fits all data
    const chartWidth =
      Math.max(innerWidth, innerWidth * (dataSpanMs / visibleSpanMs)) *
      (isMobile ? 1 : 0.98);

    const xScale = d3.scaleTime().domain([dataStart, dataEnd]).range([0, chartWidth]);
    const yScale = d3.scaleLinear().domain([0, 30]).range([height, 0]);

    // y-axis
    const yAxis = d3
      .select(yAxisRef.current)
      .attr("width", margin.left)
      .attr("height", height + margin.top + margin.bottom);

    const yGroup = yAxis
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    yGroup.append("g").call(d3.axisLeft(yScale).tickValues([0, 5, 10, 15, 20, 25, 30]));
    yGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Wind Speed (knots)");

    // main chart
    const chart = d3
      .select(chartRef.current)
      .attr("width", chartWidth)
      .attr("height", height + margin.top + margin.bottom);

    const chartGroup = chart.append("g").attr("transform", `translate(0,${margin.top})`);

    // x-axis
    chartGroup
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickFormat(d => d3.timeFormat("%H:%M")(d as Date))
          .ticks(d3.timeHour.every(1))
      );

    // grid lines
    chartGroup
      .append("g")
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(-height)
          .tickFormat(() => "")
          .ticks(d3.timeHour.every(1))
      )
      .attr("transform", `translate(0,${height})`)
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.1);

    chartGroup
      .append("g")
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-chartWidth)
          .tickFormat(() => "")
          .tickValues([0, 5, 10, 15, 20, 25, 30])
      )
      .style("stroke-dasharray", "4,2")
      .style("opacity", 0.1);

    // actual & predicted lines
    const lineActual = d3
      .line<{ time: Date; actual: number }>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.actual));

    const linePredicted = d3
      .line<{ time: Date; predicted: number }>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.predicted));

    chartGroup
      .append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", lineActual as any);

    chartGroup
      .append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "orange")
      .attr("stroke-width", 2)
      .attr("d", linePredicted as any);

    // midnight lines and date labels
    const dayStarts = d3.timeDay.range(dataStart, dataEnd);
    dayStarts.forEach(d => {
      chartGroup.append("line")
        .attr("x1", xScale(d))
        .attr("x2", xScale(d))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "gray")
        .attr("stroke-dasharray", "4,4")
        .style("opacity", 0.4);

      chartGroup.append("text")
        .attr("x", xScale(d) + 4)
        .attr("y", -5)
        .style("font-size", "13px")
        .style("fill", "gray")
        .text(d3.timeFormat("%Y-%m-%d")(d));
    });

    // tooltip
    const getNearestData = (mx: number) => {
      const bisect = d3.bisector((d: any) => d.time).left;
      const x0 = xScale.invert(mx);
      const idx = bisect(chartData, x0, 1);
      const d0 = chartData[idx - 1];
      const d1 = chartData[idx];
      if (!d0) return d1;
      if (!d1) return d0;
      return x0.getTime() - d0.time.getTime() > d1.time.getTime() - x0.getTime()
        ? d1
        : d0;
    };

    const svg = d3.select(chartRef.current);

    function showTooltip(event: any) {
      const [mx] = d3.pointer(event);
      const nearest = getNearestData(mx);
      if (!nearest) return;
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: {
          actual: Math.round(nearest.actual),
          predicted: Math.round(nearest.predicted),
          error: Math.round(nearest.actual - nearest.predicted),
          time: d3.timeFormat("%Y-%m-%d %H:%M")(nearest.time)
        }
      });
    }

    svg
      .on("mousemove", showTooltip)
      .on("mouseleave", () => setTooltip(t => ({ ...t, visible: false })))
      .on("touchstart", showTooltip)
      .on("touchmove", showTooltip)
      .on("touchend", () => setTooltip(t => ({ ...t, visible: false })));

    // scroll to latest
    if (scrollRef.current && chartRef.current) {
      setTimeout(() => {
        const visibleWidth = scrollRef.current!.clientWidth;
        const fullWidth = chartRef.current!.getBBox().width;
        scrollRef.current!.scrollLeft = Math.max(0, fullWidth - visibleWidth);
      }, 100);
    }
  }, [data, isMobile]);

  return (
    <div
      className={`chart-container ${isMobile ? "mobile-chart" : ""} ${className}`}
      ref={containerRef}
    >
     
      <div className="chart-header">
  
   
        {startDate && endDate && onDateChange && onApply && (
          <div className="chart-date-picker">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onDateChange("start", e.target.value)}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => onDateChange("end", e.target.value)}
            />
            <button onClick={onApply}>Apply</button>
          </div>
        )}
      </div>

      <div style={{ display: "flex" }}>
        <svg ref={yAxisRef} style={{ flexShrink: 0 }}></svg>
        <div
          ref={scrollRef}
          style={{ overflowX: "auto", overflowY: "hidden", flexGrow: 1 }}
        >
          <svg ref={chartRef}></svg>
        </div>
      </div>

      {/* Legend */}
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-line" style={{ color: "steelblue" }}>─</span> Actual
        </span>
        <span className="legend-item">
          <span className="legend-line" style={{ color: "orange" }}>─</span> Forecast
        </span>
      </div>

      {tooltip.visible && tooltip.data && (
        <div
          className="wind-tooltip"
          style={{
            position: "fixed",
            top: tooltip.y - 100,
            ...(isMobile
              ? tooltip.x < window.innerWidth / 2
                ? { left: tooltip.x + 20 }
                : { right: window.innerWidth - tooltip.x + 20 }
              : { left: tooltip.x + 20 }),
          }}
        >
          <div>Time: <b>{tooltip.data.time}</b></div>
          <div>Actual: <b>{tooltip.data.actual} kn</b></div>
          <div>Predicted: <b>{tooltip.data.predicted} kn</b></div>
          <div>Error: <b>{tooltip.data.error} kn</b></div>
        </div>
      )}
    </div>
  );
};

export default ErrorChart;
