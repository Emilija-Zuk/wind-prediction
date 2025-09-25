import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./WindChart.css";

interface WindChartProps {
  data: Array<{ x: string; wind_knots: number; direction_degrees: number; direction_text: string; wind_gust_knots?: number}>;
  title?: string;
  className?: string;
}

const WindChart: React.FC<WindChartProps> = ({ data, title, className = "" }) => {
  const yAxisRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data?: {
      wind_knots: number;
      wind_gust_knots?: number;
      direction_text: string;
      time: string;
    };
  }>({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    // update mobile state on resize
    const checkResize = () => setIsMobile(window.innerWidth <= 768);
    checkResize();
    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, []);

  useEffect(() => {
    if (!yAxisRef.current || !chartRef.current || !containerRef.current) return;

    // clear previous svg content
    d3.select(yAxisRef.current).selectAll("*").remove();
    d3.select(chartRef.current).selectAll("*").remove();

    const containerWidth = containerRef.current.offsetWidth;
    const margin = { top: 40, right: 20, bottom: 60, left: 50 };
    const width = containerWidth - margin.left - margin.right - 30;
    const height = 200;

    const parseTime = d3.timeParse("%H:%M");

    const parseHM = d3.timeParse("%H:%M");
      const today0 = new Date();
      today0.setHours(0, 0, 0, 0);

      let prevHM: Date | null = null;
      let dayOffset = 0;
    
    // convert data to chart-friendly format
const chartData = data.map(d => {
  const hm = parseHM(d.x)!;
  if (prevHM && hm < prevHM) dayOffset++; // crossed midnight -> next day
  prevHM = hm;

  const time = new Date(
    today0.getTime() +
    dayOffset * 24 * 60 * 60 * 1000 +
    hm.getHours() * 3600000 +
    hm.getMinutes() * 60000
  );

  return {
    time,
    windSpeed: d.wind_knots,
    windGust: d.wind_gust_knots ?? 0,
    direction: d.direction_degrees
  };
});

    // only show the last 72 points
    const recentData = chartData.slice(-72);
    const chartWidth = isMobile ? width * 2.5 : width;

    const xScale = d3.scaleTime()
      .domain(d3.extent(recentData, d => d.time) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 30])
      .range([height, 0]);

    // y axis and label
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

    // main chart group
    const chart = d3.select(chartRef.current)
      .attr("width", chartWidth)
      .attr("height", height + margin.top + margin.bottom);

    const chartGroup = chart.append("g")
      .attr("transform", `translate(0,${margin.top})`);

    // x axis
    chartGroup.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d => d3.timeFormat("%H:%M")(d as Date))
        .ticks(d3.timeHour.every(1)));

    // grid lines for better readability
    chartGroup.append("g")
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat(() => "")
        .ticks(d3.timeHour.every(1)))
      .attr("transform", `translate(0,${height})`)
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.1);

    chartGroup.append("g")
      .call(d3.axisLeft(yScale)
        .tickSize(-chartWidth)
        .tickFormat(() => "")
        .tickValues([0, 5, 10, 15, 20, 25, 30]))
      .style("stroke-dasharray", "4,2")
      .style("opacity", 0.1);

    // arrow shape config
    const shaftWidth = 7;
    const shaftLength = 12;
    const headWidth = 12;    
    const headLength = 10;
    const minY = 18;

    // svg path for arrow
    const arrowPath = `
      M ${-shaftWidth/2} 0
      L ${-shaftWidth/2} ${-shaftLength}
      L ${-headWidth/2} ${-shaftLength}
      L 0 ${-shaftLength - headLength}
      L ${headWidth/2} ${-shaftLength}
      L ${shaftWidth/2} ${-shaftLength}
      L ${shaftWidth/2} 0
      Z
    `;

    // draw gust arrows in background
    chartGroup.selectAll(".wind-gust-arrow")
      .data(recentData.filter(d => d.windGust > 0))
      .enter()
      .append("path")
      .attr("class", "wind-gust-arrow")
      .attr("d", arrowPath)
      .attr("stroke", "#dddddd")
      .attr("stroke-width", 0.7)
      .attr("fill", "#eeeeee")
      .attr("opacity", 0.7)
      .attr("transform", d => {
        const x = xScale(d.time);
        const y = Math.min(yScale(d.windGust), height - minY);
        return `translate(${x},${y}) rotate(${d.direction + 180})`;
      });

    // draw main wind arrows
    chartGroup.selectAll(".wind-arrow")
      .data(recentData)
      .enter()
      .append("path")
      .attr("class", "wind-arrow")
      .attr("d", arrowPath)
      .attr("stroke", "black")
      .attr("stroke-width", 0.2)
      .attr("fill", d => {
        if (d.windSpeed <= 10) return "red";
        if (d.windSpeed <= 17) return "yellow";
        return "green";
      })
      .attr("transform", d => {
        const x = xScale(d.time);
        const y = Math.min(yScale(d.windSpeed), height - minY);
        return `translate(${x},${y}) rotate(${d.direction + 180})`;
      });

    // helper to find nearest data point for tooltip
    function getNearestData(mx: number) {
      const bisect = d3.bisector((d: any) => d.time).left;
      const x0 = xScale.invert(mx);
      const idx = bisect(recentData, x0, 1);
      const d0 = recentData[idx - 1];
      const d1 = recentData[idx];
      if (!d0) return d1;
      if (!d1) return d0;
      // compare which point is closer to mouse x
      return (x0.getTime() - d0.time.getTime()) > (d1.time.getTime() - x0.getTime()) ? d1 : d0;
    }

    const svg = d3.select(chartRef.current);

    function showTooltip(event: any) {
      const [mx] = d3.pointer(event);
      const nearest = getNearestData(mx);
      if (!nearest) return;
      // get direction text from original data
      const orig = data.find(d => d.x === d3.timeFormat("%H:%M")(nearest.time));
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: {
     
          wind_knots: Math.round(nearest.windSpeed),      
          wind_gust_knots: orig?.wind_gust_knots != null ? Math.round(orig.wind_gust_knots) : undefined,
          direction_text: orig?.direction_text || "",
          time: d3.timeFormat("%H:%M")(nearest.time),
        }
      });
    }

    function hideTooltip() {
      setTooltip(t => ({ ...t, visible: false }));
    }

    // attach tooltip events to svg
    svg.on("mousemove", showTooltip)
       .on("mouseleave", hideTooltip)
       .on("touchstart", function(event) {
         showTooltip(event);
       })
       .on("touchmove", function(event) {
         showTooltip(event);
       })
       .on("touchend", hideTooltip);

    // scroll to end on mobile for latest data
    if (isMobile && scrollRef.current) {
      setTimeout(() => {
      
        if (scrollRef.current && recentData.some(d => d.windGust > 0)) {
          scrollRef.current.scrollLeft = chartWidth - width;
        }
      }, 100);
    }
  }, [data, isMobile]);

  return (
    <div className={`chart-container ${isMobile ? 'mobile-chart' : ''} ${className}`} ref={containerRef}>
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
      {tooltip.visible && tooltip.data && (
        <div
          className="wind-tooltip"
          style={{
            position: "fixed",
            top: tooltip.y - 100,
            ...(isMobile
              ? (tooltip.x < window.innerWidth / 2
                  ? { left: tooltip.x + 20, right: "auto" }
                  : { left: "auto", right: window.innerWidth - tooltip.x + 20 })
              : { left: tooltip.x + 20, right: "auto" }
            ),
          }}
        >
          <div>Time: <b>{tooltip.data.time}</b></div>
          <div>Average: <b>{tooltip.data.wind_knots} kn</b></div>
          {tooltip.data.wind_gust_knots !== undefined && (
            <div>Gust: <b>{tooltip.data.wind_gust_knots} kn</b></div>
          )}
          <div>Direction: <b>{tooltip.data.direction_text}</b></div>
        </div>
      )}
    </div>
  );
};

export default WindChart;