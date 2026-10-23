"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { getDateRange, subscribeToAnalyticsFilters } from "@/lib/analyticsDateStore";
import {
  MAINTENANCE_STATS,
  MAINTENANCE_WEEKLY,
  FM_PERFORMANCE,
} from "./analyticsData";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded ${className}`} />;
}

export default function PKMaintenance() {
  const [filterTick, setFilterTick] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => subscribeToAnalyticsFilters(() => setFilterTick((n) => n + 1)), []);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [filterTick]);

  const dateRange = getDateRange();
  const stats = MAINTENANCE_STATS[dateRange];
  const weekly = MAINTENANCE_WEEKLY[dateRange];
  const fmTable = FM_PERFORMANCE[dateRange];

  const statusBreakdown = [
    { label: "Open", count: stats.open, color: "#0F172A" },
    { label: "In Progress", count: stats.inProgress, color: "#64748B" },
    { label: "Resolved", count: stats.resolved, color: "#CBD5E1" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1280px] mx-auto">
      <PKAnalyticsHeader title="Maintenance" subtitle="Service requests and facility manager performance" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500 mb-1">Total Requests</div>
              <div className="text-xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">this period</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500 mb-1">Open Now</div>
              <div className="text-xl font-bold text-slate-900">{stats.open}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{stats.inProgress} in progress</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500 mb-1">Avg Resolution</div>
              <div className="text-xl font-bold text-slate-900">{stats.avgResolutionDays}d</div>
              <div className="text-[10px] text-slate-400 mt-0.5">median time</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500 mb-1">Reopen Rate</div>
              <div className="text-xl font-bold text-slate-900">{stats.reopenRate}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">resolved then reopened</div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Status breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Requests by Status</h2>
          <p className="text-xs text-slate-400 mb-4">Current period totals</p>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : stats.total === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No requests this period.</div>
          ) : (
            <ul className="space-y-3">
              {statusBreakdown.map((s) => (
                <li key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{s.label}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {s.count} <span className="text-slate-400 font-normal">({((s.count / stats.total) * 100).toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(s.count / stats.total) * 100}%`,
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* New vs Resolved chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">New vs Resolved</h2>
          <p className="text-xs text-slate-400 mb-4">Period breakdown</p>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekly} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
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
      </div>

      {/* FM performance table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Facility Manager Performance</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            FM assigned vs resolved, resolution time, and tenant confirmation lag
          </p>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : fmTable.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No data available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-2.5 font-semibold">FM Name</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Assigned</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Resolved</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Avg Resolution</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Reopened</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Confirm Lag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fmTable.map((fm) => {
                  const resolveRate = ((fm.resolved / fm.assigned) * 100).toFixed(0);
                  return (
                    <tr key={fm.name} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-900 text-xs">{fm.name}</td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-500">{fm.assigned}</td>
                      <td className="px-4 py-3 text-right text-xs">
                        <span className="font-semibold text-slate-900 tabular-nums">{fm.resolved}</span>
                        <span className="text-slate-400 ml-1">({resolveRate}%)</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-700 font-semibold">
                        {fm.avgResolutionHours}h
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums">
                        <span className={`font-semibold ${fm.reopened > 5 ? "text-slate-700" : "text-slate-400"}`}>
                          {fm.reopened}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-500">
                        {fm.confirmLagHours}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
