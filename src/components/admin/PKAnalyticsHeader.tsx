"use client";
import { useEffect, useState } from "react";
import {
  getPeriod,
  setPeriod,
  getAccountType,
  setAccountType,
  subscribeToAnalyticsFilters,
  PERIOD_LABELS,
  ACCOUNT_TYPE_LABELS,
  type Period,
  type AccountType,
} from "@/lib/analyticsDateStore";

interface PKAnalyticsHeaderProps {
  title: string;
  subtitle?: string;
}

export function PKAnalyticsHeader({ title, subtitle }: PKAnalyticsHeaderProps) {
  const [, tick] = useState(0);
  useEffect(() => subscribeToAnalyticsFilters(() => tick((n) => n + 1)), []);
  const period      = getPeriod();
  const accountType = getAccountType();

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as AccountType)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5000]/20 focus:border-[#FF5000]"
          >
            {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
              <option key={t} value={t}>
                {ACCOUNT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
            {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  period === p
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
