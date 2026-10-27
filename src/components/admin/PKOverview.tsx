"use client";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AreaChart, Area, CartesianGrid, LabelList, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ArrowDown, ArrowUp, BarChart2, Bell, Building2,
  Minus, Star, TrendingUp, Wallet, Wrench, X,
} from "lucide-react";
import {
  getAccountType, getPeriod, setPeriod,
  subscribeToAnalyticsFilters, PERIOD_LABELS,
  type Period,
} from "@/lib/analyticsDateStore";
import {
  FM_PERFORMANCE, LONGEST_VACANT_PROPERTIES, OVERDUE_TENANCIES,
  fmtCompact, fmtM,
  getMaintenanceChartSeries, getOverviewStats, getRemindersChartSeries,
  getRentChartSeries, getTenancyChartSeries,
  type CountPoint, type RentPoint, type TenancyPoint,
} from "./analyticsData";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded ${className}`} />;
}

function DeltaBadge({ value, goodWhenUp, goodWhenDown, neutral, fmt }: {
  value: number; goodWhenUp?: boolean; goodWhenDown?: boolean;
  neutral?: boolean; fmt?: () => string;
}) {
  const up = value > 0;
  const sign = value > 0 ? "+" : "";
  const display = fmt ? fmt() : `${sign}${value}`;
  let colorClass = "bg-slate-100 text-slate-600";
  if (!neutral && value !== 0) {
    const isGood = (goodWhenUp && up) || (goodWhenDown && !up);
    colorClass = isGood ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600";
  }
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  return (
    <span title="vs previous period"
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${colorClass}`}>
      <Icon className="size-2.5" />
      {display}
    </span>
  );
}

function autoDomain(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = Math.max(min * 0.05, 1);
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }
  const range = max - min;
  const pad = range * 0.18;
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}

function fmtCount(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toLocaleString();
}

interface TrendAreaChartProps<T extends Record<string, number | string>> {
  data: T[];
  primaryKey: keyof T;
  secondaryKey?: keyof T;
  primaryColor: string;
  secondaryColor?: string;
  loading: boolean;
  yFmt: (v: number) => string;
  tooltipLabel?: (key: string) => string;
  secondaryDashed?: boolean;
  showLegend?: boolean;
  height?: number;
}

function TrendAreaChart<T extends Record<string, number | string>>({
  data, primaryKey, secondaryKey, primaryColor, secondaryColor = "#CBD5E1",
  loading, yFmt, tooltipLabel, secondaryDashed = true, showLegend = false,
  height = 200,
}: TrendAreaChartProps<T>) {
  if (loading) return <div className="animate-pulse bg-slate-100 rounded w-full" style={{ height }} />;

  const pk = primaryKey as string;
  const sk = secondaryKey as string | undefined;
  const primaryVals = data.map((d) => d[pk] as number);
  const secondaryVals = sk ? data.map((d) => d[sk] as number) : [];
  const domain = autoDomain([...primaryVals, ...secondaryVals]);
  const lastIdx = data.length - 1;
  const gradId = `grad-${pk}`;
  const gradIdSec = `grad-sec-${sk ?? "none"}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 18, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={primaryColor} stopOpacity={0.18} />
            <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
          </linearGradient>
          {sk && (
            <linearGradient id={gradIdSec} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.08} />
              <stop offset="95%" stopColor={secondaryColor} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <YAxis domain={domain} tickFormatter={yFmt} tickCount={4}
          tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={50} />
        <Tooltip
          formatter={(v: number, name: string) => [yFmt(v), tooltipLabel ? tooltipLabel(name) : name]}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E2E8F0" }}
          labelStyle={{ fontSize: 11 }}
        />
        {showLegend && (
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            formatter={(name: string) => tooltipLabel ? tooltipLabel(name) : name} />
        )}
        {sk && (
          <Area type="monotone" dataKey={sk} stroke={secondaryColor} strokeWidth={1.5}
            strokeDasharray={secondaryDashed ? "5 4" : undefined}
            fill={`url(#${gradIdSec})`} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
        )}
        <Area type="monotone" dataKey={pk} stroke={primaryColor} strokeWidth={2}
          fill={`url(#${gradId})`} activeDot={{ r: 4, stroke: "white", strokeWidth: 2 }}
          dot={(props: any) => {
            const { cx, cy, index } = props as { cx: number; cy: number; index: number };
            if (index !== lastIdx) return <g key={index} />;
            return <circle key={index} cx={cx} cy={cy} r={4} fill={primaryColor} stroke="white" strokeWidth={2} />;
          }}
        >
          <LabelList dataKey={pk} content={(props: any) => {
            const { x, y, value, index } = props as { x: number; y: number; value: number; index: number };
            if (index !== lastIdx) return null;
            return (
              <text key="last-label" x={x + 1} y={y - 8} textAnchor="end"
                fontSize={10} fontWeight={600} fill="#64748B">
                {yFmt(value ?? 0)}
              </text>
            );
          }} />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Trend modal ───────────────────────────────────────────────────────────────

type ModalCardKey = "rent" | "active" | "vacant" | "maintenance" | "reminders" | "total";

interface TrendModalProps {
  title: string;
  subtitle: string;
  currentValue: string;
  prevValue: string;
  badge: ReactNode;
  period: Period;
  onClose: () => void;
  children: ReactNode;
}

function TrendModal({ title, subtitle, currentValue, prevValue, badge, period, onClose, children }: TrendModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dialogRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    el?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog" aria-modal="true" aria-labelledby="trend-modal-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="relative z-10 w-full sm:max-w-[900px] sm:mx-4 bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[calc(100dvh-0px)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 id="trend-modal-title" className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF5000]/30 transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Value row + period toggle */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-5 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{currentValue}</span>
            {badge}
          </div>
          <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 shrink-0">
            {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="px-5 pb-2">
          {children}
        </div>

        {/* Previous period */}
        <div className="px-5 py-3 border-t border-slate-50 text-xs text-slate-400 shrink-0">
          Previous period: <span className="font-semibold text-slate-600">{prevValue}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PKOverview() {
  const [filterTick, setFilterTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState<ModalCardKey | null>(null);
  const lastFocusRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => subscribeToAnalyticsFilters(() => setFilterTick((n) => n + 1)), []);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [filterTick]);

  const period = getPeriod();
  const filter = getAccountType();
  const stats = getOverviewStats(period, filter);
  const collRate = ((stats.rentCollected / stats.rentExpected) * 100).toFixed(1);

  const rentSeries = getRentChartSeries(period, filter);
  const tenancySeries = getTenancyChartSeries(period, filter);
  const maintSeries = getMaintenanceChartSeries(period, filter);
  const remindersSeries = getRemindersChartSeries(period, filter);

  const fmReopened = [...FM_PERFORMANCE[period]].sort((a, b) => b.reopened - a.reopened);

  function openModal(key: ModalCardKey, btn: HTMLButtonElement) {
    lastFocusRef.current = btn;
    setOpenCard(key);
  }

  function closeModal() {
    setOpenCard(null);
    setTimeout(() => lastFocusRef.current?.focus(), 0);
  }

  const prevTenancy = tenancySeries[tenancySeries.length - 2];
  const prevRent    = rentSeries[rentSeries.length - 2];
  const prevMaint   = maintSeries[maintSeries.length - 2];
  const prevRem     = remindersSeries[remindersSeries.length - 2];

  type ModalMeta = { title: string; subtitle: string; currentValue: string; prevValue: string; badge: ReactNode };
  const modalMetas: Record<ModalCardKey, ModalMeta> = {
    rent: {
      title: "Rent collected",
      subtitle: "Collection trend vs expected this period",
      currentValue: fmtCompact(stats.rentCollected),
      prevValue: fmtCompact(prevRent.collected),
      badge: <DeltaBadge value={stats.rentCollectedDeltaPct} goodWhenUp fmt={() => `${stats.rentCollectedDeltaPct > 0 ? "+" : ""}${stats.rentCollectedDeltaPct}%`} />,
    },
    active: {
      title: "Active tenancies",
      subtitle: "Tenancies active across the selected period",
      currentValue: stats.activeTenancies.toLocaleString(),
      prevValue: prevTenancy.active.toLocaleString(),
      badge: <DeltaBadge value={stats.activeTenanciesDelta} goodWhenUp />,
    },
    vacant: {
      title: "Vacant properties",
      subtitle: "Properties sitting vacant over time",
      currentValue: stats.vacantProperties.toLocaleString(),
      prevValue: prevTenancy.vacant.toLocaleString(),
      badge: <DeltaBadge value={stats.vacantPropertiesDelta} goodWhenDown />,
    },
    maintenance: {
      title: "Maintenance requests",
      subtitle: "New requests raised each period",
      currentValue: stats.maintenanceTotal.toLocaleString(),
      prevValue: prevMaint.count.toLocaleString(),
      badge: <DeltaBadge value={stats.maintenanceDelta} neutral />,
    },
    reminders: {
      title: "Reminders sent",
      subtitle: "Rent and payment reminders dispatched",
      currentValue: fmtCount(stats.remindersSent),
      prevValue: fmtCount(prevRem.count),
      badge: <DeltaBadge value={stats.remindersDelta} neutral />,
    },
    total: {
      title: "Total properties",
      subtitle: "All properties on the platform over time",
      currentValue: stats.totalProperties.toLocaleString(),
      prevValue: prevTenancy.total.toLocaleString(),
      badge: <DeltaBadge value={stats.totalPropertiesDelta} neutral />,
    },
  };

  function renderModalChart(key: ModalCardKey): ReactNode {
    switch (key) {
      case "rent":
        return (
          <TrendAreaChart<RentPoint>
            data={rentSeries} primaryKey="collected" secondaryKey="expected"
            primaryColor="#FF5000" secondaryColor="#94A3B8"
            loading={loading} yFmt={fmtM}
            tooltipLabel={(k) => k === "collected" ? "Collected" : "Expected"}
            secondaryDashed showLegend height={360}
          />
        );
      case "active":
        return (
          <TrendAreaChart<TenancyPoint>
            data={tenancySeries} primaryKey="active" primaryColor="#FF5000"
            loading={loading} yFmt={(v) => v.toLocaleString()}
            tooltipLabel={() => "Active"} height={360}
          />
        );
      case "vacant":
        return (
          <TrendAreaChart<TenancyPoint>
            data={tenancySeries} primaryKey="vacant" primaryColor="#0F172A"
            loading={loading} yFmt={(v) => v.toLocaleString()}
            tooltipLabel={() => "Vacant"} height={360}
          />
        );
      case "maintenance":
        return (
          <TrendAreaChart<CountPoint>
            data={maintSeries} primaryKey="count" primaryColor="#64748B"
            loading={loading} yFmt={(v) => v.toString()}
            tooltipLabel={() => "Requests"} height={360}
          />
        );
      case "reminders":
        return (
          <TrendAreaChart<CountPoint>
            data={remindersSeries} primaryKey="count" primaryColor="#8B5CF6"
            loading={loading} yFmt={fmtCount}
            tooltipLabel={() => "Reminders"} height={360}
          />
        );
      case "total":
        return (
          <TrendAreaChart<TenancyPoint>
            data={tenancySeries} primaryKey="total" primaryColor="#06B6D4"
            loading={loading} yFmt={(v) => v.toLocaleString()}
            tooltipLabel={() => "Total"} height={360}
          />
        );
      default:
        return null;
    }
  }

  const topOverdue = OVERDUE_TENANCIES[0];
  const topVacant  = LONGEST_VACANT_PROPERTIES[0];
  const topFm      = fmReopened[0];

  const cardCls = "bg-white border border-slate-200 rounded-xl p-4 text-left w-full hover:shadow-md hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FF5000]/30 focus:ring-offset-2 transition-all cursor-pointer group";

  return (
    <div className="p-6 lg:p-8 max-w-[1280px] mx-auto">
      <PKAnalyticsHeader title="Overview" subtitle="Platform-wide summary" />

      {/* 6 headline cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-7 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))
        ) : (
          <>
            <button type="button" onClick={(e) => openModal("total", e.currentTarget)}
              aria-label="View trend for Total properties" className={cardCls}>
              <div className="flex items-start justify-between mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building2 className="size-3.5 text-slate-600" />
                </div>
                <DeltaBadge value={stats.totalPropertiesDelta} neutral />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {stats.totalProperties.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="text-[11px] text-slate-500">Total properties</div>
                <BarChart2 className="size-3 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
              </div>
            </button>

            <button type="button" onClick={(e) => openModal("active", e.currentTarget)}
              aria-label="View trend for Active tenancies" className={cardCls}>
              <div className="flex items-start justify-between mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <TrendingUp className="size-3.5 text-slate-600" />
                </div>
                <DeltaBadge value={stats.activeTenanciesDelta} goodWhenUp />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {stats.activeTenancies.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="text-[11px] text-slate-500">Active tenancies</div>
                <BarChart2 className="size-3 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
              </div>
            </button>

            <button type="button" onClick={(e) => openModal("vacant", e.currentTarget)}
              aria-label="View trend for Vacant properties" className={cardCls}>
              <div className="flex items-start justify-between mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building2 className="size-3.5 text-slate-400" />
                </div>
                <DeltaBadge value={stats.vacantPropertiesDelta} goodWhenDown />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {stats.vacantProperties.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="text-[11px] text-slate-500">Vacant properties</div>
                <BarChart2 className="size-3 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
              </div>
            </button>

            <button type="button" onClick={(e) => openModal("rent", e.currentTarget)}
              aria-label="View trend for Rent collected" className={cardCls}>
              <div className="flex items-start justify-between mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Wallet className="size-3.5 text-slate-600" />
                </div>
                <DeltaBadge value={stats.rentCollectedDeltaPct} goodWhenUp fmt={() => `${stats.rentCollectedDeltaPct > 0 ? "+" : ""}${stats.rentCollectedDeltaPct}%`} />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {fmtCompact(stats.rentCollected)}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div>
                  <div className="text-[11px] text-slate-400">{collRate}% of {fmtCompact(stats.rentExpected)} expected</div>
                  <div className="text-[11px] text-slate-500">Rent collected</div>
                </div>
                <BarChart2 className="size-3 text-slate-300 group-hover:text-slate-400 transition-colors self-end" aria-hidden="true" />
              </div>
            </button>

            <button type="button" onClick={(e) => openModal("maintenance", e.currentTarget)}
              aria-label="View trend for Maintenance requests" className={cardCls}>
              <div className="flex items-start justify-between mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Wrench className="size-3.5 text-slate-600" />
                </div>
                <DeltaBadge value={stats.maintenanceDelta} neutral />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {stats.maintenanceTotal.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="text-[11px] text-slate-500">Maintenance requests</div>
                <BarChart2 className="size-3 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
              </div>
            </button>

            <button type="button" onClick={(e) => openModal("reminders", e.currentTarget)}
              aria-label="View trend for Reminders sent" className={cardCls}>
              <div className="flex items-start justify-between mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Bell className="size-3.5 text-slate-600" />
                </div>
                <DeltaBadge value={stats.remindersDelta} neutral />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {stats.remindersSent.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="text-[11px] text-slate-500">Reminders sent</div>
                <BarChart2 className="size-3 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true" />
              </div>
            </button>
          </>
        )}
      </div>

      {/* Highlights */}
      <div className="mb-2">
        <div className="mb-4">
          <div className="text-sm font-semibold text-slate-900">Highlights</div>
          <div className="text-xs text-slate-400 mt-0.5">The people and properties that need a look first</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Most overdue tenancy */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Most overdue tenancy</div>
              <a href="/admin/rent-payments" className="text-[11px] font-semibold text-[#FF5000] hover:underline shrink-0">View all</a>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">Top</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{topOverdue.tenant}</div>
                  <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
                    <span className="text-xl font-bold text-slate-900 tabular-nums">{fmtCompact(topOverdue.amount)}</span>
                    <span className="text-xs font-semibold text-slate-500">{topOverdue.daysOverdue} days overdue</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{topOverdue.property}</div>
                </div>
                <ul className="divide-y divide-slate-50">
                  {OVERDUE_TENANCIES.slice(1, 3).map((t) => (
                    <li key={t.tenant} className="px-5 py-2.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-700 truncate">{t.tenant}</span>
                      <span className="text-xs font-semibold text-slate-900 tabular-nums shrink-0">
                        {fmtCompact(t.amount)} · {t.daysOverdue}d
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Longest vacant property */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Longest vacant property</div>
              <a href="/admin/occupancy" className="text-[11px] font-semibold text-[#FF5000] hover:underline shrink-0">View all</a>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">Top</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{topVacant.name} {topVacant.unit}</div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-bold text-slate-900 tabular-nums">{topVacant.daysVacant}</span>
                    <span className="text-xs font-semibold text-slate-500">days vacant</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{topVacant.area}</div>
                </div>
                <ul className="divide-y divide-slate-50">
                  {LONGEST_VACANT_PROPERTIES.slice(1, 3).map((p) => (
                    <li key={`${p.name}-${p.unit}`} className="px-5 py-2.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-700 truncate">{p.name} {p.unit}</span>
                      <span className="text-xs font-semibold text-slate-700 tabular-nums shrink-0">{p.daysVacant}d vacant</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Most reopened requests */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Most reopened requests</div>
              <a href="/admin/maintenance" className="text-[11px] font-semibold text-[#FF5000] hover:underline shrink-0">View all</a>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">Top</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{topFm.name}</div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-bold text-slate-900 tabular-nums">{topFm.reopened}</span>
                    <span className="text-xs font-semibold text-slate-500">reopened</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{topFm.avgResolutionHours}h avg resolution</div>
                </div>
                <ul className="divide-y divide-slate-50">
                  {fmReopened.slice(1, 3).map((fm) => (
                    <li key={fm.name} className="px-5 py-2.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-700 truncate">{fm.name}</span>
                      <span className="text-xs font-semibold text-slate-700 tabular-nums shrink-0">{fm.reopened} reopened</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Trend modal */}
      {openCard && createPortal(
        <TrendModal
          title={modalMetas[openCard].title}
          subtitle={modalMetas[openCard].subtitle}
          currentValue={modalMetas[openCard].currentValue}
          prevValue={modalMetas[openCard].prevValue}
          badge={modalMetas[openCard].badge}
          period={period}
          onClose={closeModal}
        >
          {renderModalChart(openCard)}
        </TrendModal>,
        document.body
      )}
    </div>
  );
}
