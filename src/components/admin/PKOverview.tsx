"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import { ArrowUp, ArrowDown, Minus, Building2, TrendingUp, Wallet, Wrench, Bell } from "lucide-react";
import { getPeriod, getAccountType, subscribeToAnalyticsFilters } from "@/lib/analyticsDateStore";
import {
  getOverviewStats,
  getRentChartSeries,
  getTenancyChartSeries,
  getMaintenanceChartSeries,
  getRemindersChartSeries,
  OVERDUE_TENANCIES,
  LONGEST_VACANT_PROPERTIES,
  FM_PERFORMANCE,
  fmtCompact,
  fmtM,
  type RentPoint,
  type TenancyPoint,
  type CountPoint,
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
  fmt?: () => string;
}) {
  const up   = value > 0;
  const sign = value > 0 ? "+" : "";
  const display = fmt ? fmt() : `${sign}${value}`;

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

// ── Domain helpers ────────────────────────────────────────────────────────────

function autoDomain(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = Math.max(min * 0.05, 1);
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }
  const range = max - min;
  const pad   = range * 0.18;
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}

// ── Reusable area chart ───────────────────────────────────────────────────────

interface AreaChartCardProps<T extends Record<string, number | string>> {
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
}

function TrendAreaChart<T extends Record<string, number | string>>({
  data,
  primaryKey,
  secondaryKey,
  primaryColor,
  secondaryColor = "#CBD5E1",
  loading,
  yFmt,
  tooltipLabel,
  secondaryDashed = true,
  showLegend = false,
}: AreaChartCardProps<T>) {
  if (loading) return <Skeleton className="h-[200px] w-full" />;

  const pk = primaryKey as string;
  const sk = secondaryKey as string | undefined;

  const primaryVals  = data.map((d) => d[pk] as number);
  const secondaryVals = sk ? data.map((d) => d[sk] as number) : [];
  const domain = autoDomain([...primaryVals, ...secondaryVals]);
  const lastIdx = data.length - 1;

  const gradId    = `grad-${pk}`;
  const gradIdSec = `grad-${sk ?? "sec"}`;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 18, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={primaryColor} stopOpacity={0.18} />
            <stop offset="95%" stopColor={primaryColor} stopOpacity={0}    />
          </linearGradient>
          {sk && (
            <linearGradient id={gradIdSec} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={secondaryColor} stopOpacity={0.08} />
              <stop offset="95%" stopColor={secondaryColor} stopOpacity={0}    />
            </linearGradient>
          )}
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={domain}
          tickFormatter={yFmt}
          tickCount={4}
          tick={{ fontSize: 9, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip
          formatter={(v: number, name: string) => [
            yFmt(v),
            tooltipLabel ? tooltipLabel(name) : name,
          ]}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E2E8F0" }}
          labelStyle={{ fontSize: 11 }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            formatter={(name: string) => tooltipLabel ? tooltipLabel(name) : name}
          />
        )}

        {/* Secondary line first so primary renders on top */}
        {sk && (
          <Area
            type="monotone"
            dataKey={sk}
            stroke={secondaryColor}
            strokeWidth={1.5}
            strokeDasharray={secondaryDashed ? "5 4" : undefined}
            fill={`url(#${gradIdSec})`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        )}

        <Area
          type="monotone"
          dataKey={pk}
          stroke={primaryColor}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          activeDot={{ r: 4, stroke: "white", strokeWidth: 2 }}
          dot={(props: any) => {
            const { cx, cy, index } = props as { cx: number; cy: number; index: number };
            if (index !== lastIdx) return <g key={index} />;
            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={4}
                fill={primaryColor}
                stroke="white"
                strokeWidth={2}
              />
            );
          }}
        >
          <LabelList
            dataKey={pk}
            content={(props: any) => {
              const { x, y, value, index } = props as { x: number; y: number; value: number; index: number };
              if (index !== lastIdx) return null;
              return (
                <text
                  key="last-label"
                  x={x + 1}
                  y={y - 8}
                  textAnchor="end"
                  fontSize={10}
                  fontWeight={600}
                  fill="#64748B"
                >
                  {yFmt(value ?? 0)}
                </text>
              );
            }}
          />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  headlineValue,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  headlineValue: string;
  badge: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {badge}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>
        <div className="text-xl font-bold text-slate-900 mt-1.5 tabular-nums tracking-tight">
          {headlineValue}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Number formatters for y-axes ──────────────────────────────────────────────

function fmtCount(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toLocaleString();
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PKOverview() {
  const [filterTick, setFilterTick] = useState(0);
  const [loading, setLoading]       = useState(true);

  useEffect(() => subscribeToAnalyticsFilters(() => setFilterTick((n) => n + 1)), []);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [filterTick]);

  const period = getPeriod();
  const filter = getAccountType();
  const stats  = getOverviewStats(period, filter);
  const collRate = ((stats.rentCollected / stats.rentExpected) * 100).toFixed(1);

  const rentSeries      = getRentChartSeries(period, filter);
  const tenancySeries   = getTenancyChartSeries(period, filter);
  const maintSeries     = getMaintenanceChartSeries(period, filter);
  const remindersSeries = getRemindersChartSeries(period, filter);

  const fmReopened = [...FM_PERFORMANCE[period]]
    .sort((a, b) => b.reopened - a.reopened)
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-[1280px] mx-auto">
      <PKAnalyticsHeader title="Overview" subtitle="Platform-wide summary" />

      {/* ── 6 headline cards ── */}
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
                  fmt={() => `${stats.rentCollectedDeltaPct > 0 ? "+" : ""}${stats.rentCollectedDeltaPct}%`}
                />
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                {fmtCompact(stats.rentCollected)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {collRate}% of {fmtCompact(stats.rentExpected)} expected
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

      {/* ── Needs attention ── */}
      <div className="mb-8">
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
                {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
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

          {/* Longest vacant */}
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
                {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
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

          {/* FMs with most reopened */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Most reopened requests</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Facility managers</div>
              </div>
              <a href="/admin/maintenance" className="text-[11px] font-semibold text-[#FF5000] hover:underline shrink-0">
                View all
              </a>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
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

      {/* ── 6 trend charts, 3 cols x 2 rows ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* a: Rent collected */}
        <ChartCard
          title="Rent collected"
          subtitle="vs expected (dashed)"
          headlineValue={loading ? "..." : fmtCompact(stats.rentCollected)}
          badge={loading ? null : (
            <DeltaBadge
              value={stats.rentCollectedDeltaPct}
              goodWhenUp
              fmt={() => `${stats.rentCollectedDeltaPct > 0 ? "+" : ""}${stats.rentCollectedDeltaPct}%`}
            />
          )}
        >
          <TrendAreaChart<RentPoint>
            data={rentSeries}
            primaryKey="collected"
            secondaryKey="expected"
            primaryColor="#FF5000"
            secondaryColor="#94A3B8"
            loading={loading}
            yFmt={fmtM}
            tooltipLabel={(k) => k === "collected" ? "Collected" : "Expected"}
            secondaryDashed
            showLegend
          />
        </ChartCard>

        {/* b: Active tenancies */}
        <ChartCard
          title="Active tenancies"
          subtitle="Active tenancies over time"
          headlineValue={loading ? "..." : stats.activeTenancies.toLocaleString()}
          badge={loading ? null : <DeltaBadge value={stats.activeTenanciesDelta} goodWhenUp />}
        >
          <TrendAreaChart<TenancyPoint>
            data={tenancySeries}
            primaryKey="active"
            primaryColor="#FF5000"
            loading={loading}
            yFmt={(v) => v.toLocaleString()}
            tooltipLabel={() => "Active"}
          />
        </ChartCard>

        {/* c: Vacant properties */}
        <ChartCard
          title="Vacant properties"
          subtitle="Vacant count over time"
          headlineValue={loading ? "..." : stats.vacantProperties.toLocaleString()}
          badge={loading ? null : <DeltaBadge value={stats.vacantPropertiesDelta} goodWhenDown />}
        >
          <TrendAreaChart<TenancyPoint>
            data={tenancySeries}
            primaryKey="vacant"
            primaryColor="#0F172A"
            loading={loading}
            yFmt={(v) => v.toLocaleString()}
            tooltipLabel={() => "Vacant"}
          />
        </ChartCard>

        {/* d: Maintenance requests */}
        <ChartCard
          title="Maintenance requests"
          subtitle="New requests per period"
          headlineValue={loading ? "..." : stats.maintenanceTotal.toLocaleString()}
          badge={loading ? null : <DeltaBadge value={stats.maintenanceDelta} neutral />}
        >
          <TrendAreaChart<CountPoint>
            data={maintSeries}
            primaryKey="count"
            primaryColor="#64748B"
            loading={loading}
            yFmt={(v) => v.toString()}
            tooltipLabel={() => "Requests"}
          />
        </ChartCard>

        {/* e: Reminders sent */}
        <ChartCard
          title="Reminders sent"
          subtitle="Rent and payment reminders"
          headlineValue={loading ? "..." : stats.remindersSent.toLocaleString()}
          badge={loading ? null : <DeltaBadge value={stats.remindersDelta} neutral />}
        >
          <TrendAreaChart<CountPoint>
            data={remindersSeries}
            primaryKey="count"
            primaryColor="#8B5CF6"
            loading={loading}
            yFmt={fmtCount}
            tooltipLabel={() => "Reminders"}
          />
        </ChartCard>

        {/* f: Total properties */}
        <ChartCard
          title="Total properties"
          subtitle="Properties on platform over time"
          headlineValue={loading ? "..." : stats.totalProperties.toLocaleString()}
          badge={loading ? null : <DeltaBadge value={stats.totalPropertiesDelta} neutral />}
        >
          <TrendAreaChart<TenancyPoint>
            data={tenancySeries}
            primaryKey="total"
            primaryColor="#06B6D4"
            loading={loading}
            yFmt={(v) => v.toLocaleString()}
            tooltipLabel={() => "Total"}
          />
        </ChartCard>
      </div>
    </div>
  );
}
