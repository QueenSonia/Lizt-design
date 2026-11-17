"use client";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { X, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  getPeriod, getAccountType, subscribeToAnalyticsFilters,
} from "@/lib/analyticsDateStore";
import {
  getOverviewStats, getTenancySeries, getRentSeries,
  getMaintenanceSeries, getRemindersSeries,
  fmtCompact, fmtNum,
  HIGHLIGHT_OVERDUE, HIGHLIGHT_VACANT, HIGHLIGHT_REOPENED,
} from "@/lib/analytics-mock";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";
import { useRouter } from "next/navigation";

// ── Y-axis auto-domain ────────────────────────────────────────────────────────

function autoDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 10];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.05, 1);
    return [min - pad, max + pad];
  }
  const range = max - min;
  const pad = range * 0.05;
  return [min - pad, max + pad];
}

// ── Trend modal ───────────────────────────────────────────────────────────────

type TrendChartPoint = { label: string; value: number };

interface TrendModalProps {
  title: string;
  data: TrendChartPoint[];
  isRent: boolean;
  onClose: () => void;
}

function TrendModal({ title, data, isRent, onClose }: TrendModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const values = data.map((d) => d.value);
  const [dMin, dMax] = autoDomain(values);

  useEffect(() => {
    const btn = dialogRef.current?.querySelector<HTMLElement>("button");
    btn?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trend-modal-title"
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={dialogRef}
        style={{
          position: "relative",
          zIndex: 10,
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          margin: "0 16px",
          padding: 28,
          fontFamily: "var(--font-inter), Inter, sans-serif",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <span
            id="trend-modal-title"
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#0E1330",
            }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#5B6475",
              marginLeft: 12,
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Chart */}
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EE" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#5B6475" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[dMin, dMax]}
                tickFormatter={(v: number) => isRent ? fmtCompact(v) : fmtNum(Math.round(v))}
                tick={{ fontSize: 9, fill: "#5B6475" }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                formatter={(v: number) => [
                  isRent ? fmtCompact(v) : fmtNum(Math.round(v)),
                  title,
                ]}
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 6,
                  border: "1px solid #E6E8EE",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                }}
                labelStyle={{ fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#EA5B25"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2, fill: "#EA5B25" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  onClick: () => void;
}

function StatCard({ label, value, subtitle, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E6E8EE",
        borderRadius: 16,
        padding: 28,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        fontFamily: "var(--font-inter), Inter, sans-serif",
        position: "relative",
      }}
    >
      {/* Top-right chevron */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          color: "#5B6475",
          display: "flex",
          alignItems: "center",
        }}
      >
        <ChevronRight size={14} />
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 12,
          color: "#5B6475",
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#0E1330",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>

      {/* Optional subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: 12,
            color: "#5B6475",
            marginTop: 6,
          }}
        >
          {subtitle}
        </div>
      )}
    </button>
  );
}

// ── Highlight card ─────────────────────────────────────────────────────────────

interface HighlightRow {
  name: string;
  figure: string;
}

interface HighlightCardProps {
  label: string;
  linkHref: string;
  topName: string;
  topFigure: string;
  topDetail: string;
  rows: HighlightRow[];
}

function HighlightCard({ label, linkHref, topName, topFigure, topDetail, rows }: HighlightCardProps) {
  const router = useRouter();

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E6E8EE",
        borderRadius: 16,
        padding: 28,
        fontFamily: "var(--font-inter), Inter, sans-serif",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#5B6475",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <span style={{ color: "#EA5B25", fontSize: 10 }}>★</span>{" "}
          {label}
        </span>
        <span
          onClick={() => router.push(linkHref)}
          style={{
            fontSize: 12,
            color: "#EA5B25",
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          View all
        </span>
      </div>

      {/* Top name */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#0E1330",
          marginTop: 10,
        }}
      >
        {topName}
      </div>

      {/* Key figure */}
      <div
        style={{
          fontSize: 13,
          color: "#0E1330",
          marginTop: 4,
        }}
      >
        {topFigure}
      </div>

      {/* Detail */}
      <div
        style={{
          fontSize: 12,
          color: "#5B6475",
          marginTop: 2,
        }}
      >
        {topDetail}
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid #E6E8EE",
          margin: "14px 0",
        }}
      />

      {/* Row list */}
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: i < rows.length - 1 ? 8 : 0,
          }}
        >
          <span style={{ fontSize: 12, color: "#0E1330" }}>{row.name}</span>
          <span style={{ fontSize: 12, color: "#5B6475" }}>{row.figure}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PKOverview() {
  const [, setFilterTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [openModal, setOpenModal] = useState<number | null>(null); // 0–5

  useEffect(() => subscribeToAnalyticsFilters(() => setFilterTick((n) => n + 1)), []);
  useEffect(() => { setMounted(true); }, []);

  const period = getPeriod();
  const filter = getAccountType();
  const stats = getOverviewStats(period, filter);

  const rentPct = ((stats.rentCollected / stats.rentExpected) * 100).toFixed(1);

  // Trend data per card index
  function getTrendData(index: number): { data: TrendChartPoint[]; isRent: boolean } {
    switch (index) {
      case 0: {
        const s = getTenancySeries(period, filter);
        return { data: s.map((d) => ({ label: d.label, value: d.total })), isRent: false };
      }
      case 1: {
        const s = getTenancySeries(period, filter);
        return { data: s.map((d) => ({ label: d.label, value: d.active })), isRent: false };
      }
      case 2: {
        const s = getTenancySeries(period, filter);
        return { data: s.map((d) => ({ label: d.label, value: d.vacant })), isRent: false };
      }
      case 3: {
        const s = getRentSeries(period, filter);
        return { data: s.map((d) => ({ label: d.label, value: d.collected })), isRent: true };
      }
      case 4: {
        const s = getMaintenanceSeries(period, filter);
        return { data: s.map((d) => ({ label: d.label, value: d.newRequests })), isRent: false };
      }
      case 5: {
        const s = getRemindersSeries(period, filter);
        return { data: s.map((d) => ({ label: d.label, value: d.count })), isRent: false };
      }
      default:
        return { data: [], isRent: false };
    }
  }

  const cardLabels = [
    "Total properties",
    "Active tenancies",
    "Vacant properties",
    "Rent collected",
    "Total maintenance requests",
    "Total reminders sent",
  ];

  const cards = [
    { label: "Total properties",          value: fmtNum(stats.totalProperties) },
    { label: "Active tenancies",           value: fmtNum(stats.activeTenancies) },
    { label: "Vacant properties",          value: fmtNum(stats.vacantProperties) },
    {
      label:    "Rent collected",
      value:    fmtCompact(stats.rentCollected),
      subtitle: `${rentPct}% of ${fmtCompact(stats.rentExpected)} expected`,
    },
    { label: "Total maintenance requests", value: fmtNum(stats.maintenanceTotal) },
    { label: "Total reminders sent",       value: fmtNum(stats.remindersSent) },
  ];

  const modalData = openModal !== null ? getTrendData(openModal) : null;

  return (
    <div
      style={{
        backgroundColor: "#F6F7F9",
        minHeight: "100%",
        padding: "40px 40px",
        fontFamily: "var(--font-inter), Inter, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <PKAnalyticsHeader
          title="Overview"
          subtitle="All properties, tenancies, rent and activity at a glance"
        />

        {/* Section 1: Six stat cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: 20 }}
        >
          {cards.map((card, i) => (
            <StatCard
              key={i}
              label={card.label}
              value={card.value}
              subtitle={card.subtitle}
              onClick={() => setOpenModal(i)}
            />
          ))}
        </div>

        {/* Section 2: Highlights */}
        <div style={{ marginTop: 48 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#0E1330",
            }}
          >
            Highlights
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#5B6475",
              marginTop: 4,
              marginBottom: 20,
            }}
          >
            The people and properties that need a look first
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ gap: 20 }}
          >
            {/* Most overdue tenancy */}
            <HighlightCard
              label="Most overdue tenancy"
              linkHref="/admin/rent-payments"
              topName={HIGHLIGHT_OVERDUE.top.name}
              topFigure={`${fmtCompact(HIGHLIGHT_OVERDUE.top.amount)} overdue for ${HIGHLIGHT_OVERDUE.top.days} days`}
              topDetail={HIGHLIGHT_OVERDUE.top.property}
              rows={HIGHLIGHT_OVERDUE.rows.map((r) => ({
                name: r.name,
                figure: `${fmtCompact(r.amount)}, ${r.days} days`,
              }))}
            />

            {/* Longest vacant property */}
            <HighlightCard
              label="Longest vacant"
              linkHref="/admin/occupancy"
              topName={HIGHLIGHT_VACANT.top.name}
              topFigure={`${HIGHLIGHT_VACANT.top.days} days vacant`}
              topDetail={HIGHLIGHT_VACANT.top.location}
              rows={HIGHLIGHT_VACANT.rows.map((r) => ({
                name: r.name,
                figure: `${r.days} days`,
              }))}
            />

            {/* Most reopened requests */}
            <HighlightCard
              label="Most reopened"
              linkHref="/admin/maintenance"
              topName={HIGHLIGHT_REOPENED.top.name}
              topFigure={`${HIGHLIGHT_REOPENED.top.reopened} reopened`}
              topDetail={`${HIGHLIGHT_REOPENED.top.avgH}h avg resolution`}
              rows={HIGHLIGHT_REOPENED.rows.map((r) => ({
                name: r.name,
                figure: `${r.reopened} reopened`,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Trend modal portal */}
      {mounted && openModal !== null && modalData &&
        createPortal(
          <TrendModal
            title={cardLabels[openModal]}
            data={modalData.data}
            isRent={modalData.isRent}
            onClose={() => setOpenModal(null)}
          />,
          document.body
        )
      }
    </div>
  );
}
