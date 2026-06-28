"use client";

import { useState } from "react";

type TrendPoint = {
  month: string;
  monthLabel: string;
  orderCount: number;
  totalRevenue: number;
  totalRevenueLabel: string;
  isSelected?: boolean;
};

type Props = {
  points: TrendPoint[];
  chartYear?: number;
  selectedMonth?: string;
  onSelectMonth?: (month: string) => void;
};

function compactIdr(value: number) {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
  return `Rp ${value}`;
}

function buildTicks(max: number, steps: number) {
  const values = new Set<number>();
  for (let i = 0; i <= steps; i++) {
    values.add(Math.round((max * i) / steps));
  }
  return Array.from(values).sort((a, b) => a - b);
}

function smoothPath(coords: { x: number; y: number }[]) {
  if (coords.length === 0) return "";
  if (coords.length === 1) return `M ${coords[0].x},${coords[0].y}`;
  let d = `M ${coords[0].x},${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const curr = coords[i];
    const next = coords[i + 1];
    const midX = (curr.x + next.x) / 2;
    d += ` C ${midX},${curr.y} ${midX},${next.y} ${next.x},${next.y}`;
  }
  return d;
}

const chartStyles = `
  @keyframes trendBarGrow {
    from { transform: scaleY(0); }
    to { transform: scaleY(1); }
  }
  @keyframes trendLineDraw {
    from { stroke-dashoffset: var(--line-length); }
    to { stroke-dashoffset: 0; }
  }
  @keyframes trendFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .trend-bar {
    transform-box: fill-box;
    transform-origin: bottom;
    animation: trendBarGrow 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
    transition: opacity 0.15s ease;
  }
  .trend-line {
    animation: trendLineDraw 1s ease-out both;
  }
  .trend-area {
    animation: trendFadeIn 0.8s ease-out both;
    animation-delay: 0.3s;
  }
  .trend-dot {
    animation: trendFadeIn 0.4s ease-out both;
  }
  .trend-hover-rect {
    fill: transparent;
    cursor: pointer;
  }
  .trend-hover-rect:hover {
    fill: rgba(11, 71, 184, 0.04);
  }
`;

export function MonthlyTrendChart({ points, chartYear, selectedMonth, onSelectMonth }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) return null;

  const width = 920;
  const rotateLabels = points.length > 6;
  const padBottom = rotateLabels ? 58 : 44;
  const height = 220 + padBottom;
  const padLeft = 56;
  const padRight = 56;
  const padTop = 24;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxCount = Math.max(1, ...points.map((p) => p.orderCount));
  const maxRevenue = Math.max(1, ...points.map((p) => p.totalRevenue));
  const hasAnyData = points.some((p) => p.orderCount > 0);
  const barGap = 10;
  const barWidth = (chartW - barGap * (points.length - 1)) / points.length;

  const countTickValues = buildTicks(maxCount, 4);
  const revenueTickValues = buildTicks(maxRevenue, 4);

  const revenueCoords = points.map((point, index) => ({
    x: padLeft + index * (barWidth + barGap) + barWidth / 2,
    y: padTop + chartH - (point.totalRevenue / maxRevenue) * chartH,
  }));

  const linePath = smoothPath(revenueCoords);
  const areaPath =
    revenueCoords.length > 0
      ? `${linePath} L ${revenueCoords[revenueCoords.length - 1].x},${padTop + chartH} L ${revenueCoords[0].x},${padTop + chartH} Z`
      : "";

  // Rough estimate of path length for the draw animation
  const lineLength = revenueCoords.reduce((acc, coord, i) => {
    if (i === 0) return acc;
    const prev = revenueCoords[i - 1];
    const dx = coord.x - prev.x;
    const dy = coord.y - prev.y;
    return acc + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  const active = hoverIndex !== null ? points[hoverIndex] : null;
  const activeCoord = hoverIndex !== null ? revenueCoords[hoverIndex] : null;

  return (
    <div
      className="monthly-trend-chart"
      style={{
        position: "relative",
        border: "1px solid #d0deff",
        borderRadius: 12,
        background: "#fff",
        padding: "16px 18px 12px",
        marginBottom: 18,
        boxShadow: "0 4px 18px rgba(10, 40, 120, 0.08)",
      }}
    >
      <style>{chartStyles}</style>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#051c4a" }}>
            Monthly trend
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6a84b0" }}>
            {chartYear
              ? `Successful transactions in ${chartYear} (January – December)`
              : "Monthly successful transactions"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#4a6490" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: "linear-gradient(180deg, #60a5fa 0%, #0b47b8 100%)",
                display: "inline-block",
              }}
            />
            Transactions
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 18,
                height: 3,
                borderRadius: 999,
                background: "#16a34a",
                display: "inline-block",
              }}
            />
            Revenue
          </span>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="auto"
          role="img"
          aria-label="Monthly transaction and revenue trend chart"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines + count axis (left) */}
          {countTickValues.map((value, i) => {
            const y = padTop + chartH - (value / maxCount) * chartH;
            return (
              <g key={`count-grid-${value}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#edf2ff"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? "0" : "4 4"}
                />
                <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
                  {value}
                </text>
              </g>
            );
          })}

          {/* Revenue axis (right) */}
          {revenueTickValues.map((value) => {
            const y = padTop + chartH - (value / maxRevenue) * chartH;
            return (
              <text
                key={`rev-axis-${value}`}
                x={width - padRight + 8}
                y={y + 4}
                textAnchor="start"
                fontSize="11"
                fill="#94a3b8"
              >
                {compactIdr(value)}
              </text>
            );
          })}

          {/* Revenue area + line */}
          {hasAnyData ? (
            <>
              <path d={areaPath} fill="url(#areaGradient)" className="trend-area" />
              <path
                d={linePath}
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="trend-line"
                style={{ "--line-length": lineLength } as React.CSSProperties}
                strokeDasharray={lineLength}
              />
            </>
          ) : null}

          {/* Bars */}
          {points.map((point, index) => {
            const x = padLeft + index * (barWidth + barGap);
            const barHeight = (point.orderCount / maxCount) * chartH;
            const y = padTop + chartH - barHeight;
            const isSelected = selectedMonth
              ? point.month === selectedMonth
              : Boolean(point.isSelected);
            const isHovered = hoverIndex === index;

            return (
              <g key={point.month}>
                {isSelected ? (
                  <rect
                    x={x - barGap / 2}
                    y={padTop}
                    width={barWidth + barGap}
                    height={chartH}
                    fill="rgba(11, 71, 184, 0.06)"
                    rx={8}
                  />
                ) : null}
                <rect
                  className="trend-bar"
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, point.orderCount > 0 ? 4 : 0)}
                  rx={6}
                  fill={isSelected ? "#0b47b8" : "url(#barGradient)"}
                  opacity={isHovered ? 1 : isSelected ? 1 : 0.88}
                  style={{ animationDelay: `${index * 45}ms` }}
                />
                <text
                  x={x + barWidth / 2}
                  y={rotateLabels ? height - padBottom + 16 : height - padBottom + 18}
                  textAnchor={rotateLabels ? "end" : "middle"}
                  fontSize="11"
                  fill={isSelected ? "#0b47b8" : "#6a84b0"}
                  fontWeight={isSelected ? 700 : 500}
                  transform={
                    rotateLabels
                      ? `rotate(-40 ${x + barWidth / 2} ${height - padBottom + 16})`
                      : undefined
                  }
                >
                  {point.monthLabel}
                </text>
              </g>
            );
          })}

          {/* Revenue dots */}
          {points.map((point, index) => {
            if (point.totalRevenue <= 0) return null;
            const { x, y } = revenueCoords[index];
            const isSelected = selectedMonth
              ? point.month === selectedMonth
              : Boolean(point.isSelected);
            const isHovered = hoverIndex === index;
            return (
              <circle
                key={`rev-dot-${point.month}`}
                className="trend-dot"
                cx={x}
                cy={y}
                r={isHovered || isSelected ? 5.5 : 4}
                fill="#fff"
                stroke="#16a34a"
                strokeWidth="2"
                style={{ animationDelay: `${index * 45 + 200}ms` }}
              />
            );
          })}

          {/* Hover guide line */}
          {activeCoord ? (
            <line
              x1={activeCoord.x}
              y1={padTop}
              x2={activeCoord.x}
              y2={padTop + chartH}
              stroke="#0b47b8"
              strokeWidth="1"
              strokeDasharray="3 4"
              opacity={0.4}
            />
          ) : null}

          {/* Hover capture areas (drawn last, on top) */}
          {points.map((point, index) => {
            const x = padLeft + index * (barWidth + barGap) - barGap / 2;
            return (
              <rect
                key={`hover-${point.month}`}
                className="trend-hover-rect"
                x={x}
                y={padTop}
                width={barWidth + barGap}
                height={chartH}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex((current) => (current === index ? null : current))}
                onClick={() => onSelectMonth?.(point.month)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {active && activeCoord ? (
          <div
            style={{
              position: "absolute",
              left: `${(activeCoord.x / width) * 100}%`,
              top: `${(activeCoord.y / height) * 100}%`,
              transform: "translate(-50%, calc(-100% - 12px))",
              background: "#051c4a",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              lineHeight: 1.5,
              whiteSpace: "nowrap",
              boxShadow: "0 8px 20px rgba(5, 28, 74, 0.25)",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{active.monthLabel}</div>
            <div style={{ color: "#bfdbfe" }}>
              Transactions: <strong style={{ color: "#fff" }}>{active.orderCount}</strong>
            </div>
            <div style={{ color: "#bbf7d0" }}>
              Revenue: <strong style={{ color: "#fff" }}>{active.totalRevenueLabel}</strong>
            </div>
          </div>
        ) : null}
      </div>

      {!hasAnyData ? (
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
          No transaction data in this period yet.
        </p>
      ) : null}
    </div>
  );
}