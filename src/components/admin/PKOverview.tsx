"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Building2, TrendingUp, TrendingDown, Wallet, Wrench, MessageSquare } from "lucide-react";
import { getDateRange, getLandlordFilter, subscribeToAnalyticsFilters } from "@/lib/analyticsDateStore";
import {
  OVERVIEW_STATS,
  OVERVIEW_REVENUE_TREND,
  OVERVIEW_OCCUPANCY_TREND,
  OVERVIEW_MAINTENANCE_TREND,
  fmtCompact,
  fmtM,
} from "./analyticsData";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded ${className}`} />;
}

function StatCard({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  delta: { text: string; up: boolean };
  icon: typeof Building2;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className="size-3.5 text-slate-600" />
        </div>
        <span
          className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            delta.up ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {delta.up ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
          {delta.text}
        </span>
      </div>
      <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function MiniAreaChart({
  data,
  color,
  yFmt,
  loading,
}: {
  data: Array<{ label: string; value: number }>;
  color: string;
  yFmt?: (v: number) => string;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-24 w-full" />;
  return (
    <ResponsiveContainer width="100%" height={96}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <YAxis hide domain={["auto", "auto"]} />
        <Tooltip
          formatter={(v: number) => [yFmt ? yFmt(v) : v, undefined]}
          labelStyle={{ fontSize: 11 }}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E2E8F0" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace("#", "")})`}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MiniLineChart({
  data,
  color,
  yFmt,
  loading,
}: {
  data: Array<{ label: string; value: number }>;
  color: string;
  yFmt?: (v: number) => string;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-24 w-full" />;
  return (
    <ResponsiveContainer width="100%" height={96}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <YAxis hide domain={["auto", "auto"]} />
        <Tooltip
          formatter={(v: number) => [yFmt ? yFmt(v) : v, undefined]}
          labelStyle={{ fontSize: 11 }}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E2E8F0" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function PKOverview() {
  const [filterTick, setFilterTick] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => subscribeToAnalyticsFilters(() => setFilterTick((n) => n + 1)), []);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [filterTick]);

  const dateRange = getDateRange();
  const stats = OVERVIEW_STATS[dateRange];
  const collectionRate = ((stats.rentCollected / stats.rentExpected) * 100).toFixed(1);

  return (
    <div className="p-6 lg:p-8 max-w-[1280px] mx-auto">
      <PKAnalyticsHeader title="Overview" subtitle="Platform-wide summary" />

      {/* Headline cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <StatCard
          label="Total Properties"
          value={stats.totalProperties.toLocaleString()}
          delta={{ text: `+${stats.propertiesDelta} added`, up: true }}
          icon={Building2}
          loading={loading}
        />
        <StatCard
          label="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          sub={`${(stats.totalProperties * stats.occupancyRate / 100).toFixed(0)} active`}
          delta={{ text: `+${stats.occupancyDelta}pp`, up: true }}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          label="Rent Collected"
          value={fmtCompact(stats.rentCollected)}
          sub={`${collectionRate}% of ${fmtCompact(stats.rentExpected)}`}
          delta={{ text: `${collectionRate}% rate`, up: parseFloat(collectionRate) >= 93 }}
          icon={Wallet}
          loading={loading}
        />
        <StatCard
          label="Open Maintenance"
          value={stats.openMaintenance.toString()}
          delta={{ text: `${Math.abs(stats.maintenanceDelta)} vs prev`, up: stats.maintenanceDelta < 0 }}
          icon={Wrench}
          loading={loading}
        />
        <StatCard
          label="Messages Sent"
          value={stats.messagesSent.toLocaleString()}
          delta={{ text: `+${stats.messagesDelta.toLocaleString()}`, up: true }}
          icon={MessageSquare}
          loading={loading}
        />
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-3">
            <div className="text-sm font-semibold text-slate-900">Rent Collected</div>
            <div className="text-xs text-slate-400 mt-0.5">Period total in ₦</div>
          </div>
          <MiniAreaChart
            data={OVERVIEW_REVENUE_TREND[dateRange]}
            color="#FF5000"
            yFmt={fmtM}
            loading={loading}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-3">
            <div className="text-sm font-semibold text-slate-900">Occupancy Rate</div>
            <div className="text-xs text-slate-400 mt-0.5">Percentage occupied</div>
          </div>
          <MiniLineChart
            data={OVERVIEW_OCCUPANCY_TREND[dateRange]}
            color="#0F172A"
            yFmt={(v) => `${v}%`}
            loading={loading}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-3">
            <div className="text-sm font-semibold text-slate-900">Open Maintenance</div>
            <div className="text-xs text-slate-400 mt-0.5">Outstanding requests</div>
          </div>
          <MiniLineChart
            data={OVERVIEW_MAINTENANCE_TREND[dateRange]}
            color="#64748B"
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
