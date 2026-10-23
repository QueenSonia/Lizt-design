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
import { getDateRange, getLandlordFilter, subscribeToAnalyticsFilters } from "@/lib/analyticsDateStore";
import {
  OVERVIEW_STATS,
  RENT_COLLECTED_SERIES,
  COLLECTION_RATE,
  LATE_PAYMENT_STATS,
  OVERDUE_TENANCIES,
  fmtCompact,
  fmtM,
} from "./analyticsData";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded ${className}`} />;
}

export default function PKRentPayments() {
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
  const series = RENT_COLLECTED_SERIES[dateRange];
  const collRate = COLLECTION_RATE[dateRange];
  const late = LATE_PAYMENT_STATS[dateRange];

  return (
    <div className="p-6 lg:p-8 max-w-[1280px] mx-auto">
      <PKAnalyticsHeader title="Rent and Payments" subtitle="Collection performance and arrears" />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Collected", value: fmtCompact(stats.rentCollected) },
          { label: "Expected", value: fmtCompact(stats.rentExpected) },
          { label: "Collection Rate", value: `${collRate}%` },
          { label: "Late Payments", value: late.count.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
            {loading ? (
              <>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-28" />
              </>
            ) : (
              <>
                <div className="text-[11px] text-slate-500 mb-1">{label}</div>
                <div className="text-xl font-bold text-slate-900 tabular-nums">{value}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Collected vs Expected chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Collected vs Expected</h2>
        <p className="text-xs text-slate-400 mb-4">Rent in ₦M per period</p>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v: number) => `₦${(v / 1_000_000).toFixed(0)}M`}
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

      {/* Late payments + aging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Late payment summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Late Payments</h2>
          <p className="text-xs text-slate-400 mb-4">
            {loading ? <Skeleton className="h-3 w-32 inline-block" /> : `${late.count} payments, ${fmtCompact(late.totalAmount)} outstanding`}
          </p>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <ul className="space-y-3">
              {late.aging.map((b) => {
                const pct = (b.amount / late.totalAmount) * 100;
                return (
                  <li key={b.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{b.label}</span>
                      <span className="text-slate-500">
                        {b.count} tenants · <span className="font-semibold text-slate-900">{fmtCompact(b.amount)}</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          b.label.startsWith("30+") ? "bg-slate-700" :
                          b.label.startsWith("8") ? "bg-slate-500" : "bg-slate-300"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Collection rate visual */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Collection Rate</h2>
          <p className="text-xs text-slate-400 mb-6">Share of expected rent actually collected</p>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative size-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="#FF5000" strokeWidth="12"
                    strokeDasharray={`${(collRate / 100) * 251.3} 251.3`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">{collRate}%</span>
                  <span className="text-[10px] text-slate-400">collected</span>
                </div>
              </div>
              <div className="flex gap-6 text-xs text-slate-500">
                <div className="text-center">
                  <div className="font-semibold text-slate-900 text-sm">{fmtCompact(stats.rentCollected)}</div>
                  <div>Collected</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-slate-400 text-sm">{fmtCompact(stats.rentExpected - stats.rentCollected)}</div>
                  <div>Outstanding</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Most overdue table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Most Overdue Tenancies</h2>
          <p className="text-xs text-slate-400 mt-0.5">Sorted by days overdue</p>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : OVERDUE_TENANCIES.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No overdue tenancies.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-2.5 font-semibold">Tenant</th>
                  <th className="px-4 py-2.5 font-semibold">Property</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Amount</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Days Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {OVERDUE_TENANCIES.map((t) => (
                  <tr key={t.tenant} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-900 text-xs">{t.tenant}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{t.property}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 text-xs tabular-nums">
                      {fmtCompact(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        t.daysOverdue >= 60 ? "bg-slate-900 text-white" :
                        t.daysOverdue >= 30 ? "bg-slate-700 text-white" :
                        t.daysOverdue >= 14 ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        {t.daysOverdue}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
