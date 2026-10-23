"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ArrowUp, ArrowDown, Minus, Building2, TrendingUp, Wallet, Wrench, Bell } from "lucide-react";
import { getDateRange, getAccountType, subscribeToAnalyticsFilters } from "@/lib/analyticsDateStore";
import {
  getOverviewStats,
  getRentSeries,
  getTenanciesTrend,
  getMaintenanceWeekly,
  getRemindersSeries,
  OVERDUE_TENANCIES,
  LONGEST_VACANT_PROPERTIES,
  FM_PERFORMANCE,
  fmtCompact,
  fmtM,
} from "./analyticsData";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded ${className}`} />;
}

function DeltaBadge({
  value,
  goodWhenUp,
  goodWhenDown,
  neutral,
  fmt,
}: {
  value: number;
  goodWhenUp?: boolean;
  goodWhenDown?: boolean;
  neutral?: boolean;
  fmt?: (v: number) => string;
}) {
  const up = value > 0;
  const sign = value > 0 ? "+" : "";
  const display = fmt ? fmt(Math.abs(value)) : `${sign}${value}`;

  let colorClass = "bg-slate-100 text-slate-600";
  if (!neutral && value !== 0) {
    const isGood = (goodWhenUp && up) || (goodWhenDown && !up);
    colorClass = isGood ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600";
  }

  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;

  return (
    <span
      title="vs previous period"
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${colorClass}`}
    >
      <Icon className="size-2.5" />
      {display}
    </span>
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

  const range = getDateRange();
  const filter = getAccountType();
  const stats = getOverviewStats(range, filter);
  const collectionRate = ((stats.rentCollected / stats.rentExpected) * 100).toFixed(1);
  const rentSeries = getRentSeries(range, filter);
  const tenanciesSeries = getTenanciesTrend(range, filter);
  const maintSeries = getMaintenanceWeekly(range, filter);
  const remindersSeries = getRemindersSeries(range, filter);

  const fmReopened = [...FM_PERFORMANCE[range]]
    .sort((a, b) => b.reopened - a.reopened)
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-[1280px] mx-auto">
      <PKAnalyticsHeader title="Overview" subtitle="Platform-wide summary" />

      {/* 6 headline cards, 3 per row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {/* Total properties */}
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
            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building2 className="size-3.5 text-slate-600" />
                </div>
                <DeltaBadge value={stats.totalPropertiesDelta} neutral />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {stats.totalProperties.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Total properties</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <TrendingUp className="size-3.5 text-slate-600" />
                </div>
                <DeltaBadge value={stats.activeTenanciesDelta} goodWhenUp />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {stats.activeTenancies.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Active tenancies</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building2 className="size-3.5 text-slate-400" />
                </div>
                <DeltaBadge value={stats.vacantPropertiesDelta} goodWhenDown />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {stats.vacantProperties.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Vacant properties</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Wallet className="size-3.5 text-slate-600" />
                </div>
                <DeltaBadge
                  value={stats.rentCollectedDeltaPct}
                  goodWhenUp
                  fmt={(v) => `${stats.rentCollectedDeltaPct > 0 ? "+" : ""}${stats.rentCollectedDeltaPct}%`}
                />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {fmtCompact(stats.rentCollected)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {collectionRate}% of {fmtCompact(stats.rentExpected)} expected
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Rent collected</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Wrench className="size-3.5 text-slate-600" />
                </div>
                <DeltaBadge value={stats.maintenanceDelta} neutral />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {stats.maintenanceTotal.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Total maintenance requests</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Bell className="size-3.5 text-slate-600" />
                </div>
                <DeltaBadge value={stats.remindersDelta} neutral />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {stats.remindersSent.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Total reminders sent</div>
            </div>
          </>
        )}
      </div>

      {/* 2×2 chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Chart a: Rent collected vs expected */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-900">Rent collected vs expected</div>
            <div className="text-xs text-slate-400 mt-0.5">Weekly collection against target</div>
            {!loading && (
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">{collectionRate}% collection rate</span>
                <DeltaBadge
                  value={stats.rentCollectedDeltaPct}
                  goodWhenUp
                  fmt={(v) => `${stats.rentCollectedDeltaPct > 0 ? "+" : ""}${stats.rentCollectedDeltaPct}%`}
                />
              </div>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rentSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v: number) => fmtM(v)}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [fmtM(v), name === "collected" ? "Collected" : "Expected"]}
                  contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E2E8F0" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={(name: string) => (name === "collected" ? "Collected" : "Expected")}
                />
                <Bar dataKey="collected" fill="#FF5000" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expected" fill="#CBD5E1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart b: Active tenancies vs vacant */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-900">Active tenancies vs vacant</div>
            <div className="text-xs text-slate-400 mt-0.5">Active and vacant property count over time</div>
            {!loading && (
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">
                  {stats.activeTenancies.toLocaleString()} active
                </span>
                <DeltaBadge value={stats.activeTenanciesDelta} goodWhenUp />
              </div>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={tenanciesSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    v.toLocaleString(),
                    name === "active" ? "Active" : "Vacant",
                  ]}
                  contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E2E8F0" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={(name: string) => (name === "active" ? "Active" : "Vacant")}
                />
                <Line type="monotone" dataKey="active" stroke="#FF5000" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="vacant" stroke="#0F172A" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart c: Maintenance new vs resolved */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-900">Maintenance requests</div>
            <div className="text-xs text-slate-400 mt-0.5">New requests and resolutions per week</div>
            {!loading && (
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">
                  {stats.maintenanceTotal.toLocaleString()} requests
                </span>
                <DeltaBadge value={stats.maintenanceDelta} neutral />
              </div>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={maintSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  formatter={(v: number, name: string) => [v, name === "newRequests" ? "New" : "Resolved"]}
                  contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E2E8F0" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={(name: string) => (name === "newRequests" ? "New" : "Resolved")}
                />
                <Bar dataKey="newRequests" fill="#0F172A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="resolved" fill="#CBD5E1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart d: Reminders sent */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-900">Reminders sent</div>
            <div className="text-xs text-slate-400 mt-0.5">Rent and payment reminders per week</div>
            {!loading && (
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">
                  {stats.remindersSent.toLocaleString()} sent
                </span>
                <DeltaBadge value={stats.remindersDelta} neutral />
              </div>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={remindersSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  formatter={(v: number) => [v.toLocaleString(), "Reminders"]}
                  contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E2E8F0" }}
                />
                <Bar dataKey="count" fill="#FF5000" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Needs attention */}
      <div className="mb-2">
        <div className="text-sm font-semibold text-slate-700 mb-3">Needs attention</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Most overdue tenancies */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Most overdue tenancies</div>
                <div className="text-[11px] text-slate-400 mt-0.5">By days overdue</div>
              </div>
              <a href="/admin/rent-payments" className="text-[11px] font-semibold text-[#FF5000] hover:underline shrink-0">
                View all
              </a>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {OVERDUE_TENANCIES.slice(0, 5).map((t) => (
                  <li key={t.tenant} className="px-5 py-3 hover:bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">{t.tenant}</div>
                        <div className="text-[10px] text-slate-400 truncate">{t.property}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-semibold text-slate-900 tabular-nums">{fmtCompact(t.amount)}</div>
                        <div className={`text-[10px] font-semibold tabular-nums ${
                          t.daysOverdue >= 60 ? "text-slate-700" :
                          t.daysOverdue >= 30 ? "text-slate-500" : "text-slate-400"
                        }`}>{t.daysOverdue}d overdue</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Longest vacant properties */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Longest vacant</div>
                <div className="text-[11px] text-slate-400 mt-0.5">By days vacant</div>
              </div>
              <a href="/admin/occupancy" className="text-[11px] font-semibold text-[#FF5000] hover:underline shrink-0">
                View all
              </a>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {LONGEST_VACANT_PROPERTIES.map((p) => (
                  <li key={`${p.name}-${p.unit}`} className="px-5 py-3 hover:bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">{p.name} {p.unit}</div>
                        <div className="text-[10px] text-slate-400">{p.area}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-semibold text-slate-700 tabular-nums">{p.daysVacant}d vacant</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* FMs with most reopened requests */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Most reopened requests</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Facility managers by reopens</div>
              </div>
              <a href="/admin/maintenance" className="text-[11px] font-semibold text-[#FF5000] hover:underline shrink-0">
                View all
              </a>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {fmReopened.map((fm) => (
                  <li key={fm.name} className="px-5 py-3 hover:bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">{fm.name}</div>
                        <div className="text-[10px] text-slate-400">{fm.avgResolutionHours}h avg resolution</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-semibold text-slate-700 tabular-nums">{fm.reopened} reopened</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
