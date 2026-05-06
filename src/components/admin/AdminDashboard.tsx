"use client";
import {
  Building2,
  Users,
  UserCheck,
  ShieldCheck,
  Headphones,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Wrench,
  CreditCard,
  Home,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  MapPin,
  RefreshCw,
  Wallet,
  Flame,
  Star,
} from "lucide-react";
import { AdminPageHeader } from "./AdminPageHeader";
import {
  ADMIN_KPIS,
  REVENUE_TREND,
  ACTIVITY_FEED,
  APARTMENT_TYPE_MIX,
  TENANT_GENDER,
  TENANT_AGE_BANDS,
  OCCUPANCY_TREND,
  TENANT_GROWTH,
  KYC_FUNNEL,
  KYC_RATES,
  LOCATION_BREAKDOWN,
  TOP_PERFORMING_PROPERTIES,
  PROBLEMATIC_PROPERTIES,
  FINANCIAL_HEALTH,
  AGING_BUCKETS,
  LEASE_RENEWALS,
  TOP_FACILITY_MANAGERS,
  RISK_SIGNALS,
} from "./adminMockData";

const formatNaira = (n: number) =>
  `₦${(n / 1_000_000).toLocaleString("en-NG", { maximumFractionDigits: 1 })}M`;

// ─── Section heading ──────────────────────────────────────────────
function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FF5000] mb-1">
          {eyebrow}
        </p>
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

// ─── KPI cards ────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string | number;
  delta?: { value: string; up: boolean };
  icon: typeof Building2;
  tone?: "default" | "warning" | "danger" | "success";
  hint?: string;
}) {
  const toneClass = {
    default: "text-slate-700 bg-slate-50",
    warning: "text-amber-700 bg-amber-50",
    danger: "text-red-700 bg-red-50",
    success: "text-emerald-700 bg-emerald-50",
  }[tone];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`size-9 rounded-lg flex items-center justify-center ${toneClass}`}
        >
          <Icon className="size-4" />
        </div>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
              delta.up
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {delta.up ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {delta.value}
          </span>
        )}
      </div>
      <div className="text-xl font-semibold text-slate-900 tracking-tight">
        {value}
      </div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
      {hint && (
        <div className="text-[10px] text-slate-400 mt-1.5 truncate">{hint}</div>
      )}
    </div>
  );
}

// ─── Revenue + Occupancy dual chart ───────────────────────────────
function DualTrendChart() {
  const width = 600;
  const height = 200;
  const padding = { top: 14, right: 14, bottom: 28, left: 14 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const revMax = Math.max(...REVENUE_TREND.map((d) => d.revenue));
  const revMin = Math.min(...REVENUE_TREND.map((d) => d.revenue));
  const revRange = revMax - revMin || 1;

  const occMax = Math.max(...OCCUPANCY_TREND.map((d) => d.occupancy));
  const occMin = Math.min(...OCCUPANCY_TREND.map((d) => d.occupancy));
  const occRange = occMax - occMin || 1;

  const revPoints = REVENUE_TREND.map((d, i) => ({
    x: padding.left + (i * innerW) / (REVENUE_TREND.length - 1),
    y: padding.top + innerH - ((d.revenue - revMin) / revRange) * innerH,
    label: d.month,
  }));

  const occPoints = OCCUPANCY_TREND.map((d, i) => ({
    x: padding.left + (i * innerW) / (OCCUPANCY_TREND.length - 1),
    y: padding.top + innerH - ((d.occupancy - occMin) / occRange) * innerH,
  }));

  const revPath = revPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const revArea = `${revPath} L ${revPoints[revPoints.length - 1].x} ${
    padding.top + innerH
  } L ${revPoints[0].x} ${padding.top + innerH} Z`;
  const occPath = occPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Revenue × Occupancy
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            7-month platform performance
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="size-2 rounded-full bg-[#FF5000]" />
            Revenue (₦M)
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="size-2 rounded-full bg-slate-900" />
            Occupancy %
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF5000" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FF5000" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerH * t}
            y2={padding.top + innerH * t}
            stroke="#F1F5F9"
            strokeWidth="1"
          />
        ))}
        <path d={revArea} fill="url(#rev-area)" />
        <path d={revPath} fill="none" stroke="#FF5000" strokeWidth="2" />
        <path
          d={occPath}
          fill="none"
          stroke="#0F172A"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        {revPoints.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="3" fill="#FF5000" />
            <text
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-slate-500"
              fontSize="10"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">
            Net revenue
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {formatNaira(FINANCIAL_HEALTH.netRevenueMonth)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">
            Forecast
          </div>
          <div className="text-sm font-semibold text-emerald-600">
            {formatNaira(FINANCIAL_HEALTH.forecastNextMonth)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">
            Collection
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {FINANCIAL_HEALTH.collectionRate}%
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Risk signals stack ──────────────────────────────────────────
function RiskSignals() {
  return (
    <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="size-7 rounded-md bg-[#FF5000]/20 text-[#FF8A3D] flex items-center justify-center">
          <Sparkles className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Risk & Anomaly Signals</h3>
          <p className="text-[11px] text-slate-400">
            Flagged by platform intelligence
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {RISK_SIGNALS.map((s) => {
          const Icon =
            s.severity === "critical" ? AlertOctagon : AlertTriangle;
          const tone =
            s.severity === "critical"
              ? "bg-red-500/15 text-red-300"
              : "bg-amber-500/15 text-amber-300";
          return (
            <li
              key={s.label}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50"
            >
              <span
                className={`size-7 rounded-md flex items-center justify-center shrink-0 ${tone}`}
              >
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">
                  {s.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {s.detail}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Apartment mix donut + breakdown ──────────────────────────────
function ApartmentMix() {
  const total = APARTMENT_TYPE_MIX.reduce((s, t) => s + t.count, 0);
  const colors = ["#FF5000", "#FB923C", "#0F172A", "#64748B", "#CBD5E1"];

  // Stacked horizontal bar
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Apartment Mix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Most rented · {total.toLocaleString()} units
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          1-Bed leads
        </span>
      </div>

      <div className="flex h-3 w-full rounded-full overflow-hidden mb-4">
        {APARTMENT_TYPE_MIX.map((t, i) => (
          <div
            key={t.type}
            style={{ width: `${t.share}%`, backgroundColor: colors[i] }}
            title={`${t.type}: ${t.share}%`}
          />
        ))}
      </div>

      <ul className="space-y-2.5">
        {APARTMENT_TYPE_MIX.map((t, i) => (
          <li key={t.type} className="flex items-center gap-3 text-sm">
            <span
              className="size-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: colors[i] }}
            />
            <span className="flex-1 text-slate-700">{t.type}</span>
            <span className="text-slate-500 tabular-nums text-xs">
              {t.count.toLocaleString()}
            </span>
            <span className="text-slate-900 font-semibold tabular-nums w-12 text-right">
              {t.share}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Tenant intelligence block ────────────────────────────────────
function GenderDonut() {
  const size = 120;
  const r = 48;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="shrink-0">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth="14"
        />
        {TENANT_GENDER.map((g) => {
          const len = (g.value / 100) * c;
          const dasharray = `${len} ${c - len}`;
          const el = (
            <circle
              key={g.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={g.color}
              strokeWidth="14"
              strokeDasharray={dasharray}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += len;
          return el;
        })}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          className="fill-slate-900"
          fontSize="14"
          fontWeight="600"
        >
          {TENANT_GENDER[0].value}%
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-slate-400"
          fontSize="9"
        >
          Male
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {TENANT_GENDER.map((g) => (
          <li key={g.label} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: g.color }}
            />
            <span className="text-slate-600 text-xs w-20">{g.label}</span>
            <span className="font-semibold text-slate-900 tabular-nums text-xs">
              {g.value}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AgeBands() {
  const max = Math.max(...TENANT_AGE_BANDS.map((b) => b.count));
  return (
    <ul className="space-y-2.5">
      {TENANT_AGE_BANDS.map((b) => {
        const pct = (b.count / max) * 100;
        return (
          <li key={b.band}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium">{b.band}</span>
              <span className="text-slate-500 tabular-nums">
                {b.count.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF5000] to-[#FB923C]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TenantGrowthBars() {
  const max = Math.max(
    ...TENANT_GROWTH.map((d) => Math.max(d.new, d.churned)),
  );
  return (
    <div>
      <div className="flex items-end gap-2 h-32 mb-2">
        {TENANT_GROWTH.map((d) => (
          <div
            key={d.month}
            className="flex-1 flex flex-col items-center gap-0.5 justify-end"
          >
            <div className="w-full flex gap-0.5 items-end">
              <div
                className="flex-1 bg-[#FF5000] rounded-t"
                style={{ height: `${(d.new / max) * 100}px` }}
                title={`+${d.new} new`}
              />
              <div
                className="flex-1 bg-slate-300 rounded-t"
                style={{ height: `${(d.churned / max) * 100}px` }}
                title={`-${d.churned} churned`}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1">{d.month}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[#FF5000]" />
          New tenants
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-slate-300" />
          Churned
        </span>
        <span className="font-semibold text-emerald-600">
          Net +{TENANT_GROWTH[TENANT_GROWTH.length - 1].new -
            TENANT_GROWTH[TENANT_GROWTH.length - 1].churned}{" "}
          this month
        </span>
      </div>
    </div>
  );
}

// ─── Location heat-table ──────────────────────────────────────────
function vacancyHeat(v: number) {
  if (v >= 18) return "bg-red-500/90 text-white";
  if (v >= 12) return "bg-amber-500/90 text-white";
  if (v >= 7) return "bg-amber-200 text-amber-900";
  return "bg-emerald-200 text-emerald-900";
}

function LocationHeatmap() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between p-5 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Geographic Performance
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Occupancy, rent, and vacancy by area
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500">
          <span className="size-3 rounded-sm bg-emerald-200" />
          Healthy
          <span className="size-3 rounded-sm bg-amber-200" />
          Watch
          <span className="size-3 rounded-sm bg-amber-500/90" />
          High
          <span className="size-3 rounded-sm bg-red-500/90" />
          Critical
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50">
              <th className="px-5 py-3 font-semibold">Area</th>
              <th className="px-5 py-3 font-semibold text-right">Properties</th>
              <th className="px-5 py-3 font-semibold text-right">Occupancy</th>
              <th className="px-5 py-3 font-semibold text-right">Avg rent</th>
              <th className="px-5 py-3 font-semibold text-right">Vacancy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {LOCATION_BREAKDOWN.map((l) => (
              <tr key={l.area} className="hover:bg-slate-50/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-900">
                      {l.area}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                  {l.properties}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium text-slate-900">
                  {l.occupancy}%
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                  ₦{(l.avgRent / 1_000_000).toFixed(1)}M
                </td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={`inline-flex items-center justify-end font-semibold text-[11px] px-2 py-1 rounded-md tabular-nums ${vacancyHeat(
                      l.vacancy,
                    )}`}
                  >
                    {l.vacancy}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Financial: arrears aging ─────────────────────────────────────
function ArrearsAging() {
  const total = AGING_BUCKETS.reduce((s, b) => s + b.amount, 0);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Arrears Aging
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Outstanding rent · {FINANCIAL_HEALTH.tenantsOwing} tenants
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-red-600 tabular-nums">
            {formatNaira(FINANCIAL_HEALTH.totalOverdue)}
          </div>
          <div className="text-[10px] text-slate-400">total overdue</div>
        </div>
      </div>

      <ul className="space-y-3">
        {AGING_BUCKETS.map((b) => {
          const pct = (b.amount / total) * 100;
          return (
            <li key={b.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">{b.label}</span>
                <span className="text-slate-500">
                  {b.count} tenants ·{" "}
                  <span className="font-semibold text-slate-900">
                    {formatNaira(b.amount)}
                  </span>
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    b.label.startsWith("60+")
                      ? "bg-red-500"
                      : b.label.startsWith("31")
                        ? "bg-orange-500"
                        : b.label.startsWith("8")
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── KYC funnel ───────────────────────────────────────────────────
function KycFunnel() {
  const max = KYC_FUNNEL[0].count;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">KYC Funnel</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Approval {KYC_RATES.approvalRate}% · Avg review{" "}
            {KYC_RATES.avgReviewHours}h
          </p>
        </div>
        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
          {KYC_RATES.pendingOver48h} stuck &gt;48h
        </span>
      </div>

      <ul className="space-y-2">
        {KYC_FUNNEL.map((s) => {
          const pct = (s.count / max) * 100;
          const tone =
            s.stage === "Approved"
              ? "bg-emerald-500"
              : s.stage === "Rejected"
                ? "bg-red-500"
                : s.stage === "In Review"
                  ? "bg-amber-400"
                  : "bg-slate-300";
          return (
            <li key={s.stage} className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-700 w-24 shrink-0">
                {s.stage}
              </span>
              <div className="flex-1 h-7 bg-slate-50 rounded-md overflow-hidden relative">
                <div
                  className={`h-full ${tone} transition-all`}
                  style={{ width: `${pct}%` }}
                />
                <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-slate-900">
                  {s.count.toLocaleString()}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Top / problematic properties ────────────────────────────────
function TopProperties() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Star className="size-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-900">
          Top-Performing Properties
        </h3>
      </div>
      <ul className="space-y-3">
        {TOP_PERFORMING_PROPERTIES.map((p, i) => (
          <li
            key={p.name}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
          >
            <span className="size-7 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 text-sm truncate">
                {p.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {p.location} · {p.occupancy}% occupancy
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-slate-900 tabular-nums">
                {formatNaira(p.revenue)}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold">
                Score {p.score}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProblemProperties() {
  const RISK_TONE: Record<string, string> = {
    High: "bg-red-50 text-red-700",
    Medium: "bg-amber-50 text-amber-700",
    Low: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="size-4 text-red-600" />
        <h3 className="text-sm font-semibold text-slate-900">
          Properties Needing Attention
        </h3>
      </div>
      <ul className="space-y-3">
        {PROBLEMATIC_PROPERTIES.map((p) => (
          <li
            key={p.name}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
          >
            <span className="size-7 rounded-md bg-red-50 text-red-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 text-sm truncate">
                {p.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {p.location} · {p.openIssues} open · avg{" "}
                {p.avgResolutionDays}d
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${RISK_TONE[p.risk]}`}
            >
              {p.risk}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Lease renewals + top FMs + activity ─────────────────────────
function LeaseRenewalCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="size-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900">Lease Renewals</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">
            Next 30 days
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">
            {LEASE_RENEWALS.upForRenewal30d}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">
            Next 90 days
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">
            {LEASE_RENEWALS.upForRenewal90d}
          </div>
        </div>
      </div>
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Renewal rate</span>
          <span className="font-semibold text-emerald-600">
            {LEASE_RENEWALS.renewalRate}%
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Decline rate</span>
          <span className="font-semibold text-red-600">
            {LEASE_RENEWALS.declineRate}%
          </span>
        </div>
      </div>
    </div>
  );
}

function TopFacilityManagers() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="size-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-slate-900">
          Top Facility Managers
        </h3>
      </div>
      <ul className="space-y-3">
        {TOP_FACILITY_MANAGERS.map((fm) => (
          <li key={fm.name} className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {fm.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 truncate">
                {fm.name}
              </div>
              <div className="text-[11px] text-slate-500">
                {fm.resolved} resolved · avg {fm.avgHours}h
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              <Star className="size-3 fill-current" />
              {fm.rating}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ACTIVITY_ICON = {
  property: Home,
  service: Wrench,
  kyc: ShieldCheck,
  payment: CreditCard,
  lease: CheckCircle2,
} as const;

const ACTIVITY_COLOR = {
  property: "bg-blue-50 text-blue-600",
  service: "bg-amber-50 text-amber-600",
  kyc: "bg-violet-50 text-violet-600",
  payment: "bg-emerald-50 text-emerald-600",
  lease: "bg-slate-100 text-slate-600",
} as const;

function ActivityFeed() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">
            Live Operations Feed
          </h3>
        </div>
        <button className="text-xs font-semibold text-[#FF5000] hover:text-[#E04500] inline-flex items-center gap-0.5">
          View all
          <ArrowUpRight className="size-3" />
        </button>
      </div>
      <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {ACTIVITY_FEED.map((a) => {
          const Icon =
            ACTIVITY_ICON[a.type as keyof typeof ACTIVITY_ICON] || Activity;
          const color =
            ACTIVITY_COLOR[a.type as keyof typeof ACTIVITY_COLOR] ||
            "bg-slate-100 text-slate-600";
          return (
            <li key={a.id} className="flex items-start gap-3">
              <span
                className={`size-8 rounded-full flex items-center justify-center shrink-0 ${color}`}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900">
                    {a.actor}
                  </span>{" "}
                  <span className="text-slate-500">({a.role})</span> {a.action}{" "}
                  <span className="font-medium text-slate-900">{a.target}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{a.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Mission Control"
        subtitle="Real-time intelligence across the Lizt ecosystem."
      />

      {/* PLATFORM HEALTH */}
      <SectionHeader
        eyebrow="Platform Health"
        title="At a glance"
        description="Top-line metrics across the entire platform."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 mb-8">
        <KpiCard
          label="Total Properties"
          value={ADMIN_KPIS.totalProperties.toLocaleString()}
          delta={{ value: "+4.2%", up: true }}
          icon={Building2}
        />
        <KpiCard
          label="Total Tenants"
          value={ADMIN_KPIS.totalTenants.toLocaleString()}
          delta={{ value: "+8.4%", up: true }}
          icon={UserCheck}
        />
        <KpiCard
          label="Total Landlords"
          value={ADMIN_KPIS.totalLandlords.toLocaleString()}
          delta={{ value: "+12", up: true }}
          icon={Users}
        />
        <KpiCard
          label="Facility Managers"
          value={ADMIN_KPIS.totalFacilityManagers}
          delta={{ value: "+2", up: true }}
          icon={Wrench}
        />
        <KpiCard
          label="Occupancy Rate"
          value={`${ADMIN_KPIS.occupancyRate}%`}
          delta={{ value: "+1.8pp", up: true }}
          icon={TrendingUp}
          tone="success"
          hint="92.7% in premium areas"
        />
        <KpiCard
          label="Pending KYC"
          value={ADMIN_KPIS.pendingKyc}
          delta={{ value: "+6", up: false }}
          icon={ShieldCheck}
          tone="warning"
          hint={`${KYC_RATES.pendingOver48h} stuck > 48h`}
        />
        <KpiCard
          label="Open Service Reqs"
          value={ADMIN_KPIS.openServiceRequests}
          delta={{ value: "-3.1%", up: true }}
          icon={Headphones}
          tone="warning"
        />
        <KpiCard
          label="Active Leases"
          value={ADMIN_KPIS.activeLeases.toLocaleString()}
          delta={{ value: "+2.4%", up: true }}
          icon={CheckCircle2}
        />
      </div>

      {/* FINANCIAL INSIGHTS */}
      <SectionHeader
        eyebrow="Financial Insights"
        title="Revenue, collection & risk"
        description="Where the platform stands financially this cycle."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <DualTrendChart />
        </div>
        <RiskSignals />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <KpiCard
          label="Total Overdue"
          value={formatNaira(FINANCIAL_HEALTH.totalOverdue)}
          delta={{ value: "+5.4%", up: false }}
          icon={Wallet}
          tone="danger"
          hint={`${FINANCIAL_HEALTH.tenantsOwing} tenants owing`}
        />
        <KpiCard
          label="Collection Rate"
          value={`${FINANCIAL_HEALTH.collectionRate}%`}
          delta={{ value: "+0.6pp", up: true }}
          icon={TrendingUp}
          tone="success"
          hint={`Avg arrears ${FINANCIAL_HEALTH.avgArrearsDays} days`}
        />
        <KpiCard
          label="Forecast (Next Mo.)"
          value={formatNaira(FINANCIAL_HEALTH.forecastNextMonth)}
          delta={{ value: "+8.2%", up: true }}
          icon={CreditCard}
          tone="success"
          hint="Driven by lease renewals"
        />
      </div>
      <div className="mb-10">
        <ArrearsAging />
      </div>

      {/* TENANT INTELLIGENCE */}
      <SectionHeader
        eyebrow="Tenant Intelligence"
        title="Who lives on the platform"
        description="Demographics, growth, and behavior."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Gender Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">Tenant base composition</p>
          <GenderDonut />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Age Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Avg age band: <span className="font-semibold text-slate-700">25–34</span>
          </p>
          <AgeBands />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Tenant Growth & Churn
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Net additions per month
          </p>
          <TenantGrowthBars />
        </div>
      </div>

      {/* PROPERTY INTELLIGENCE */}
      <SectionHeader
        eyebrow="Property Intelligence"
        title="Where the value sits"
        description="Mix, geography, and outliers."
      />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-2">
          <ApartmentMix />
        </div>
        <div className="lg:col-span-3">
          <LocationHeatmap />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        <TopProperties />
        <ProblemProperties />
      </div>

      {/* OPERATIONAL ACTIVITY */}
      <SectionHeader
        eyebrow="Operations"
        title="What's happening right now"
        description="Live feed, renewals, and team performance."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <KycFunnel />
        <LeaseRenewalCard />
        <TopFacilityManagers />
      </div>

      <ActivityFeed />
    </div>
  );
}
