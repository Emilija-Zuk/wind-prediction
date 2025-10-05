import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./ScatterChart.css";

type Row = { time: string; actual: number; predicted: number };

interface ScatterChartProps {
  data: Row[];
  title?: string;                 // not used
  className?: string;
  startDate?: string;             // YYYY-MM-DD
  endDate?: string;               // YYYY-MM-DD
  onDateChange?: (type: "start" | "end", value: string) => void;
  onApply?: () => void;
}

/** Brisbane formatter: "YYYY-MM-DD HH:mm" */
const fmtPartsBris = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Australia/Brisbane",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
function formatBris(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const parts = fmtPartsBris.formatToParts(d).reduce<Record<string, string>>(
    (acc, p) => ((acc[p.type] = p.value), acc),
    {}
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

const ScatterChart: React.FC<ScatterChartProps> = ({
  data,
  className = "",
  startDate,
  endDate,
  onDateChange,
  onApply,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    p?: { time: string; actual: number; predicted: number; err: number };
  }>({ visible: false, x: 0, y: 0 });

  // ---- tooltip timers / helpers ----
  const hideTimer = useRef<number | null>(null);
  const clearHideTimer = () => {
    if (hideTimer.current) {
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

  // Resize flag
  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 768);
    onR();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  // Clean, finite points
  const points = useMemo(
    () =>
      (data || [])
        .filter(
          (d) =>
            Number.isFinite(d.actual) &&
            Number.isFinite(d.predicted) &&
            d.actual !== null &&
            d.predicted !== null
        )
        .map((d) => ({
          time: d.time,
          a: +d.actual,
          p: +d.predicted,
          err: d.actual - d.predicted,
        })),
    [data]
  );

  // Hide on click/tap outside the chart container
  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      const host = containerRef.current;
      if (!host) return;
      if (!host.contains(e.target as Node)) hideNow();
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const W = containerRef.current.offsetWidth;
    const margin = { top: 28, right: 16, bottom: 44, left: 56 };
    const width = Math.max(280, W - margin.left - margin.right);
    const height = 260;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    if (!points.length) return;

    // Domain (same for X & Y so 45° is true diagonal)
    const vals = points.flatMap((p) => [p.a, p.p]);
    const vMin = Math.min(0, d3.min(vals) ?? 0);
    const vMax = (d3.max(vals) ?? 10) * 1.05;

    const x = d3.scaleLinear().domain([vMin, vMax]).range([0, width]).nice();
    const y = d3.scaleLinear().domain([vMin, vMax]).range([height, 0]).nice();

    // Background rect to catch pointer events (click/leave not on dots)
    g.append("rect")
      .attr("class", "bg-capture")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .on("pointerdown", () => hideNow())
      .on("pointerleave", () => hideNow());

    // Grid
    g.append("g")
      .attr("class", "scatter-grid")
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => "" as any))
      .selectAll("line")
      .attr("opacity", 0.6);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6))
      .selectAll("text")
      .style("font-size", "12px");

    g.append("g")
      .call(d3.axisLeft(y).ticks(6))
      .selectAll("text")
      .style("font-size", "12px");

    // Axis labels
    g.append("text")
      .attr("class", "scatter-axis-label")
      .attr("x", width / 2)
      .attr("y", height + 36)
      .style("text-anchor", "middle")
      .text("Forecast (knots)");

    g.append("text")
      .attr("class", "scatter-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .style("text-anchor", "middle")
      .text("Actual (knots)");

    // 45° diagonal y = x
    g.append("line")
      .attr("x1", x(vMin))
      .attr("y1", y(vMin))
      .attr("x2", x(vMax))
      .attr("y2", y(vMax))
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4");

    // Color by bias (predicted - actual)
    const color = (bias: number) =>
      bias > 0
        ? "var(--bar-pos, #f59e0b)" // over-forecast
        : "var(--bar-neg, #3b82f6)"; // under-forecast

    // Dots
    const r = isMobile ? 3 : 3.5;

    g.selectAll("circle.dot")
      .data(points)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.p))
      .attr("cy", (d) => y(d.a))
      .attr("r", r)
      .attr("fill", (d) => color(d.p - d.a))
      .attr("opacity", 0.85)
      .on("mousemove", (event, d) => {
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          p: { time: d.time, actual: d.a, predicted: d.p, err: d.a - d.p },
        });
        scheduleHide(1000);
      })
      .on("mouseleave", () => hideNow())
      .on("touchstart", (event: any, d) => {
        const touch = event.touches?.[0];
        setTooltip({
          visible: true,
          x: touch?.clientX ?? 0,
          y: touch?.clientY ?? 0,
          p: { time: d.time, actual: d.a, predicted: d.p, err: d.a - d.p },
        });
        scheduleHide(1000);
      });

    // hide if pointer leaves the whole SVG
    svg.on("pointerleave", () => hideNow());

    // hide if clicking inside the SVG but not on a circle
    svg.on("pointerdown", (event: PointerEvent) => {
      const el = event.target as Element;
      if (el && el.tagName.toLowerCase() !== "circle") hideNow();
    });

    return () => {
      clearHideTimer();
      svg.on(".pointerleave", null);
      svg.on(".pointerdown", null);
    };
  }, [points, isMobile]);

  return (
    <div className={`scatter-container ${className}`} ref={containerRef}>
      {/* Right aligned date pickers*/}
      <div className="scatter-header scatter-header-right">
        {startDate && endDate && onDateChange && onApply && (
          <div className="scatter-date-picker">
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
            <button className="scatter-apply" onClick={onApply}>
              Apply
            </button>
          </div>
        )}
      </div>

      <svg ref={svgRef} />

      {/* Legend  */}
      <div className="scatter-legend">
        <span className="legend-item">
          <span className="legend-swatch swatch-pos" /> Over-forecast (bias &gt; 0)
        </span>
        <span className="legend-item">
          <span className="legend-swatch swatch-neg" /> Under-forecast (bias &lt; 0)
        </span>
      </div>

      {tooltip.visible && tooltip.p && (
        <div
          className="scatter-tooltip"
          style={{
            position: "fixed",
            top: tooltip.y - 110,
            left: tooltip.x + 18,
          }}
        >
          <div className="tt-date">{formatBris(tooltip.p.time)}</div>
          <div>
            Forecast / Actual:&nbsp;
            <b>{tooltip.p.predicted.toFixed(2)}</b> /{" "}
            <b>{tooltip.p.actual.toFixed(2)}</b> kn
          </div>
          <div>
            Error (A−P): <b>{tooltip.p.err.toFixed(2)} kn</b>
          </div>
          <div className="tt-note">Diagonal = perfect forecast</div>
        </div>
      )}
    </div>
  );
};

export default ScatterChart;
