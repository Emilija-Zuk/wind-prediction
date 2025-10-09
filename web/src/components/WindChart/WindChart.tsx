import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./WindChart.css";

interface WindChartProps {
  data: Array<{
    x: string; // "HH:MM"
    wind_knots: number;
    direction_degrees: number;
    direction_text: string;
    wind_gust_knots?: number;
  }>;
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

  // tooltip helpers
  const hideTimer = useRef<number | null>(null);
  const clearHideTimer = () => {
    if (hideTimer.current != null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  const hideNow = () => {
    clearHideTimer();
    setTooltip((t) => ({ ...t, visible: false }));
  };
  const scheduleHide = (ms = 3000) => {
    clearHideTimer();
    hideTimer.current = window.setTimeout(() => {
      setTooltip((t) => ({ ...t, visible: false }));
      hideTimer.current = null;
    }, ms);
  };

  useEffect(() => {
    const checkResize = () => setIsMobile(window.innerWidth <= 768);
    checkResize();
    window.addEventListener("resize", checkResize);
    return () => window.removeEventListener("resize", checkResize);
  }, []);

  // Hide tooltip on any click outside the card
  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      const host = containerRef.current;
      if (!host) return;
      if (!host.contains(e.target as Node)) hideNow();
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, []);

  // Hide when clicking inside the card but NOT on the chart SVGs
  useEffect(() => {
    const host = containerRef.current;
    const onHostPointerDown = (e: PointerEvent) => {
      const inChart =
        (chartRef.current && chartRef.current.contains(e.target as Node)) ||
        (yAxisRef.current && yAxisRef.current.contains(e.target as Node));
      if (!inChart) hideNow();
    };
    if (host) {
      host.addEventListener("pointerdown", onHostPointerDown, true);
      return () => host.removeEventListener("pointerdown", onHostPointerDown, true);
    }
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

    const parseHM = d3.timeParse("%H:%M");
    const today0 = new Date();
    today0.setHours(0, 0, 0, 0);

    let prevHM: Date | null = null;
    let dayOffset = 0;

    // convert data to chart-friendly format (carry over day across midnight)
    const chartData = data.map((d) => {
      const hm = parseHM!(d.x)!;
      if (prevHM && hm < prevHM) dayOffset++; // crossed midnight
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
        direction: d.direction_degrees,
      };
    });

    // last 72 points
    const recentData = chartData.slice(-72);
    const chartWidth = isMobile ? width * 2.6 : width;

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(recentData, (d) => d.time) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear().domain([0, 30]).range([height, 0]);

    // y axis and label
    const yAxis = d3
      .select(yAxisRef.current)
      .attr("width", margin.left)
      .attr("height", height + margin.top + margin.bottom);

    const yGroup = yAxis.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    yGroup.append("g").call(d3.axisLeft(yScale).tickValues([0, 5, 10, 15, 20, 25, 30]));

    yGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Wind Speed (knots)");

    // main chart group
    const chart = d3
      .select(chartRef.current)
      .attr("width", chartWidth)
      .attr("height", height + margin.top + margin.bottom);

    const chartGroup = chart.append("g").attr("transform", `translate(0,${margin.top})`);

    // transparent rect to capture empty-area clicks & pointerleave
    chartGroup
      .append("rect")
      .attr("class", "bg-capture")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", chartWidth)
      .attr("height", height)
      .attr("fill", "transparent")
      .on("pointerdown", () => hideNow())
      .on("pointerleave", () => hideNow());

    // x axis
    chartGroup
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickFormat((d) => d3.timeFormat("%H:%M")(d as Date))
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

    // arrow shape config
    const shaftWidth = 7;
    const shaftLength = 12;
    const headWidth = 12;
    const headLength = 10;
    const minY = 18;

    const arrowPath = `
      M ${-shaftWidth / 2} 0
      L ${-shaftWidth / 2} ${-shaftLength}
      L ${-headWidth / 2} ${-shaftLength}
      L 0 ${-shaftLength - headLength}
      L ${headWidth / 2} ${-shaftLength}
      L ${shaftWidth / 2} ${-shaftLength}
      L ${shaftWidth / 2} 0
      Z
    `;

    // gust arrows (background)
    chartGroup
      .selectAll(".wind-gust-arrow")
      .data(recentData.filter((d) => d.windGust > 0))
      .enter()
      .append("path")
      .attr("class", "wind-gust-arrow")
      .attr("d", arrowPath)
      .attr("stroke", "#dddddd")
      .attr("stroke-width", 0.7)
      .attr("fill", "#eeeeee")
      .attr("opacity", 0.7)
      .attr("transform", (d) => {
        const x = xScale(d.time);
        const y = Math.min(yScale(d.windGust), height - minY);
        return `translate(${x},${y}) rotate(${d.direction + 180})`;
      });

    // main wind arrows
    chartGroup
      .selectAll(".wind-arrow")
      .data(recentData)
      .enter()
      .append("path")
      .attr("class", "wind-arrow")
      .attr("d", arrowPath)
      .attr("stroke", "black")
      .attr("stroke-width", 0.2)
      .attr("fill", (d) => {
        if (d.windSpeed <= 10) return "red";
        if (d.windSpeed <= 17) return "yellow";
        return "green";
      })
      .attr("transform", (d) => {
        const x = xScale(d.time);
        const y = Math.min(yScale(d.windSpeed), height - minY);
        return `translate(${x},${y}) rotate(${d.direction + 180})`;
      });

    // nearest for tooltip
    function getNearestData(mx: number) {
      const bisect = d3.bisector((d: any) => d.time).left;
      const x0 = xScale.invert(mx);
      const idx = bisect(recentData, x0, 1);
      const d0 = recentData[idx - 1];
      const d1 = recentData[idx];
      if (!d0) return d1;
      if (!d1) return d0;
      return x0.getTime() - d0.time.getTime() > d1.time.getTime() - x0.getTime() ? d1 : d0;
    }

    const svg = d3.select(chartRef.current);

    function showTooltip(event: any) {
      const [mx] = d3.pointer(event);
      const nearest = getNearestData(mx);
      if (!nearest) return;

      // get direction text & gust from original input by HH:MM
      const hhmm = d3.timeFormat("%H:%M")(nearest.time);
      const orig = data.find((d) => d.x === hhmm);

      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: {
          wind_knots: Math.round(nearest.windSpeed),
          wind_gust_knots:
            orig?.wind_gust_knots != null ? Math.round(orig.wind_gust_knots) : undefined,
          direction_text: orig?.direction_text || "",
          time: hhmm,
        },
      });
      scheduleHide(3000);
    }

    // svg level immediate hide behaviors
    svg
      .on("pointerleave", () => hideNow())
      .on("pointerdown", (event: PointerEvent) => {
        const el = event.target as Element;
        // if the click wasn't on an arrow path, hide immediately
        if (!el.closest(".wind-arrow, .wind-gust-arrow")) hideNow();
      })
      .on("mousemove", showTooltip)
      .on("touchstart", showTooltip)
      .on("touchmove", showTooltip)
      .on("touchend", () => hideNow());

    // scroll to end on mobile 
    if (isMobile && scrollRef.current) {
      const hasGusts = recentData.some(d => d.windGust > 0);
      setTimeout(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollLeft = hasGusts ? (chartWidth - width) : 0;
      }, 100);
    }

    return () => {
      clearHideTimer();
      svg.on(".pointerleave", null);
      svg.on(".pointerdown", null);
      svg.on("mousemove", null);
      svg.on("touchstart", null);
      svg.on("touchmove", null);
      svg.on("touchend", null);
    };
  }, [data, isMobile]);

  return (
    <div className={`chart-container ${isMobile ? "mobile-chart" : ""} ${className}`} ref={containerRef}>
      <div style={{ display: "flex" }}>
        <svg ref={yAxisRef} style={{ flexShrink: 0 }} />
        <div
          ref={scrollRef}
          style={{
            overflowX: isMobile ? "auto" : "hidden",
            overflowY: "hidden",
            flexGrow: 1,
          }}
        >
          <svg ref={chartRef} />
        </div>
      </div>

      {tooltip.visible && tooltip.data && (
        <div
          className="wind-tooltip"
          style={{
            position: "fixed",
            top: tooltip.y - 100,
            ...(isMobile
              ? tooltip.x < window.innerWidth / 2
                ? { left: tooltip.x + 20, right: "auto" }
                : { left: "auto", right: window.innerWidth - tooltip.x + 20 }
              : { left: tooltip.x + 20, right: "auto" }),
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
