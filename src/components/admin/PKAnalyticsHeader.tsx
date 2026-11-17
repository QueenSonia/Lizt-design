"use client";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  getPeriod, setPeriod,
  getAccountType, setAccountType,
  subscribeToAnalyticsFilters,
  PERIOD_LABELS, ACCOUNT_TYPE_LABELS,
  type Period, type AccountType,
} from "@/lib/analyticsDateStore";

interface PKAnalyticsHeaderProps {
  title:     string;
  subtitle?: string;
}

export function PKAnalyticsHeader({ title, subtitle }: PKAnalyticsHeaderProps) {
  const [, tick] = useState(0);
  useEffect(() => subscribeToAnalyticsFilters(() => tick((n) => n + 1)), []);

  const period      = getPeriod();
  const accountType = getAccountType();

  return (
    <div style={{ marginBottom: 48 }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between" style={{ gap: 16 }}>
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 700, color: "#0E1330",
            letterSpacing: "-0.4px", margin: 0, lineHeight: 1.2,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 13, color: "#5B6475", marginTop: 4 }}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center flex-wrap shrink-0" style={{ gap: 8 }}>
          <div style={{ position: "relative" }}>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              style={{
                appearance: "none" as const,
                fontSize: 12, fontWeight: 500,
                border: "1px solid #E6E8EE", borderRadius: 8,
                paddingLeft: 12, paddingRight: 32, paddingTop: 7, paddingBottom: 7,
                backgroundColor: "#FFFFFF", color: "#0E1330",
                cursor: "pointer", outline: "none",
              }}
            >
              {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
                <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none"
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                width: 14, height: 14, color: "#5B6475",
              }}
              aria-hidden="true"
            />
          </div>

          <div style={{
            display: "flex", backgroundColor: "#EDEEF1",
            borderRadius: 8, padding: 3, gap: 2,
          }}>
            {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: 12, fontWeight: 500,
                  border: "none", cursor: "pointer",
                  backgroundColor: period === p ? "#FFFFFF" : "transparent",
                  color:           period === p ? "#0E1330" : "#5B6475",
                  boxShadow:       period === p ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}
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
