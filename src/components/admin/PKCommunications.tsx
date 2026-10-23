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
  Legend,
} from "recharts";
import { getDateRange, getAccountType, subscribeToAnalyticsFilters } from "@/lib/analyticsDateStore";
import {
  getCommsStats,
  getCommsTrend,
  getOnboardingTrend,
} from "./analyticsData";
import { PKAnalyticsHeader } from "./PKAnalyticsHeader";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded ${className}`} />;
}

export default function PKCommunications() {
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
  const stats = getCommsStats(dateRange, filter);
  const commsTrend = getCommsTrend(dateRange, filter);
  const onboarding = getOnboardingTrend(dateRange, filter);

  return (
    <div className="p-6 lg:p-8 max-w-[1280px] mx-auto">
      <PKAnalyticsHeader title="Communications" subtitle="Messaging delivery and resident onboarding" />

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
              <div className="text-[11px] text-slate-500 mb-1">Messages sent</div>
              <div className="text-xl font-bold text-slate-900">{stats.sent.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">this period</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500 mb-1">Delivery rate</div>
              <div className="text-xl font-bold text-slate-900">{stats.deliveryRate}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{stats.delivered.toLocaleString()} delivered</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500 mb-1">Read rate</div>
              <div className="text-xl font-bold text-slate-900">{stats.readRate}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{stats.read.toLocaleString()} read</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500 mb-1">Broadcasts sent</div>
              <div className="text-xl font-bold text-slate-900">{stats.broadcasts}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">this period</div>
            </div>
          </>
        )}
      </div>

      {/* Messages trend */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Messages over time</h2>
          <p className="text-xs text-slate-400 mt-0.5">Sent, delivered, and read per period</p>
          {!loading && (
            <div className="mt-2">
              <span className="text-xl font-bold text-slate-900">{stats.sent.toLocaleString()} sent</span>
              <span className="text-xs text-slate-400 ml-2">{stats.deliveryRate}% delivery · {stats.readRate}% read</span>
            </div>
          )}
        </div>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={commsTrend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={38} />
              <Tooltip
                formatter={(v: number, name: string) => {
                  const labels: Record<string, string> = { sent: "Sent", delivered: "Delivered", read: "Read" };
                  return [v.toLocaleString(), labels[name] ?? name];
                }}
                contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E2E8F0" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(name: string) => ({ sent: "Sent", delivered: "Delivered", read: "Read" }[name] ?? name)}
              />
              <Line type="monotone" dataKey="sent" stroke="#FF5000" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
              <Line type="monotone" dataKey="delivered" stroke="#0F172A" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
              <Line type="monotone" dataKey="read" stroke="#94A3B8" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Onboarding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Onboarding chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Resident onboarding</h2>
            <p className="text-xs text-slate-400 mt-0.5">Invited vs onboarded per period</p>
            {!loading && (
              <div className="mt-2">
                <span className="text-xl font-bold text-slate-900">{stats.onboardingRate}% onboarding rate</span>
                <span className="text-xs text-slate-400 ml-2">{stats.onboardedResidents} of {stats.invitedResidents} invited</span>
              </div>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={onboarding} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  formatter={(v: number, name: string) => [v, name === "invited" ? "Invited" : "Onboarded"]}
                  contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E2E8F0" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={(name: string) => (name === "invited" ? "Invited" : "Onboarded")}
                />
                <Bar dataKey="invited" fill="#CBD5E1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="onboarded" fill="#FF5000" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Onboarding stats */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Onboarding summary</h2>
          <p className="text-xs text-slate-400 mb-6">Residents invited and successfully onboarded</p>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">Onboarding rate</span>
                  <span className="font-semibold text-slate-900">{stats.onboardingRate}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#FF5000]"
                    style={{ width: `${stats.onboardingRate}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-slate-900 tabular-nums">{stats.invitedResidents.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Invited</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-slate-900 tabular-nums">{stats.onboardedResidents.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Onboarded</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-slate-500 tabular-nums">
                    {(stats.invitedResidents - stats.onboardedResidents).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Pending</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
