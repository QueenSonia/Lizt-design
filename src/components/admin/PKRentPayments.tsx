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
  getRentPageStats, getRentSeries,
  getOverdueByAge, getPaymentMethods, getLandlordTable,
  fmtCompact, fmtNum, fmtPct,
  type LandlordRow,
} from "@/lib/analytics-mock";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";

// ── Filter subscription ────────────────────────────────────────────────────────

function useAnalyticsFilters() {
  const [, tick] = useState(0);
  useEffect(() => subscribeToAnalyticsFilters(() => tick((n) => n + 1)), []);
  return { period: getPeriod(), filter: getAccountType() };
}

// ── Delta badge ────────────────────────────────────────────────────────────────

type DeltaMode = "positive-good" | "negative-good" | "neutral" | "pp";

function DeltaBadge({ value, mode }: { value: number; mode: DeltaMode }) {
  let color: string;
  if (mode === "neutral") {
    color = "#5B6475";
  } else if (mode === "pp") {
    color = value >= 0 ? "#1F7A4D" : "#C0392B";
  } else if (mode === "positive-good") {
    color = value >= 0 ? "#1F7A4D" : "#C0392B";
  } else {
    // negative-good: down is good
    color = value <= 0 ? "#1F7A4D" : "#C0392B";
  }

  let label: string;
  if (mode === "pp") {
    label = `${value >= 0 ? "+" : ""}${value}pp`;
  } else {
    label = `${value >= 0 ? "+" : ""}${value}%`;
  }

  return (
    <span style={{ fontSize: 12, fontWeight: 500, color }}>
      {label}
    </span>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  delta,
  deltaMode,
}: {
  label: string;
  value: string;
  delta: number;
  deltaMode: DeltaMode;
}) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #E6E8EE",
        borderRadius: 16,
        padding: 28,
      }}
    >
      <div style={{ fontSize: 12, color: "#5B6475", marginBottom: 8 }}>{label}</div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#0E1330",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <DeltaBadge value={delta} mode={deltaMode} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PKRentPayments() {
  const { period, filter } = useAnalyticsFilters();

  // Sort state for landlord table
  const [sortCol, setSortCol] = useState<keyof LandlordRow>("rate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(col: keyof LandlordRow) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const stats = getRentPageStats(period, filter);
  const series = getRentSeries(period, filter);
  const overdueByAge = getOverdueByAge(period, filter);
  const paymentMethods = getPaymentMethods(period, filter);

  const sortedTable = [...getLandlordTable(period, filter)].sort((a, b) => {
    const aVal = a[sortCol];
    const bVal = b[sortCol];
    if (typeof aVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal);
    }
    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const overdueTotal = overdueByAge.reduce((s, b) => s + b.amount, 0);

  const overdueBarColors: Record<string, string> = {
    "0 to 30 days":  "#5B6475",
    "31 to 60 days": "#EA5B25",
    "61 to 90 days": "#C0392B",
    "90+ days":      "#0E1330",
  };

  const pmBarColors: Record<string, string> = {
    "Bank transfer": "#EA5B25",
    "Card":          "#C9CED8",
    "Cash":          "#E6E8EE",
  };

  function sortIndicator(col: keyof LandlordRow) {
    if (sortCol !== col) return null;
    return (
      <span style={{ color: "#EA5B25", marginLeft: 4 }}>
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  const thStyle: React.CSSProperties = {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#5B6475",
    backgroundColor: "#F6F7F9",
    borderBottom: "1px solid #E6E8EE",
    padding: "10px 16px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
  };

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
          title="Rent and Payments"
          subtitle="Collection performance and payment arrears"
        />

        {/* ── Row 1: 4 stat cards ────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
          }}
        >
          <StatCard
            label="Rent collected"
            value={fmtCompact(stats.collected)}
            delta={stats.collectedDelta}
            deltaMode="positive-good"
          />
          <StatCard
            label="Rent expected"
            value={fmtCompact(stats.expected)}
            delta={stats.expectedDelta}
            deltaMode="neutral"
          />
          <StatCard
            label="Collection rate"
            value={fmtPct(stats.collectionRate)}
            delta={stats.rateDelta}
            deltaMode="pp"
          />
          <StatCard
            label="Total overdue"
            value={fmtCompact(stats.totalOverdue)}
            delta={stats.overdueDelta}
            deltaMode="negative-good"
          />
        </div>

        {/* ── Collected vs Expected chart ───────────────────────────────────── */}
        <div style={{ marginTop: 48 }}>
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #E6E8EE",
              borderRadius: 16,
              padding: 28,
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>
                Collected vs expected
              </div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>
                Rent per period
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid
                  vertical={false}
                  stroke="#EDEEF1"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#5B6475" }}
                />
                <YAxis
                  tickFormatter={(v: number) => fmtCompact(v)}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#5B6475" }}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #E6E8EE",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [fmtCompact(value)]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="collected"
                  name="Collected"
                  stroke="#EA5B25"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expected"
                  name="Expected"
                  stroke="#C9CED8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Two side-by-side cards ─────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 48,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          {/* Card A: Overdue by age */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #E6E8EE",
              borderRadius: 16,
              padding: 28,
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1330" }}>
                Overdue by age
              </div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>
                Outstanding rent by days overdue
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {overdueByAge.map((bucket) => {
                const widthPct =
                  overdueTotal > 0 ? (bucket.amount / overdueTotal) * 100 : 0;
                const barColor =
                  overdueBarColors[bucket.label] ?? "#5B6475";
                return (
                  <div key={bucket.label}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 13, color: "#0E1330", fontWeight: 500 }}>
                        {bucket.label}
                      </span>
                      <span style={{ fontSize: 12, color: "#5B6475" }}>
                        {fmtCompact(bucket.amount)}{" "}
                        <span style={{ color: "#5B6475" }}>
                          · {bucket.count} tenants
                        </span>
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        backgroundColor: "#EDEEF1",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${widthPct}%`,
                          backgroundColor: barColor,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card B: Payment methods */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #E6E8EE",
              borderRadius: 16,
              padding: 28,
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1330" }}>
                Payment methods
              </div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>
                How tenants are paying rent
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {paymentMethods.map((pm) => {
                const barColor = pmBarColors[pm.method] ?? "#C9CED8";
                return (
                  <div key={pm.method}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 13, color: "#0E1330", fontWeight: 500 }}>
                        {pm.method}
                      </span>
                      <span style={{ fontSize: 12, color: "#5B6475", fontWeight: 600 }}>
                        {pm.pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        backgroundColor: "#EDEEF1",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pm.pct}%`,
                          backgroundColor: barColor,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: "#5B6475", marginTop: 4 }}>
                      {fmtNum(pm.count)} transactions
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Landlords by collection rate table ───────────────────────────── */}
        <div style={{ marginTop: 48 }}>
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #E6E8EE",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* Section header */}
            <div
              style={{
                padding: "24px 28px 20px",
                borderBottom: "1px solid #E6E8EE",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>
                Landlords by collection rate
              </div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>
                Sorted by collection performance
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{ ...thStyle, textAlign: "left" }}
                      onClick={() => toggleSort("name")}
                    >
                      Landlord{sortIndicator("name")}
                    </th>
                    <th
                      style={{ ...thStyle, textAlign: "right" }}
                      onClick={() => toggleSort("properties")}
                    >
                      Properties{sortIndicator("properties")}
                    </th>
                    <th
                      style={{ ...thStyle, textAlign: "right" }}
                      onClick={() => toggleSort("expected")}
                    >
                      Expected{sortIndicator("expected")}
                    </th>
                    <th
                      style={{ ...thStyle, textAlign: "right" }}
                      onClick={() => toggleSort("collected")}
                    >
                      Collected{sortIndicator("collected")}
                    </th>
                    <th
                      style={{ ...thStyle, textAlign: "right" }}
                      onClick={() => toggleSort("rate")}
                    >
                      Rate{sortIndicator("rate")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTable.map((row, i) => {
                    const rateColor =
                      row.rate >= 95
                        ? "#1F7A4D"
                        : row.rate < 85
                        ? "#C0392B"
                        : "#0E1330";
                    return (
                      <tr
                        key={row.name}
                        style={{
                          borderTop: i > 0 ? "1px solid #F0F1F3" : undefined,
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
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 13,
                            color: "#0E1330",
                            fontWeight: 500,
                          }}
                        >
                          {row.name}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 12,
                            color: "#5B6475",
                            textAlign: "right",
                          }}
                        >
                          {row.properties}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 12,
                            color: "#5B6475",
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {fmtCompact(row.expected)}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 12,
                            color: "#0E1330",
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {fmtCompact(row.collected)}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: rateColor,
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {row.rate.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
