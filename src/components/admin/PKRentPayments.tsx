"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
} from "recharts";
import {
  getPeriod, getAccountType, subscribeToAnalyticsFilters,
} from "@/lib/analyticsDateStore";
import {
  getRentPageStats, getRentSeries, getOverdueByAge,
  fmtCompact, fmtPct,
} from "@/lib/analytics-mock";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";

// ── Filter hook ────────────────────────────────────────────────────────────────

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
    color = value <= 0 ? "#1F7A4D" : "#C0392B";
  }
  const label = mode === "pp"
    ? `${value >= 0 ? "+" : ""}${value}pp`
    : `${value >= 0 ? "+" : ""}${value}%`;
  return <span style={{ fontSize: 12, fontWeight: 500, color }}>{label}</span>;
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, delta, deltaMode }: {
  label: string; value: string; delta: number; deltaMode: DeltaMode;
}) {
  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, padding: 28 }}>
      <div style={{ fontSize: 12, color: "#5B6475", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#0E1330", fontVariantNumeric: "tabular-nums", lineHeight: 1.1, marginBottom: 6 }}>
        {value}
      </div>
      <DeltaBadge value={delta} mode={deltaMode} />
    </div>
  );
}

// ── Bar chart custom tooltip ───────────────────────────────────────────────────

function RentBarTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const collected = payload.find((p) => p.dataKey === "collected")?.value ?? 0;
  const gap       = payload.find((p) => p.dataKey === "gap")?.value ?? 0;
  const expected  = collected + gap;
  const rate      = expected > 0 ? ((collected / expected) * 100).toFixed(1) : "0.0";
  return (
    <div style={{
      backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 8,
      padding: "10px 14px", fontSize: 12,
      fontFamily: "var(--font-inter), Inter, sans-serif",
    }}>
      <div style={{ fontWeight: 600, color: "#0E1330", marginBottom: 6 }}>{label}</div>
      <div style={{ color: "#EA5B25", marginBottom: 2 }}>Collected: {fmtCompact(collected)}</div>
      <div style={{ color: "#5B6475", marginBottom: 2 }}>Expected: {fmtCompact(expected)}</div>
      <div style={{ color: "#C0392B", marginBottom: 4 }}>Shortfall: {fmtCompact(gap)}</div>
      <div style={{ color: "#0E1330", fontWeight: 500 }}>Rate: {rate}%</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PKRentPayments() {
  const { period, filter } = useAnalyticsFilters();

  const stats       = getRentPageStats(period, filter);
  const series      = getRentSeries(period, filter);
  const overdueByAge = getOverdueByAge(period, filter);

  const chartData = series.map((d) => ({
    label:     d.label,
    collected: d.collected,
    gap:       Math.max(0, d.expected - d.collected),
    rate:      d.expected > 0
      ? parseFloat(((d.collected / d.expected) * 100).toFixed(1))
      : 0,
  }));

  const overdueTotal = overdueByAge.reduce((s, b) => s + b.amount, 0);

  const chartMinWidth = Math.max(520, series.length * 68);

  return (
    <div style={{ backgroundColor: "#F6F7F9", minHeight: "100%", padding: "40px", fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <PKAnalyticsHeader title="Rent and Payments" subtitle="Collection performance and payment arrears" />

        {/* Row 1: 4 stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          <StatCard label="Rent collected"  value={fmtCompact(stats.collected)}              delta={stats.collectedDelta} deltaMode="positive-good" />
          <StatCard label="Rent expected"   value={fmtCompact(stats.expected)}               delta={stats.expectedDelta}  deltaMode="neutral" />
          <StatCard label="Collection rate" value={fmtPct(stats.collectionRate)}             delta={stats.rateDelta}      deltaMode="pp" />
          <StatCard label="Total overdue"   value={fmtCompact(stats.totalOverdue)}           delta={stats.overdueDelta}   deltaMode="negative-good" />
        </div>

        {/* Bar chart: Rent collected */}
        <div style={{ marginTop: 48 }}>
          <div style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, padding: 28 }}>

            {/* Card header row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>Rent collected</div>
                <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>Against what was expected each period</div>
              </div>
              {/* Legend */}
              <div style={{ display: "flex", gap: 16, flexShrink: 0, marginLeft: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#EA5B25" }} />
                  <span style={{ fontSize: 12, color: "#5B6475" }}>Collected</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#E6E8EE" }} />
                  <span style={{ fontSize: 12, color: "#5B6475" }}>Expected</span>
                </div>
              </div>
            </div>

            {/* Horizontally scrollable on mobile */}
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: chartMinWidth }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={chartData}
                    barCategoryGap="55%"
                    margin={{ top: 24, right: 8, bottom: 0, left: 8 }}
                  >
                    <CartesianGrid vertical={false} stroke="#EDEEF1" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#5B6475" }}
                      dy={6}
                    />
                    <YAxis
                      tickFormatter={(v: number) => fmtCompact(v)}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#5B6475" }}
                      width={56}
                      tickCount={5}
                    />
                    <Tooltip content={<RentBarTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                    <Bar dataKey="collected" stackId="a" fill="#EA5B25" isAnimationActive={false} />
                    <Bar dataKey="gap" stackId="a" fill="#E6E8EE" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      <LabelList
                        dataKey="rate"
                        position="top"
                        style={{ fontSize: 10, fill: "#5B6475" }}
                        formatter={(v: unknown) => `${v}%`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Overdue by age: full width */}
        <div style={{ marginTop: 48 }}>
          <div style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, padding: 28 }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>Overdue by age</div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>
                Share of total overdue rent by how long it has been unpaid
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {overdueByAge.map((bucket, idx) => {
                const sharePct  = overdueTotal > 0 ? (bucket.amount / overdueTotal) * 100 : 0;
                const isLast    = idx === overdueByAge.length - 1;
                const barColor  = isLast ? "#C0392B" : "#EA5B25";
                return (
                  <div key={bucket.label} style={{ display: "grid", gridTemplateColumns: "180px 1fr 160px", alignItems: "center", gap: 20 }}>

                    {/* Left: label + count */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0E1330" }}>{bucket.label}</div>
                      <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>{bucket.count} tenants</div>
                    </div>

                    {/* Middle: bar track */}
                    <div style={{ height: 6, backgroundColor: "#EDEEF1", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.max(sharePct, 1)}%`,
                        backgroundColor: barColor,
                        borderRadius: 3,
                      }} />
                    </div>

                    {/* Right: amount + share */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0E1330" }}>{fmtCompact(bucket.amount)}</div>
                      <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>
                        {sharePct.toFixed(1)}% of overdue
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
