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
  getCommsPageStats, getRemindersSeries,
  getRemindersByChannel, getReminderOutcomes,
  fmtNum, fmtPct,
} from "@/lib/analytics-mock";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  deltaLabel: string;
  deltaGood: boolean;
}

function StatCard({ label, value, deltaLabel, deltaGood }: StatCardProps) {
  const color = deltaGood ? "#1F7A4D" : "#C0392B";
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
          lineHeight: 1.1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color }}>{deltaLabel}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PKCommunications() {
  const [, tick] = useState(0);
  useEffect(() => subscribeToAnalyticsFilters(() => tick((n) => n + 1)), []);

  const period = getPeriod();
  const filter = getAccountType();

  const stats    = getCommsPageStats(period, filter);
  const series   = getRemindersSeries(period, filter);
  const channels = getRemindersByChannel(period, filter);
  const outcomes = getReminderOutcomes(period, filter);

  // Y-axis domain derived from series data
  const counts = series.map((d) => d.count);
  const minVal = Math.min(...counts);
  const maxVal = Math.max(...counts);
  const yMin   = Math.round(minVal * 0.9);
  const yMax   = Math.round(maxVal * 1.05);

  // Channel bar color map
  const channelColor: Record<string, string> = {
    WhatsApp: "#1F7A4D",
    SMS:      "#EA5B25",
    Email:    "#5B6475",
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
          title="Communications"
          subtitle="Reminder delivery, channel reach and payment outcomes"
        />

        {/* ── Row 1: 4 stat cards ────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(1, 1fr)",
            gap: 20,
            marginTop: 32,
          }}
          className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
          <style>{`
            @media (min-width: 640px)  { .pk-comms-stats { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (min-width: 1024px) { .pk-comms-stats { grid-template-columns: repeat(4, 1fr) !important; } }
          `}</style>
          <div
            className="pk-comms-stats"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(1, 1fr)",
              gap: 20,
              gridColumn: "1 / -1",
            }}
          >
            {/* Reminders sent */}
            <StatCard
              label="Reminders sent"
              value={fmtNum(stats.remindersSent)}
              deltaLabel={`${stats.sentDelta >= 0 ? "+" : ""}${stats.sentDelta}%`}
              deltaGood={stats.sentDelta >= 0}
            />
            {/* Delivery rate */}
            <StatCard
              label="Delivery rate"
              value={fmtPct(stats.deliveryRate)}
              deltaLabel={`${stats.deliveryDelta >= 0 ? "+" : ""}${stats.deliveryDelta}pp`}
              deltaGood={stats.deliveryDelta >= 0}
            />
            {/* Tenants reached */}
            <StatCard
              label="Tenants reached"
              value={fmtNum(stats.tenantsReached)}
              deltaLabel={`${stats.reachedDelta >= 0 ? "+" : ""}${stats.reachedDelta}%`}
              deltaGood={stats.reachedDelta >= 0}
            />
            {/* Reminders per tenancy */}
            <StatCard
              label="Reminders per tenancy"
              value={`${stats.remindersPerTenancy}`}
              deltaLabel={`${stats.perTenancyDelta >= 0 ? "+" : ""}${stats.perTenancyDelta}`}
              deltaGood={stats.perTenancyDelta >= 0}
            />
          </div>
        </div>

        {/* ── Reminders sent over time ───────────────────────────────────── */}
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
                Reminders sent over time
              </div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 4 }}>
                Volume of reminders dispatched each period
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="" stroke="#EDEEF1" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#5B6475" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => fmtNum(v)}
                  domain={[yMin, yMax]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#5B6475" }}
                  width={52}
                />
                <Tooltip
                  formatter={(v: number) => [fmtNum(v), "Reminders"]}
                  contentStyle={{
                    border: "1px solid #E6E8EE",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#EA5B25"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Two cards: channels + outcomes ────────────────────────────── */}
        <div style={{ marginTop: 48 }}>
          <style>{`
            @media (min-width: 1024px) { .pk-comms-two { grid-template-columns: repeat(2, 1fr) !important; } }
          `}</style>
          <div
            className="pk-comms-two"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(1, 1fr)",
              gap: 20,
            }}
          >
            {/* Card A: Reminders by channel */}
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
                  Reminders by channel
                </div>
                <div style={{ fontSize: 12, color: "#5B6475", marginTop: 4 }}>
                  Breakdown by delivery channel
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {channels.map((ch) => (
                  <div key={ch.channel}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 13, color: "#0E1330" }}>{ch.channel}</span>
                      <span style={{ fontSize: 12, color: "#5B6475" }}>
                        {fmtNum(ch.count)} ({ch.pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        backgroundColor: "#EDEEF1",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${ch.pct}%`,
                          backgroundColor: channelColor[ch.channel] ?? "#5B6475",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card B: Reminder outcomes */}
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
                  Reminder outcomes
                </div>
                <div style={{ fontSize: 12, color: "#5B6475", marginTop: 4 }}>
                  Whether recipients paid after receiving a reminder
                </div>
              </div>

              {/* Large paid pct */}
              <div
                style={{ fontSize: 36, fontWeight: 700, color: "#1F7A4D", lineHeight: 1.1 }}
              >
                {fmtPct(outcomes.paidPct)}
              </div>
              <div style={{ fontSize: 13, color: "#5B6475", marginTop: 4 }}>
                paid after reminder
              </div>

              {/* Split bar */}
              <div
                style={{
                  display: "flex",
                  height: 12,
                  borderRadius: 6,
                  overflow: "hidden",
                  marginTop: 20,
                }}
              >
                <div
                  style={{
                    width: `${outcomes.paidPct}%`,
                    backgroundColor: "#1F7A4D",
                  }}
                />
                <div
                  style={{
                    width: `${outcomes.unpaidPct}%`,
                    backgroundColor: "#E6E8EE",
                  }}
                />
              </div>

              {/* Below bar labels */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: "#5B6475" }}>Paid</div>
                  <div style={{ fontSize: 12, color: "#0E1330", fontWeight: 500 }}>
                    {fmtNum(outcomes.paid)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#5B6475" }}>Still unpaid</div>
                  <div style={{ fontSize: 12, color: "#0E1330", fontWeight: 500 }}>
                    {fmtNum(outcomes.unpaid)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
