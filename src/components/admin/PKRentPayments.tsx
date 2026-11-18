"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  getUpcomingRentDue, getPaymentTiming, getOldestUnpaid, getRentByLocation,
  getRecoveredAfterReminders, getTenantCreditScores, getCreditScoreDistribution,
  type UpcomingWeekRow, type UpcomingDueTenant,
  type UnpaidAccountRow,
  type RentByLocationRow,
  type RecoveryTrendPoint,
  type TenantCreditScore, type CreditScoreBand,
  type TenantPaymentRecord,
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

// ── Recovered mini bar tooltip ─────────────────────────────────────────────────

function RecoveryTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 8,
      padding: "8px 12px", fontSize: 12,
      fontFamily: "var(--font-inter), Inter, sans-serif",
    }}>
      <div style={{ fontWeight: 600, color: "#0E1330", marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#EA5B25" }}>{fmtCompact(payload[0].value)}</div>
    </div>
  );
}

// ── Band color lookup ─────────────────────────────────────────────────────────

const BAND_COLOR: Record<CreditScoreBand, string> = {
  "Excellent": "#1F7A4D",
  "Good":      "#3D8A5E",
  "Fair":      "#EA5B25",
  "Poor":      "#C0392B",
  "Very poor": "#8B0000",
};

// ── Score band chip ───────────────────────────────────────────────────────────

function BandChip({ band }: { band: CreditScoreBand }) {
  const color = BAND_COLOR[band];
  return (
    <span style={{
      display: "inline-block",
      fontSize: 11,
      fontWeight: 600,
      color,
      border: `1px solid ${color}`,
      borderRadius: 4,
      padding: "1px 6px",
      lineHeight: 1.5,
      whiteSpace: "nowrap",
    }}>
      {band}
    </span>
  );
}

// ── Upcoming drawer ───────────────────────────────────────────────────────────

function UpcomingDrawer({ soonest, onClose }: { soonest: UpcomingDueTenant[]; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  const drawer = (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label="Tenants due soonest"
    >
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(14,19,48,0.35)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 1,
        width: "min(480px, 100vw)",
        height: "100%",
        backgroundColor: "#fff",
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.12)",
        fontFamily: "var(--font-inter), Inter, sans-serif",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #E6E8EE" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0E1330" }}>Tenants due soonest</div>
          <button
            ref={closeRef}
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#5B6475", fontSize: 18, lineHeight: 1 }}
            aria-label="Close"
          >
            x
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Tenant", "Property", "Amount", "Due date"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "#5B6475", borderBottom: "1px solid #E6E8EE", whiteSpace: "nowrap", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {soonest.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid #EDEEF1" }}>
                  <td style={{ padding: "12px 16px", color: "#0E1330", fontWeight: 500 }}>{t.name}</td>
                  <td style={{ padding: "12px 16px", color: "#5B6475" }}>{t.property}</td>
                  <td style={{ padding: "12px 16px", color: "#0E1330", fontVariantNumeric: "tabular-nums" }}>{fmtCompact(t.amount)}</td>
                  <td style={{ padding: "12px 16px", color: "#5B6475", whiteSpace: "nowrap" }}>{t.dueDate}</td>
                </tr>
              ))}
              {soonest.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "24px 16px", textAlign: "center", color: "#5B6475" }}>No upcoming tenants</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
}

// ── Tenant drawer ─────────────────────────────────────────────────────────────

function TenantDrawer({ tenant, onClose }: { tenant: TenantCreditScore | null; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted || !tenant) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [mounted, tenant, onClose]);

  if (!mounted || !tenant) return null;

  const scoreBreakdown = [
    { label: "Payment history", pts: tenant.paymentHistoryPts, max: 275 },
    { label: "Lateness",        pts: tenant.latenessPts,       max: 110 },
    { label: "Current arrears", pts: tenant.arrearsPts,        max: 110 },
    { label: "Consistency",     pts: tenant.consistencyPts,    max: 55  },
  ];

  const changeColor = tenant.change3m > 0 ? "#1F7A4D" : tenant.change3m < 0 ? "#C0392B" : "#5B6475";
  const changeLabel = tenant.change3m > 0 ? `+${tenant.change3m}` : `${tenant.change3m}`;

  const drawer = (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label={`Tenant profile: ${tenant.name}`}
    >
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(14,19,48,0.35)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 1,
        width: "min(480px, 100vw)",
        height: "100%",
        backgroundColor: "#fff",
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.12)",
        fontFamily: "var(--font-inter), Inter, sans-serif",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #E6E8EE", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0E1330" }}>{tenant.name}</div>
            <div style={{ fontSize: 13, color: "#5B6475", marginTop: 2 }}>{tenant.property}</div>
            <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>{tenant.landlord}</div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#5B6475", fontSize: 18, lineHeight: 1, flexShrink: 0 }}
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Score */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: BAND_COLOR[tenant.band], lineHeight: 1 }}>{tenant.score}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: BAND_COLOR[tenant.band] }}>{tenant.band}</div>
              <div style={{ fontSize: 12, color: changeColor, marginTop: 2 }}>{changeLabel} pts (3 months)</div>
            </div>
          </div>

          {/* Score breakdown */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0E1330", marginBottom: 12 }}>Score breakdown</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {scoreBreakdown.map((item) => (
                <div key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#5B6475" }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: "#0E1330", fontWeight: 500 }}>{item.pts}pts / {item.max}pts max</span>
                  </div>
                  <div style={{ height: 4, backgroundColor: "#EDEEF1", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(item.pts / item.max) * 100}%`, backgroundColor: "#EA5B25", borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment summary */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0E1330", marginBottom: 12 }}>Payment summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "On-time rate",       value: `${tenant.onTimeRate}%` },
                { label: "Avg days late",       value: `${tenant.avgDaysLate} days` },
                { label: "Balance owed",        value: fmtCompact(tenant.balanceOwed) },
                { label: "Payments tracked",    value: `${tenant.paymentsCount}` },
              ].map((item) => (
                <div key={item.label} style={{ padding: "12px 14px", backgroundColor: "#F6F7F9", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#5B6475", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Last 12 payments */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0E1330", marginBottom: 12 }}>Last 12 payments</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["Month", "Due date", "Paid date", "Status"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600, color: "#5B6475", borderBottom: "1px solid #E6E8EE", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenant.payments.map((p: TenantPaymentRecord) => {
                    let statusLabel: string;
                    let statusColor: string;
                    if (!p.paidDate) {
                      statusLabel = "Unpaid";
                      statusColor = "#C0392B";
                    } else {
                      const due  = new Date(p.dueDate  + "T12:00:00Z");
                      const paid = new Date(p.paidDate + "T12:00:00Z");
                      const dl   = Math.max(0, Math.round((paid.getTime() - due.getTime()) / 86_400_000));
                      if (dl === 0) { statusLabel = "On time"; statusColor = "#1F7A4D"; }
                      else { statusLabel = `${dl} days late`; statusColor = "#C0392B"; }
                    }
                    return (
                      <tr key={p.month} style={{ borderBottom: "1px solid #EDEEF1" }}>
                        <td style={{ padding: "8px 10px", color: "#0E1330" }}>{p.month}</td>
                        <td style={{ padding: "8px 10px", color: "#5B6475", whiteSpace: "nowrap" }}>{p.dueDate}</td>
                        <td style={{ padding: "8px 10px", color: "#5B6475", whiteSpace: "nowrap" }}>{p.paidDate ?? "-"}</td>
                        <td style={{ padding: "8px 10px", color: statusColor, fontWeight: 500 }}>{statusLabel}</td>
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

  return createPortal(drawer, document.body);
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PKRentPayments() {
  const { period, filter } = useAnalyticsFilters();

  // Existing data
  const stats        = getRentPageStats(period, filter);
  const series       = getRentSeries(period, filter);
  const overdueByAge = getOverdueByAge(period, filter);

  // New data
  const upcoming    = getUpcomingRentDue(filter);
  const timing      = getPaymentTiming(period, filter);
  const oldestUnpaid = getOldestUnpaid(filter);
  const byLocation  = getRentByLocation(period, filter);
  const recovered   = getRecoveredAfterReminders(period, filter);
  const creditDist  = getCreditScoreDistribution(filter);
  const allScores   = getTenantCreditScores(filter);

  // Chart data
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

  // Upcoming drawer state
  const [upcomingOpen, setUpcomingOpen] = useState(false);

  // Tenant drawer state (shared by oldest unpaid + credit scores)
  const [activeTenant, setActiveTenant] = useState<TenantCreditScore | null>(null);

  // Oldest unpaid sort
  const [unpaidSortCol, setUnpaidSortCol] = useState<"daysOverdue" | "amountOverdue">("daysOverdue");
  const [unpaidSortDir, setUnpaidSortDir] = useState<"asc" | "desc">("desc");

  function toggleUnpaidSort(col: "daysOverdue" | "amountOverdue") {
    if (unpaidSortCol === col) setUnpaidSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setUnpaidSortCol(col); setUnpaidSortDir("desc"); }
  }

  const sortedUnpaid = [...oldestUnpaid].sort((a, b) => {
    const mult = unpaidSortDir === "asc" ? 1 : -1;
    if (unpaidSortCol === "daysOverdue") return (a.daysOverdue - b.daysOverdue) * mult;
    return (a.amountOverdue - b.amountOverdue) * mult;
  });

  // Credit score section state
  const [scoreFilter, setScoreFilter] = useState<"All" | CreditScoreBand>("All");
  const [scoreSearch, setScoreSearch] = useState("");
  const [scoreSortCol, setScoreSortCol] = useState<"name" | "property" | "score" | "change3m">("score");
  const [scoreSortDir, setScoreSortDir] = useState<"asc" | "desc">("asc");
  const [scorePage, setScorePage] = useState(1);
  const scoreTableRef = useRef<HTMLDivElement>(null);

  const SCORE_PAGE_SIZE = 10;

  const scoreFilteredAll = allScores
    .filter((s) => scoreFilter === "All" || s.band === scoreFilter)
    .filter((s) => {
      if (!scoreSearch) return true;
      const q = scoreSearch.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.property.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const mult = scoreSortDir === "asc" ? 1 : -1;
      if (scoreSortCol === "name")     return a.name.localeCompare(b.name) * mult;
      if (scoreSortCol === "property") return a.property.localeCompare(b.property) * mult;
      if (scoreSortCol === "change3m") return (a.change3m - b.change3m) * mult;
      return (a.score - b.score) * mult;
    });

  const totalScorePages = Math.max(1, Math.ceil(scoreFilteredAll.length / SCORE_PAGE_SIZE));
  const currentScorePage = Math.min(scorePage, totalScorePages);
  const scorePageRows = scoreFilteredAll.slice(
    (currentScorePage - 1) * SCORE_PAGE_SIZE,
    currentScorePage * SCORE_PAGE_SIZE,
  );

  function toggleScoreSort(col: typeof scoreSortCol) {
    if (scoreSortCol === col) setScoreSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setScoreSortCol(col); setScoreSortDir("asc"); }
  }

  function handleViewHighest() {
    setScoreFilter("Excellent");
    setScorePage(1);
    scoreTableRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleViewLowest() {
    setScoreFilter("Very poor");
    setScorePage(1);
    scoreTableRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // Open tenant drawer: find the matching TenantCreditScore by id
  function openTenantDrawer(id: string) {
    const t = allScores.find((s) => s.id === id);
    if (t) setActiveTenant(t);
  }

  // Upcoming weeks max for bar width calc
  const maxWeekAmount = Math.max(...upcoming.weeks.map((w: UpcomingWeekRow) => w.amount), 1);

  // Payment timing total pct must add to ~100 for bar widths
  const timingTotal = timing.early.pct + timing.onTime.pct + timing.late.pct || 100;

  // Score badges for filter tabs
  const SCORE_BANDS: Array<"All" | CreditScoreBand> = ["All", "Excellent", "Good", "Fair", "Poor", "Very poor"];

  // Highest / lowest 5 scores
  const sortedByScoreDesc = [...allScores].sort((a, b) => b.score - a.score);
  const highest5 = sortedByScoreDesc.slice(0, 5);
  const lowest5  = [...allScores].sort((a, b) => a.score - b.score).slice(0, 5);

  // Sort indicator helper
  function sortIndicator(col: string, activeCol: string, dir: "asc" | "desc") {
    if (col !== activeCol) return <span style={{ color: "#C9CED8", marginLeft: 4 }}>+</span>;
    return <span style={{ color: "#EA5B25", marginLeft: 4 }}>{dir === "asc" ? "^" : "v"}</span>;
  }

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

        {/* Section A+B: Upcoming rent due + Payment timing */}
        <div
          className="grid-cols-1 md:grid-cols-2"
          style={{ display: "grid", gap: 20, marginTop: 48 }}
        >
          {/* Section A: Upcoming rent due */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>Upcoming rent due</div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>Rent expected over the next 30 days</div>
            </div>

            {/* Large figure */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0E1330", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                {fmtCompact(upcoming.total)}
              </div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 4 }}>from {upcoming.tenancyCount.toLocaleString()} tenancies</div>
            </div>

            {/* Week rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              {upcoming.weeks.map((week: UpcomingWeekRow) => {
                const barPct = (week.amount / maxWeekAmount) * 100;
                return (
                  <div key={week.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0E1330" }}>{week.label}</span>
                        <span style={{ fontSize: 12, color: "#5B6475", marginLeft: 8 }}>{week.dateRange}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0E1330", fontVariantNumeric: "tabular-nums" }}>{fmtCompact(week.amount)}</span>
                        <span style={{ fontSize: 11, color: "#5B6475", marginLeft: 6 }}>{week.count} tenancies</span>
                      </div>
                    </div>
                    <div style={{ height: 4, backgroundColor: "#EDEEF1", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${barPct}%`, backgroundColor: "#EA5B25", borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setUpcomingOpen(true)}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#EA5B25", textDecoration: "underline", fontFamily: "var(--font-inter), Inter, sans-serif" }}
            >
              View tenants due soonest
            </button>
          </div>

          {/* Section B: Payment timing */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>Payment timing</div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>When tenants pay relative to the due date</div>
            </div>

            {/* Split bar */}
            <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ width: `${(timing.early.pct / timingTotal) * 100}%`, backgroundColor: "#6DAE87" }} />
              <div style={{ width: `${(timing.onTime.pct / timingTotal) * 100}%`, backgroundColor: "#C9CED8" }} />
              <div style={{ width: `${(timing.late.pct / timingTotal) * 100}%`, backgroundColor: "#C9856A" }} />
            </div>

            {/* Legend row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
              {[
                { label: "Paid early",         pct: timing.early.pct,   count: timing.early.count,  color: "#6DAE87" },
                { label: "Paid on the due date", pct: timing.onTime.pct, count: timing.onTime.count, color: "#C9CED8" },
                { label: "Paid late",           pct: timing.late.pct,   count: timing.late.count,   color: "#C9856A" },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "#5B6475" }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0E1330" }}>{item.pct}%</div>
                  <div style={{ fontSize: 11, color: "#5B6475" }}>{item.count.toLocaleString()} payments</div>
                </div>
              ))}
            </div>

            {/* Plain figures */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "#5B6475", marginBottom: 2 }}>Average days to pay</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>
                  {timing.avgDaysAfterDue >= 0
                    ? `${timing.avgDaysAfterDue.toFixed(1)} days late`
                    : `${Math.abs(timing.avgDaysAfterDue).toFixed(1)} days early`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#5B6475", marginBottom: 2 }}>Average days late</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>
                  {timing.avgDaysLateOnly.toFixed(1)} days
                </div>
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

        {/* Section C: Oldest unpaid accounts */}
        <div style={{ marginTop: 48 }}>
          <div style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>Oldest unpaid accounts</div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>Tenants with the longest overdue rent</div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#5B6475", borderBottom: "1px solid #E6E8EE", whiteSpace: "nowrap", fontSize: 12 }}>Tenant</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#5B6475", borderBottom: "1px solid #E6E8EE", whiteSpace: "nowrap", fontSize: 12 }}>Property</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#5B6475", borderBottom: "1px solid #E6E8EE", whiteSpace: "nowrap", fontSize: 12 }}>Landlord</th>
                    <th
                      tabIndex={0}
                      role="button"
                      onClick={() => toggleUnpaidSort("amountOverdue")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleUnpaidSort("amountOverdue"); }}
                      style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#5B6475", borderBottom: "1px solid #E6E8EE", whiteSpace: "nowrap", fontSize: 12, cursor: "pointer", userSelect: "none" }}
                    >
                      Amount overdue{sortIndicator("amountOverdue", unpaidSortCol, unpaidSortDir)}
                    </th>
                    <th
                      tabIndex={0}
                      role="button"
                      onClick={() => toggleUnpaidSort("daysOverdue")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleUnpaidSort("daysOverdue"); }}
                      style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#5B6475", borderBottom: "1px solid #E6E8EE", whiteSpace: "nowrap", fontSize: 12, cursor: "pointer", userSelect: "none" }}
                    >
                      Days overdue{sortIndicator("daysOverdue", unpaidSortCol, unpaidSortDir)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUnpaid.map((row: UnpaidAccountRow) => {
                    const daysColor = row.daysOverdue > 90 ? "#C0392B" : "#0E1330";
                    return (
                      <tr
                        key={row.id}
                        tabIndex={0}
                        role="button"
                        onClick={() => openTenantDrawer(row.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openTenantDrawer(row.id); }}
                        style={{ borderBottom: "1px solid #EDEEF1", cursor: "pointer" }}
                      >
                        <td style={{ padding: "12px 12px", color: "#0E1330", fontWeight: 500 }}>{row.name}</td>
                        <td style={{ padding: "12px 12px", color: "#5B6475" }}>{row.property}</td>
                        <td style={{ padding: "12px 12px", color: "#5B6475" }}>{row.landlord}</td>
                        <td style={{ padding: "12px 12px", color: "#0E1330", fontVariantNumeric: "tabular-nums" }}>{fmtCompact(row.amountOverdue)}</td>
                        <td style={{ padding: "12px 12px", color: daysColor, fontWeight: row.daysOverdue > 90 ? 600 : 400 }}>{row.daysOverdue}</td>
                      </tr>
                    );
                  })}
                  {sortedUnpaid.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: "24px 12px", textAlign: "center", color: "#5B6475" }}>No overdue accounts</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section D+E: Rent by location + Recovered after reminders */}
        <div
          className="grid-cols-1 md:grid-cols-2"
          style={{ display: "grid", gap: 20, marginTop: 48 }}
        >
          {/* Section D: Rent by location */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>Rent by location</div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>Collection rate by area</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {byLocation.map((row: RentByLocationRow) => {
                const isBad = row.rate < 85;
                const barColor  = isBad ? "#C0392B" : "#EA5B25";
                const rateColor = isBad ? "#C0392B" : "#EA5B25";
                return (
                  <div key={row.location}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#0E1330" }}>{row.location}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: rateColor, fontVariantNumeric: "tabular-nums" }}>{row.rate.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 4, backgroundColor: "#EDEEF1", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                      <div style={{ height: "100%", width: `${row.rate}%`, backgroundColor: barColor, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#5B6475" }}>{fmtCompact(row.collected)} of {fmtCompact(row.expected)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section E: Recovered after reminders */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>Recovered after reminders</div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>Overdue rent paid within 7 days of a reminder</div>
            </div>

            {/* Large figure */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0E1330", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                {fmtCompact(recovered.totalRecovered)}
              </div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 4 }}>from {recovered.remindersCount.toLocaleString()} reminders</div>
            </div>

            {/* Two plain figures */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: "#5B6475", marginBottom: 2 }}>Recovery rate</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0E1330" }}>{recovered.recoveryRate}%</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#5B6475", marginBottom: 2 }}>Avg days to pay</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0E1330" }}>{recovered.avgDaysAfterReminder}</div>
              </div>
            </div>

            {/* Mini bar chart */}
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={recovered.trend as RecoveryTrendPoint[]}
                  margin={{ top: 8, right: 4, bottom: 4, left: 4 }}
                >
                  <CartesianGrid vertical={false} stroke="#EDEEF1" />
                  <Tooltip content={<RecoveryTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="recovered" fill="#EA5B25" isAnimationActive={false} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Section F: Tenant credit scores */}
        <div style={{ marginTop: 48 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#0E1330" }}>Tenant credit scores</div>
            <div style={{ fontSize: 13, color: "#5B6475", marginTop: 4 }}>An internal score based on each tenant&apos;s rent payment history in Lizt</div>
          </div>

          {/* F1: Score distribution */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, padding: 28, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 32, alignItems: "stretch" }}>
              {/* Left: average */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 140 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: "#0E1330", lineHeight: 1 }}>{creditDist.average}</div>
                <div style={{ fontSize: 13, color: "#5B6475", marginTop: 6 }}>average score</div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, backgroundColor: "#E6E8EE", alignSelf: "stretch" }} />

              {/* Right: bar + legend */}
              <div style={{ flex: 1 }}>
                {/* Split bar */}
                <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
                  {creditDist.bands.map((b) => (
                    <div key={b.band} style={{ width: `${b.pct}%`, backgroundColor: b.color }} />
                  ))}
                </div>
                {/* Legend items */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px" }}>
                  {creditDist.bands.map((b) => (
                    <div key={b.band} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: b.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#5B6475" }}>{b.band}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#0E1330" }}>{b.count}</span>
                      <span style={{ fontSize: 11, color: "#5B6475" }}>({b.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* F2: Highest + Lowest */}
          <div
            className="grid-cols-1 md:grid-cols-2"
            style={{ display: "grid", gap: 20, marginBottom: 20 }}
          >
            {/* Highest scores */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>Highest scores</div>
                </div>
                <button
                  onClick={handleViewHighest}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#EA5B25", textDecoration: "underline", fontFamily: "var(--font-inter), Inter, sans-serif", whiteSpace: "nowrap" }}
                >
                  View all
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {highest5.map((t, i) => (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "24px 1fr auto", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid #EDEEF1" : "none" }}>
                    <span style={{ fontSize: 12, color: "#5B6475", fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#0E1330" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "#5B6475", marginTop: 1 }}>{t.property}</div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: BAND_COLOR[t.band], fontVariantNumeric: "tabular-nums" }}>{t.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lowest scores */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>Lowest scores</div>
                </div>
                <button
                  onClick={handleViewLowest}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#EA5B25", textDecoration: "underline", fontFamily: "var(--font-inter), Inter, sans-serif", whiteSpace: "nowrap" }}
                >
                  View all
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {lowest5.map((t, i) => (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "24px 1fr auto auto", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 4 ? "1px solid #EDEEF1" : "none" }}>
                    <span style={{ fontSize: 12, color: "#5B6475", fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#0E1330" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "#5B6475", marginTop: 1 }}>{t.property}</div>
                    </div>
                    <BandChip band={t.band} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: BAND_COLOR[t.band], fontVariantNumeric: "tabular-nums" }}>{t.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* F3: Full table */}
          <div ref={scoreTableRef} id="credit-score-table" style={{ backgroundColor: "#fff", border: "1px solid #E6E8EE", borderRadius: 16, padding: 28 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330" }}>Tenant scores</div>
              <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>Full list of tenants and their current score</div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
              {SCORE_BANDS.map((band) => {
                const active = scoreFilter === band;
                return (
                  <button
                    key={band}
                    onClick={() => { setScoreFilter(band); setScorePage(1); }}
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      color: active ? "#0E1330" : "#5B6475",
                      backgroundColor: active ? "#fff" : "transparent",
                      border: active ? "1px solid #E6E8EE" : "1px solid transparent",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: "var(--font-inter), Inter, sans-serif",
                    }}
                  >
                    {band}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search tenant or property..."
                value={scoreSearch}
                onChange={(e) => { setScoreSearch(e.target.value); setScorePage(1); }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#0E1330",
                  border: "1px solid #E6E8EE",
                  borderRadius: 8,
                  outline: "none",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {[
                      { label: "Tenant",   col: "name"     as const },
                      { label: "Property", col: "property" as const },
                      { label: "Landlord", col: null },
                      { label: "Score",    col: "score"    as const },
                      { label: "Band",     col: null },
                      { label: "Change",   col: "change3m" as const },
                    ].map(({ label, col }) => (
                      <th
                        key={label}
                        tabIndex={col ? 0 : -1}
                        role={col ? "button" : undefined}
                        onClick={col ? () => toggleScoreSort(col) : undefined}
                        onKeyDown={col ? (e) => { if (e.key === "Enter" || e.key === " ") toggleScoreSort(col); } : undefined}
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          fontWeight: 600,
                          color: "#5B6475",
                          borderBottom: "1px solid #E6E8EE",
                          whiteSpace: "nowrap",
                          fontSize: 12,
                          cursor: col ? "pointer" : "default",
                          userSelect: col ? "none" : "auto",
                        }}
                      >
                        {label}{col ? sortIndicator(col, scoreSortCol, scoreSortDir) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scorePageRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "24px 12px", textAlign: "center", color: "#5B6475" }}>No tenants match your search</td>
                    </tr>
                  ) : scorePageRows.map((t: TenantCreditScore) => {
                    const changeColor = t.change3m > 0 ? "#1F7A4D" : t.change3m < 0 ? "#C0392B" : "#5B6475";
                    const changeLabel = t.change3m > 0 ? `+${t.change3m}` : `${t.change3m}`;
                    return (
                      <tr
                        key={t.id}
                        tabIndex={0}
                        role="button"
                        onClick={() => setActiveTenant(t)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveTenant(t); }}
                        style={{ borderBottom: "1px solid #EDEEF1", cursor: "pointer" }}
                      >
                        <td style={{ padding: "12px 12px", color: "#0E1330", fontWeight: 500 }}>{t.name}</td>
                        <td style={{ padding: "12px 12px", color: "#5B6475" }}>{t.property}</td>
                        <td style={{ padding: "12px 12px", color: "#5B6475" }}>{t.landlord}</td>
                        <td style={{ padding: "12px 12px", color: BAND_COLOR[t.band], fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{t.score}</td>
                        <td style={{ padding: "12px 12px" }}><BandChip band={t.band} /></td>
                        <td style={{ padding: "12px 12px", color: changeColor, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{changeLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 12, color: "#5B6475" }}>
                {scoreFilteredAll.length === 0
                  ? "No results"
                  : `Showing ${((currentScorePage - 1) * SCORE_PAGE_SIZE) + 1} to ${Math.min(currentScorePage * SCORE_PAGE_SIZE, scoreFilteredAll.length)} of ${scoreFilteredAll.length}`}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setScorePage((p) => Math.max(1, p - 1))}
                  disabled={currentScorePage <= 1}
                  style={{
                    padding: "6px 14px",
                    fontSize: 12,
                    border: "1px solid #E6E8EE",
                    borderRadius: 6,
                    backgroundColor: "#fff",
                    color: currentScorePage <= 1 ? "#C9CED8" : "#0E1330",
                    cursor: currentScorePage <= 1 ? "default" : "pointer",
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                  }}
                >
                  Prev
                </button>
                <button
                  onClick={() => setScorePage((p) => Math.min(totalScorePages, p + 1))}
                  disabled={currentScorePage >= totalScorePages}
                  style={{
                    padding: "6px 14px",
                    fontSize: 12,
                    border: "1px solid #E6E8EE",
                    borderRadius: 6,
                    backgroundColor: "#fff",
                    color: currentScorePage >= totalScorePages ? "#C9CED8" : "#0E1330",
                    cursor: currentScorePage >= totalScorePages ? "default" : "pointer",
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                  }}
                >
                  Next
                </button>
              </div>
            </div>

            {/* Footnote */}
            <div style={{ marginTop: 16, fontSize: 11, color: "#5B6475" }}>
              This is a Lizt rent payment score, not a credit bureau score.
            </div>
          </div>
        </div>

      </div>

      {/* Drawers */}
      {upcomingOpen && (
        <UpcomingDrawer soonest={upcoming.soonest} onClose={() => setUpcomingOpen(false)} />
      )}
      <TenantDrawer tenant={activeTenant} onClose={() => setActiveTenant(null)} />
    </div>
  );
}
