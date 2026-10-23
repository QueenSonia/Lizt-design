"use client";
import { useEffect, useState } from "react";
import {
  getDateRange,
  setDateRange,
  getLandlordFilter,
  setLandlordFilter,
  subscribeToAnalyticsFilters,
  DATE_RANGE_LABELS,
  type DateRange,
} from "@/lib/analyticsDateStore";
import { MOCK_LANDLORDS } from "./analyticsData";

interface PKAnalyticsHeaderProps {
  title: string;
  subtitle?: string;
}

export function PKAnalyticsHeader({ title, subtitle }: PKAnalyticsHeaderProps) {
  const [, tick] = useState(0);
  useEffect(() => subscribeToAnalyticsFilters(() => tick((n) => n + 1)), []);
  const dateRange = getDateRange();
  const landlord = getLandlordFilter();

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <select
            value={landlord}
            onChange={(e) => setLandlordFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5000]/20 focus:border-[#FF5000]"
          >
            {MOCK_LANDLORDS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
            {(["30d", "90d", "12m"] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  dateRange === r
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {DATE_RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
