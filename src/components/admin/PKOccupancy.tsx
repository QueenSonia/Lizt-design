"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getDateRange, getAccountType, subscribeToAnalyticsFilters } from "@/lib/analyticsDateStore";
import {
  getOccupancyStats,
  getVacancyByArea,
  OCCUPANCY_RATE_TREND,
} from "./analyticsData";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded ${className}`} />;
}

export default function PKOccupancy() {
  const [filterTick, setFilterTick] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => subscribeToAnalyticsFilters(() => setFilterTick((n) => n + 1)), []);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [filterTick]);

  const dateRange = getDateRange();
  const filter = getAccountType();
  const stats = getOccupancyStats(dateRange, filter);
  const trend = OCCUPANCY_RATE_TREND[dateRange];
  const byArea = getVacancyByArea(dateRange, filter);

  return (
    <div className="p-6 lg:p-8 max-w-[1280px] mx-auto">
      <PKAnalyticsHeader title="Occupancy" subtitle="Property utilisation and vacancy" />

      {/* KPI row */}
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
              <div className="text-[11px] text-slate-500 mb-1">Occupancy rate</div>
              <div className="text-xl font-bold text-slate-900">{stats.rate}%</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">+{stats.rateDelta}pp vs prev</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500 mb-1">Active tenancies</div>
              <div className="text-xl font-bold text-slate-900">{stats.active.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">of {stats.total.toLocaleString()} total</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500 mb-1">Vacant properties</div>
              <div className="text-xl font-bold text-slate-900">{stats.vacant}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">avg {stats.avgDaysVacant} days vacant</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500 mb-1">Ready for marketing</div>
              <div className="text-xl font-bold text-slate-900">{stats.readyForMarketing}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">of {stats.vacant} vacant</div>
            </div>
          </>
        )}
      </div>

      {/* Occupancy trend */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Occupancy rate trend</h2>
          <p className="text-xs text-slate-400 mt-0.5">Percentage of properties occupied over time</p>
          {!loading && (
            <div className="mt-2">
              <span className="text-xl font-bold text-slate-900">{stats.rate}%</span>
              <span className="text-xs text-emerald-600 font-semibold ml-2">+{stats.rateDelta}pp vs prev</span>
            </div>
          )}
        </div>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[80, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Occupancy"]}
                contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E2E8F0" }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#FF5000"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Vacancy by area */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Vacancy by area</h2>
        <p className="text-xs text-slate-400 mb-4">Number of vacant properties per location</p>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={byArea}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
            >
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="area"
                type="category"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip
                formatter={(v: number) => [v, "Vacant"]}
                contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E2E8F0" }}
              />
              <Bar dataKey="vacant" fill="#0F172A" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Area breakdown table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Vacancy breakdown by area</h2>
          <p className="text-xs text-slate-400 mt-0.5">Occupancy rate per location</p>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-2.5 font-semibold">Area</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Total</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Vacant</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Occupancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {byArea.map((row) => {
                  const occ = row.total > 0 ? (((row.total - row.vacant) / row.total) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={row.area} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-900 text-xs">{row.area}</td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-500">{row.total}</td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-700 font-semibold">{row.vacant}</td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-slate-900">{occ}%</td>
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
