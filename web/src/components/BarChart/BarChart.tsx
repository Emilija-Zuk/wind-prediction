import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./BarChart.css";

// function to format YYYY-MM-DD to DD/MM/YYYY
const formatToAusDate = (dateStr: string): string => {
  if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

type DailyRow = {
  date: string;
  n: number;
  coverage: number;
  mae: number;
  rmse: number;
  bias: number;
  smape: number;
  mean_actual: number;
  mean_predicted: number;
};

interface BarChartProps {
  data: DailyRow[];
  title?: string;            // ignored
  className?: string;
  startDate?: string;        // YYYY-MM-DD
  endDate?: string;          // YYYY-MM-DD
  onDateChange?: (t: "start" | "end", v: string) => void;
  onApply?: () => void;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
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
    d?: DailyRow;
  }>({ visible: false, x: 0, y: 0 });

  //  tooltip helpers 
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
  const scheduleHide = (ms = 1000) => {
    clearHideTimer();
    hideTimer.current = window.setTimeout(() => {
      setTooltip((t) => ({ ...t, visible: false }));
      hideTimer.current = null;
    }, ms);
  };

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // hide tooltip when clicking or tapping anywhere outside the card
  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      const host = containerRef.current;
      if (!host) return;
      if (!host.contains(e.target as Node)) hideNow();
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, []);

  //  hide when clicking in the card but not on the chart svgs ( date pickers or header)
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

    // clear previous render
    d3.select(yAxisRef.current).selectAll("*").remove();
    d3.select(chartRef.current).selectAll("*").remove();

    const rows = (data || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    if (!rows.length) return;

    const containerWidth = containerRef.current.offsetWidth;

    // layout
    const margin = { top: 16, right: 12, bottom: 48, left: 56 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const height = 240;

    // bar placement exact
    const gap = isMobile ? 8 : 10;
    const targetBar = isMobile ? 28 : 34;
    const neededWidth = rows.length * targetBar + (rows.length - 1) * gap;
    const chartWidth = Math.max(innerWidth, neededWidth);
    const barWidth = Math.floor((chartWidth - (rows.length - 1) * gap) / rows.length);
    const xPos = (i: number) => i * (barWidth + gap);

    // Y scale
    const yMax = Math.max(10, d3.max(rows, (r) => r.mae || 0) || 0) * 1.15;
    const y = d3.scaleLinear().domain([0, yMax]).nice().range([height, 0]);

    // left Y axis svg
    const yAxisSvg = d3
      .select(yAxisRef.current)
      .attr("width", margin.left)
      .attr("height", height + margin.top + margin.bottom);

    const yG = yAxisSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    yG.append("g")
      .call(d3.axisLeft(y).ticks(6).tickSizeOuter(0))
      .selectAll("text")
      .style("font-size", "12px");
    yG.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -42)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .attr("class", "bar-ylabel")
      .text("MAE (knots)");

    
    const svg = d3
      .select(chartRef.current)
      .attr("width", chartWidth)
      .attr("height", height + margin.top + margin.bottom);

    // translate ONLY by top margin
    const g = svg.append("g").attr("transform", `translate(0,${margin.top})`);

    // background capture (clicks or leave on empty plot area hide immediately)
    g.append("rect")
      .attr("class", "bg-capture")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", chartWidth)
      .attr("height", height)
      .attr("fill", "transparent")
      .on("pointerdown", () => hideNow())
      .on("pointerleave", () => hideNow());

    // Grid
    g.append("g")
      .attr("class", "bar-grid")
      .call(d3.axisLeft(y).ticks(6).tickSize(-chartWidth).tickFormat(() => "" as any));

    // X axis (centered to bars)
    const xCenterScale = d3
      .scaleLinear()
      .domain([0, rows.length - 1])
      .range([barWidth / 2, chartWidth - barWidth / 2]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xCenterScale)
          .tickValues(d3.range(rows.length))
          .tickSizeOuter(0)
          .tickFormat((i: any) => {
            const dateStr = rows[i].date; // it gets YYYY-MM-DD format
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}` as any; // Convert to DD/MM format
          })
      )
      .selectAll("text")
      .style("font-size", "12px");

    // color by bias sign
    const color = (b: number) =>
      b > 0.1 ? "var(--bar-pos)" : b < -0.1 ? "var(--bar-neg)" : "var(--bar-zero)";

    const showTip = (event: any, d: DailyRow) => {
      const clientX = event?.clientX ?? event?.touches?.[0]?.clientX ?? 0;
      const clientY = event?.clientY ?? event?.touches?.[0]?.clientY ?? 0;
      setTooltip({ visible: true, x: clientX, y: clientY, d });
      scheduleHide(1000);
    };

    // Bars
    const bars = g
      .selectAll(".bar-rect")
      .data(rows, (d: any) => d.date)
      .enter()
      .append("rect")
      .attr("class", "bar-rect")
      .attr("x", (_: any, i: number) => xPos(i))
      .attr("y", (d) => y(d.mae || 0))
      .attr("width", barWidth)
      .attr("height", (d) => height - y(d.mae || 0))
      .attr("fill", (d) => color(d.bias || 0))
      .on("mousemove", (e, d) => showTip(e, d))
      .on("touchstart", (e, d) => showTip(e, d))
      .on("touchmove", (e, d) => showTip(e, d))
      .on("mouseleave", () => hideNow())
      .on("touchend", () => hideNow());

    bars
      .on("mouseenter", function () {
        d3.select(this).attr("stroke", "#111").attr("stroke-width", 1);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke", "none");
      });

    // hide if pointer leaves the whole SVG
    svg.on("pointerleave", () => hideNow());

    // hide if clicking inside the SVG but not on a bar
    svg.on("pointerdown", (event: PointerEvent) => {
      const el = event.target as Element;
      if (!el.closest(".bar-rect")) hideNow();
    });

    // autoscroll to most recent
    if (scrollRef.current && chartRef.current) {
      setTimeout(() => {
        const visibleW = scrollRef.current!.clientWidth;
        const fullW = chartRef.current!.getBBox().width;
        scrollRef.current!.scrollLeft = Math.max(0, fullW - visibleW);
      }, 100);
    }

    return () => {
      clearHideTimer();
      svg.on(".pointerleave", null);
      svg.on(".pointerdown", null);
    };
  }, [data, isMobile]);

  return (
    <div className={`bar-container ${isMobile ? "mobile" : ""} ${className}`} ref={containerRef}>
      <div className="bar-header bar-header-right">
        {startDate && endDate && onDateChange && onApply && (
          <div className="bar-date-picker">
            <input type="date" value={startDate} onChange={(e) => onDateChange("start", e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => onDateChange("end", e.target.value)} />
            <button className="bar-apply" onClick={onApply}>Apply</button>
          </div>
        )}
      </div>

      <div style={{ display: "flex" }}>
        <svg ref={yAxisRef} style={{ flexShrink: 0 }} />
        <div ref={scrollRef} style={{ overflowX: "auto", overflowY: "hidden", flexGrow: 1 }}>
          <svg ref={chartRef} />
        </div>
      </div>

      <div className="bar-legend">
        <span className="legend-item">
          <span className="legend-swatch swatch-pos" /> Over-forecast (bias &gt; 0)
        </span>
        <span className="legend-item">
          <span className="legend-swatch swatch-neg" /> Under-forecast (bias &lt; 0)
        </span>
      </div>

      {tooltip.visible && tooltip.d && (
        <div
          className="bar-tooltip"
          style={{
            position: "fixed",
            top: tooltip.y - 110,
            // flip tooltip side based on pointer x
            left: tooltip.x <= window.innerWidth / 2 ? tooltip.x + 18 : undefined,
            right: tooltip.x > window.innerWidth / 2 ? window.innerWidth - tooltip.x + 18 : undefined,
          }}
        >
          <div className="tt-date">{formatToAusDate(tooltip.d.date)}</div>
          <div>n: <b>{tooltip.d.n}</b> (coverage {(tooltip.d.coverage * 100).toFixed(1)}%)</div>
          <div>MAE: <b>{tooltip.d.mae.toFixed(2)} kn</b></div>
          <div>RMSE: <b>{tooltip.d.rmse.toFixed(2)} kn</b></div>
          <div>Bias: <b>{tooltip.d.bias.toFixed(2)} kn</b></div>
          <div>sMAPE: <b>{(tooltip.d.smape * 100).toFixed(1)}%</b></div>
          <div>
            Mean A/P: <b>{tooltip.d.mean_actual.toFixed(2)}</b> /{" "}
            <b>{tooltip.d.mean_predicted.toFixed(2)}</b>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarChart;
