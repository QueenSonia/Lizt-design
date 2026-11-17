"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import {
  getPeriod, getAccountType, subscribeToAnalyticsFilters,
} from "@/lib/analyticsDateStore";
import {
  getMaintenancePageStats, getMaintenanceSeries,
  getMaintenanceByCategory, getMaintenanceStatusBreakdown,
  getFmTable, fmtNum,
  type FmRow,
} from "@/lib/analytics-mock";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";

export default function PKMaintenance() {
  const [, tick] = useState(0);
  useEffect(() => subscribeToAnalyticsFilters(() => tick((n) => n + 1)), []);
  const period = getPeriod();
  const filter = getAccountType();

  const stats = getMaintenancePageStats(period, filter);
  const series = getMaintenanceSeries(period, filter);
  const categories = getMaintenanceByCategory(period, filter);
  const { rows: statusRows, total: statusTotal } = getMaintenanceStatusBreakdown(period, filter);

  const [sortCol, setSortCol] = useState<keyof FmRow>("assigned");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(col: keyof FmRow) {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  const sorted = [...getFmTable(period, filter)].sort((a, b) => {
    const aV = a[sortCol], bV = b[sortCol];
    if (typeof aV === "string") return sortDir === "asc" ? aV.localeCompare(bV as string) : (bV as string).localeCompare(aV);
    return sortDir === "asc" ? (aV as number) - (bV as number) : (bV as number) - (aV as number);
  });

  const statusColors: Record<string, string> = {
    "Pending":     "#5B6475",
    "In progress": "#EA5B25",
    "Resolved":    "#1F7A4D",
    "Reopened":    "#C0392B",
  };

  const card: React.CSSProperties = {
    backgroundColor: "#fff",
    border: "1px solid #E6E8EE",
    borderRadius: 16,
    padding: 28,
  };

  return (
    <div style={{ backgroundColor: "#F6F7F9", minHeight: "100%", padding: "40px", fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <PKAnalyticsHeader title="Maintenance" subtitle="Service requests, resolution times and facility manager performance" />

        {/* Row 1: 4 stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 48 }}>
            {/* Total requests */}
            <div style={card}>
              <div style={{ fontSize: 12, color: "#5B6475", marginBottom: 8 }}>Total requests</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0E1330", lineHeight: 1.1, marginBottom: 6 }}>
                {fmtNum(stats.totalRequests)}
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: stats.totalDelta <= 0 ? "#1F7A4D" : "#C0392B",
              }}>
                {stats.totalDelta >= 0 ? "+" : ""}{stats.totalDelta}%
              </div>
            </div>

            {/* Open requests */}
            <div style={card}>
              <div style={{ fontSize: 12, color: "#5B6475", marginBottom: 8 }}>Open requests</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0E1330", lineHeight: 1.1, marginBottom: 6 }}>
                {fmtNum(stats.openRequests)}
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: stats.openDelta <= 0 ? "#1F7A4D" : "#C0392B",
              }}>
                {stats.openDelta >= 0 ? "+" : ""}{stats.openDelta}%
              </div>
            </div>

            {/* Avg resolution time */}
            <div style={card}>
              <div style={{ fontSize: 12, color: "#5B6475", marginBottom: 8 }}>Avg resolution time</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0E1330", lineHeight: 1.1, marginBottom: 6 }}>
                {stats.avgResolutionH}h
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: stats.resolutionDelta <= 0 ? "#1F7A4D" : "#C0392B",
              }}>
                {stats.resolutionDelta >= 0 ? "+" : ""}{stats.resolutionDelta}h
              </div>
            </div>

            {/* Reopen rate */}
            <div style={card}>
              <div style={{ fontSize: 12, color: "#5B6475", marginBottom: 8 }}>Reopen rate</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0E1330", lineHeight: 1.1, marginBottom: 6 }}>
                {stats.reopenRate}%
              </div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: stats.reopenDelta <= 0 ? "#1F7A4D" : "#C0392B",
              }}>
                {stats.reopenDelta >= 0 ? "+" : ""}{stats.reopenDelta}pp
              </div>
            </div>
        </div>

        {/* Requests received vs resolved: full-width chart */}
        <div style={{ ...card, marginBottom: 48 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330", marginBottom: 4 }}>
                Requests received vs resolved
              </div>
              <div style={{ fontSize: 12, color: "#5B6475" }}>
                Volume of new requests and resolutions over time
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#EDEEF1" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#5B6475" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#5B6475" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value,
                    name === "newRequests" ? "Received" : "Resolved",
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E6E8EE" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(name: string) => name === "newRequests" ? "Received" : "Resolved"}
                />
                <Line
                  type="monotone"
                  dataKey="newRequests"
                  stroke="#EA5B25"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#C9CED8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
        </div>

        {/* Two-column section: category + status */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 48 }}>
          {/* Card A: Requests by category */}
          <div style={card}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1330", marginBottom: 4 }}>
                Requests by category
              </div>
              <div style={{ fontSize: 12, color: "#5B6475" }}>
                Distribution across request types
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {categories.map((cat) => (
                <div key={cat.category}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#0E1330" }}>{cat.category}</span>
                    <span style={{ fontSize: 12, color: "#5B6475" }}>{cat.count} ({cat.pct}%)</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: "#EDEEF1", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${cat.pct}%`, backgroundColor: "#EA5B25", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card B: Status breakdown */}
          <div style={card}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1330", marginBottom: 4 }}>
                Status breakdown
              </div>
              <div style={{ fontSize: 12, color: "#5B6475" }}>
                Current distribution of request statuses
              </div>
            </div>

            {/* Horizontal split bar */}
            <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 20 }}>
              {statusRows.map((row, i) => {
                const widthPct = statusTotal > 0 ? (row.count / statusTotal) * 100 : 0;
                return (
                  <div
                    key={row.label}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: statusColors[row.label] ?? "#C9CED8",
                      borderRadius: i === 0 ? "6px 0 0 6px" : i === statusRows.length - 1 ? "0 6px 6px 0" : 0,
                    }}
                  />
                );
              })}
            </div>

            {/* Legend 2x2 grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
              {statusRows.map((row) => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: statusColors[row.label] ?? "#C9CED8",
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, color: "#5B6475" }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: "#0E1330", fontWeight: 500, marginLeft: "auto" }}>{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Facility managers table */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #E6E8EE" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330", marginBottom: 4 }}>
              Facility managers
            </div>
            <div style={{ fontSize: 12, color: "#5B6475" }}>
              Assignment load, resolution performance and reopen rates
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#F6F7F9", borderBottom: "1px solid #E6E8EE" }}>
                  {(
                    [
                      { key: "name",           label: "Name",                align: "left"  },
                      { key: "assigned",        label: "Assigned",            align: "right" },
                      { key: "resolved",        label: "Resolved",            align: "right" },
                      { key: "reopened",        label: "Reopened",            align: "right" },
                      { key: "avgResolutionH",  label: "Avg resolution time", align: "right" },
                    ] as { key: keyof FmRow; label: string; align: "left" | "right" }[]
                  ).map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      style={{
                        padding: "10px 20px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#5B6475",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        textAlign: col.align,
                        cursor: "pointer",
                        userSelect: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.label}
                      {sortCol === col.key && (
                        <span style={{ color: "#EA5B25", marginLeft: 4 }}>
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, idx) => (
                  <tr
                    key={row.name}
                    style={{
                      borderBottom: idx < sorted.length - 1 ? "1px solid #F0F1F3" : "none",
                      backgroundColor: "transparent",
                      transition: "background-color 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.015)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 500, color: "#0E1330" }}>
                      {row.name}
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: 12, color: "#5B6475", textAlign: "right" }}>
                      {row.assigned}
                    </td>
                    <td style={{
                      padding: "12px 20px",
                      fontSize: 12,
                      textAlign: "right",
                      color: row.resolved / Math.max(1, row.assigned) >= 0.9 ? "#1F7A4D" : "#0E1330",
                    }}>
                      {row.resolved}
                    </td>
                    <td style={{
                      padding: "12px 20px",
                      fontSize: 12,
                      textAlign: "right",
                      color: row.reopened > 10 ? "#C0392B" : "#5B6475",
                    }}>
                      {row.reopened}
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: 12, color: "#5B6475", textAlign: "right" }}>
                      {row.avgResolutionH}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
