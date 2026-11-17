"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  getPeriod, getAccountType, subscribeToAnalyticsFilters,
} from "@/lib/analyticsDateStore";
import {
  getOccupancyStats, getOccupancyRateSeries,
  getVacancyByLocation, getTenancyRenewals, LONGEST_VACANT_PROPERTIES,
  fmtNum, fmtPct,
  type VacantPropertyRow,
} from "@/lib/analytics-mock";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";

const CARD: React.CSSProperties = {
  backgroundColor: "#fff",
  border: "1px solid #E6E8EE",
  borderRadius: 16,
  padding: 28,
};

export default function PKOccupancy() {
  const [, tick] = useState(0);
  useEffect(() => subscribeToAnalyticsFilters(() => tick((n) => n + 1)), []);

  const period = getPeriod();
  const filter = getAccountType();

  const stats    = getOccupancyStats(period, filter);
  const series   = getOccupancyRateSeries(period, filter);
  const byLoc    = getVacancyByLocation(period, filter);
  const renewals = getTenancyRenewals(period, filter);

  const rateValues = series.map((d) => d.rate);
  const rateMin    = Math.min(...rateValues) - 1;
  const rateMax    = Math.max(...rateValues) + 1;

  const maxVacant = Math.max(...byLoc.map((r) => r.vacant), 1);

  /* ── sort state for longest-vacant table ── */
  const [sortCol, setSortCol] = useState<keyof VacantPropertyRow>("days");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedVacant = [...LONGEST_VACANT_PROPERTIES].sort((a, b) => {
    const aV = a[sortCol], bV = b[sortCol];
    if (typeof aV === "number")
      return sortDir === "asc" ? aV - (bV as number) : (bV as number) - aV;
    return sortDir === "asc"
      ? String(aV).localeCompare(String(bV))
      : String(bV).localeCompare(String(aV));
  });

  function handleSort(col: keyof VacantPropertyRow) {
    if (col === sortCol) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "days" ? "desc" : "asc");
    }
  }

  function SortIndicator({ col }: { col: keyof VacantPropertyRow }) {
    if (col !== sortCol) {
      return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    }
    return (
      <span style={{ marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  }

  function daysColor(days: number): string {
    if (days >= 60) return "#C0392B";
    if (days >= 30) return "#EA5B25";
    return "#0E1330";
  }

  return (
    <div
      style={{
        backgroundColor: "#F6F7F9",
        minHeight: "100%",
        padding: "40px",
        fontFamily: "var(--font-inter), Inter, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <PKAnalyticsHeader
          title="Occupancy"
          subtitle="Property utilisation, vacancy and tenancy renewals"
        />

        {/* ── Row 1: 4 stat cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
            marginTop: 32,
          }}
          className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Card 1 – Occupancy rate */}
          <div style={CARD}>
            <div
              style={{ fontSize: 12, color: "#5B6475", marginBottom: 6 }}
            >
              Occupancy rate
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#0E1330",
                lineHeight: 1.1,
              }}
            >
              {fmtPct(stats.occupancyRate)}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: stats.rateDelta >= 0 ? "#1F7A4D" : "#C0392B",
                marginTop: 6,
              }}
            >
              {stats.rateDelta >= 0 ? "+" : ""}
              {stats.rateDelta}pp vs prev period
            </div>
          </div>

          {/* Card 2 – Active tenancies */}
          <div style={CARD}>
            <div
              style={{ fontSize: 12, color: "#5B6475", marginBottom: 6 }}
            >
              Active tenancies
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#0E1330",
                lineHeight: 1.1,
              }}
            >
              {fmtNum(stats.activeTenancies)}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: stats.activeDelta >= 0 ? "#1F7A4D" : "#C0392B",
                marginTop: 6,
              }}
            >
              {stats.activeDelta >= 0 ? "+" : ""}
              {stats.activeDelta} vs prev period
            </div>
          </div>

          {/* Card 3 – Vacant properties */}
          <div style={CARD}>
            <div
              style={{ fontSize: 12, color: "#5B6475", marginBottom: 6 }}
            >
              Vacant properties
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#0E1330",
                lineHeight: 1.1,
              }}
            >
              {fmtNum(stats.vacantProperties)}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                /* negative delta = fewer vacant = good */
                color: stats.vacantDelta <= 0 ? "#1F7A4D" : "#C0392B",
                marginTop: 6,
              }}
            >
              {stats.vacantDelta >= 0 ? "+" : ""}
              {stats.vacantDelta} vs prev period
            </div>
          </div>

          {/* Card 4 – Avg days vacant */}
          <div style={CARD}>
            <div
              style={{ fontSize: 12, color: "#5B6475", marginBottom: 6 }}
            >
              Avg days vacant
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#0E1330",
                lineHeight: 1.1,
              }}
            >
              {stats.avgDaysVacant} days
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                /* negative delta = fewer days = good */
                color: stats.avgDaysDelta <= 0 ? "#1F7A4D" : "#C0392B",
                marginTop: 6,
              }}
            >
              {stats.avgDaysDelta >= 0 ? "+" : ""}
              {stats.avgDaysDelta} days vs prev period
            </div>
          </div>
        </div>

        {/* ── Occupancy rate over time ── */}
        <div style={{ ...CARD, marginTop: 48 }}>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}
            >
              Occupancy rate over time
            </div>
            <div style={{ fontSize: 12, color: "#5B6475", marginTop: 4 }}>
              Percentage of properties occupied across the selected period
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={series}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                horizontal
                vertical={false}
                stroke="#EDEEF1"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#5B6475" }}
              />
              <YAxis
                domain={[rateMin, rateMax]}
                tickFormatter={(v: number) => v + "%"}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#5B6475" }}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #E6E8EE",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [v + "%", "Occupancy rate"]}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#EA5B25"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Two-card section: vacancy by location + tenancy renewals ── */}
        <div
          style={{ display: "grid", gap: 20, marginTop: 48 }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          {/* Card A – Vacancy by location */}
          <div style={CARD}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#0E1330",
                marginBottom: 4,
              }}
            >
              Vacancy by location
            </div>
            <div
              style={{ fontSize: 12, color: "#5B6475", marginBottom: 20 }}
            >
              Number of vacant units per location
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {byLoc.map((row) => (
                <div key={row.location}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#0E1330" }}>
                      {row.location}
                    </span>
                    <span style={{ fontSize: 12, color: "#5B6475" }}>
                      {row.vacant}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#EDEEF1",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        backgroundColor: "#EA5B25",
                        width: `${(row.vacant / maxVacant) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card B – Tenancy renewals */}
          <div style={CARD}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#0E1330",
                marginBottom: 4,
              }}
            >
              Tenancy renewals
            </div>
            <div
              style={{ fontSize: 12, color: "#5B6475", marginBottom: 20 }}
            >
              Renewal rate for tenancies ending in the selected period
            </div>

            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#0E1330",
                lineHeight: 1,
              }}
            >
              {fmtPct(renewals.rate)}
            </div>
            <div style={{ fontSize: 12, color: "#5B6475", marginTop: 6 }}>
              {renewals.renewed} renewed, {renewals.notRenewed} not renewed
            </div>

            {/* Split bar */}
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#E6E8EE",
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${renewals.rate * 100}%`,
                    backgroundColor: "#EA5B25",
                    borderRadius: "5px 0 0 5px",
                  }}
                />
                <div
                  style={{
                    height: "100%",
                    flex: 1,
                    backgroundColor: "#E6E8EE",
                    borderRadius: "0 5px 5px 0",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <span style={{ fontSize: 11, color: "#5B6475" }}>
                  Renewed · {renewals.renewed}
                </span>
                <span style={{ fontSize: 11, color: "#5B6475" }}>
                  Not renewed · {renewals.notRenewed}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Longest vacant properties table ── */}
        <div
          style={{
            ...CARD,
            padding: 0,
            overflow: "hidden",
            marginTop: 48,
          }}
        >
          <div style={{ padding: "20px 28px 16px" }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#0E1330",
              }}
            >
              Longest vacant properties
            </div>
            <div style={{ fontSize: 12, color: "#5B6475", marginTop: 4 }}>
              Properties that have been vacant the longest
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#F6F7F9",
                    borderBottom: "1px solid #E6E8EE",
                  }}
                >
                  {(
                    [
                      { label: "Property",     col: "property"  as keyof VacantPropertyRow, align: "left"  },
                      { label: "Location",     col: "location"  as keyof VacantPropertyRow, align: "left"  },
                      { label: "Days vacant",  col: "days"      as keyof VacantPropertyRow, align: "right" },
                      { label: "Landlord",     col: "landlord"  as keyof VacantPropertyRow, align: "left"  },
                    ] as const
                  ).map(({ label, col, align }) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      style={{
                        padding: "10px 16px",
                        textAlign: align,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "#5B6475",
                        cursor: "pointer",
                        userSelect: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                      <SortIndicator col={col} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedVacant.map((row, idx) => (
                  <tr
                    key={`${row.property}-${row.unit}-${idx}`}
                    style={{
                      borderBottom: "1px solid #F0F1F3",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        "rgba(0,0,0,0.015)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        "transparent";
                    }}
                  >
                    {/* Property + unit */}
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#0E1330",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.property} {row.unit}
                    </td>

                    {/* Location */}
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        color: "#5B6475",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.location}
                    </td>

                    {/* Days vacant */}
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: daysColor(row.days),
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.days} days
                    </td>

                    {/* Landlord */}
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        color: "#5B6475",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.landlord}
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
