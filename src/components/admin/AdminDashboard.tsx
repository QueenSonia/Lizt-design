"use client";
import {
  Building2,
  Users,
  UserCheck,
  ShieldCheck,
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
  MapPin,
  RefreshCw,
  Wallet,
  Flame,
  Star,
  ChevronRight,
  Clock,
  XCircle,
  CalendarClock,
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

// ─── Section heading ───────────────────────────────────────────────
function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {action && (
        <button className="text-xs font-semibold text-[#FF5000] hover:text-[#e04500] inline-flex items-center gap-0.5 shrink-0">
          {action} <ChevronRight className="size-3" />
        </button>
      )}
    </div>
  );
}

// ─── Section divider ───────────────────────────────────────────────
function Divider() {
  return <div className="border-t border-slate-100 my-8" />;
}

// ─── Needs Attention card ──────────────────────────────────────────
function AttentionCard({
  icon: Icon,
  count,
  label,
  detail,
  tone,
  cta,
}: {
  icon: typeof ShieldCheck;
  count: string | number;
  label: string;
  detail: string;
  tone: "warning" | "danger" | "info" | "neutral";
  cta?: string;
}) {
  const styles = {
    warning: {
      bg: "bg-amber-50 border-amber-200",
      icon: "bg-amber-100 text-amber-700",
      count: "text-amber-800",
      dot: "bg-amber-500",
    },
    danger: {
      bg: "bg-red-50 border-red-200",
      icon: "bg-red-100 text-red-700",
      count: "text-red-800",
      dot: "bg-red-500",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: "bg-blue-100 text-blue-700",
      count: "text-blue-800",
      dot: "bg-blue-500",
    },
    neutral: {
      bg: "bg-slate-50 border-slate-200",
      icon: "bg-slate-100 text-slate-600",
      count: "text-slate-800",
      dot: "bg-slate-400",
    },
  }[tone];

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${styles.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${styles.icon}`}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-2xl font-bold tabular-nums leading-none ${styles.count}`}>{count}</div>
          <div className="text-sm font-semibold text-slate-800 mt-0.5">{label}</div>
        </div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{detail}</p>
      {cta && (
        <button className="self-start inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900">
          {cta} <ArrowUpRight className="size-3" />
        </button>
      )}
    </div>
  );
}

// ─── KPI metric card ──────────────────────────────────────────────
function MetricCard({
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
  const iconStyle = {
    default: "text-slate-600 bg-slate-100",
    warning: "text-amber-700 bg-amber-100",
    danger: "text-red-700 bg-red-100",
    success: "text-emerald-700 bg-emerald-100",
  }[tone];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`size-8 rounded-lg flex items-center justify-center ${iconStyle}`}>
          <Icon className="size-3.5" />
        </div>
        {delta && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            delta.up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}>
            {delta.up ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
            {delta.value}
          </span>
        )}
      </div>
      <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
      {hint && <div className="text-[10px] text-slate-400 mt-1.5 truncate">{hint}</div>}
    </div>
  );
}

// ─── Revenue + Occupancy chart ────────────────────────────────────
function RevenueTrendChart() {
  const width = 600;
  const height = 160;
  const pad = { top: 10, right: 14, bottom: 24, left: 14 };
  const iW = width - pad.left - pad.right;
  const iH = height - pad.top - pad.bottom;

  const revMax = Math.max(...REVENUE_TREND.map((d) => d.revenue));
  const revMin = Math.min(...REVENUE_TREND.map((d) => d.revenue));
  const revRange = revMax - revMin || 1;

  const pts = REVENUE_TREND.map((d, i) => ({
    x: pad.left + (i * iW) / (REVENUE_TREND.length - 1),
    y: pad.top + iH - ((d.revenue - revMin) / revRange) * iH,
    label: d.month,
    rev: d.revenue,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pad.top + iH} L ${pts[0].x} ${pad.top + iH} Z`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Revenue Trend</h3>
          <p className="text-xs text-slate-500 mt-0.5">Platform revenue · last 7 months (₦M)</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-slate-900 tabular-nums">{formatNaira(FINANCIAL_HEALTH.netRevenueMonth)}</div>
          <div className="text-[10px] text-emerald-600 font-semibold">↑ 8.2% forecast</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF5000" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FF5000" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.33, 0.66].map((t) => (
          <line key={t} x1={pad.left} x2={width - pad.right} y1={pad.top + iH * t} y2={pad.top + iH * t} stroke="#F1F5F9" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="url(#rev-grad)" />
        <path d={linePath} fill="none" stroke="#FF5000" strokeWidth="2" strokeLinejoin="round" />
        {pts.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="3" fill="#FF5000" />
            <text x={p.x} y={height - 6} textAnchor="middle" className="fill-slate-400" fontSize="9">{p.label}</text>
          </g>
        ))}
      </svg>
      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
        <div>
          <div className="text-slate-400 text-[10px] uppercase tracking-wide">Net revenue</div>
          <div className="font-semibold text-slate-900 mt-0.5">{formatNaira(FINANCIAL_HEALTH.netRevenueMonth)}</div>
        </div>
        <div>
          <div className="text-slate-400 text-[10px] uppercase tracking-wide">Forecast</div>
          <div className="font-semibold text-emerald-600 mt-0.5">{formatNaira(FINANCIAL_HEALTH.forecastNextMonth)}</div>
        </div>
        <div>
          <div className="text-slate-400 text-[10px] uppercase tracking-wide">Collection</div>
          <div className="font-semibold text-slate-900 mt-0.5">{FINANCIAL_HEALTH.collectionRate}%</div>
        </div>
      </div>
    </div>
  );
}

// ─── Arrears aging (compact) ──────────────────────────────────────
function ArrearsAging() {
  const total = AGING_BUCKETS.reduce((s, b) => s + b.amount, 0);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Arrears Aging</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {FINANCIAL_HEALTH.tenantsOwing} tenants · overdue rent outstanding
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-red-600 tabular-nums">{formatNaira(FINANCIAL_HEALTH.totalOverdue)}</div>
          <div className="text-[10px] text-slate-400">total overdue</div>
        </div>
      </div>
      <ul className="space-y-2.5">
        {AGING_BUCKETS.map((b) => {
          const pct = (b.amount / total) * 100;
          const barColor =
            b.label.startsWith("60+") ? "bg-red-500" :
            b.label.startsWith("31") ? "bg-orange-500" :
            b.label.startsWith("8") ? "bg-amber-400" : "bg-emerald-400";
          return (
            <li key={b.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">{b.label}</span>
                <span className="text-slate-500">{b.count} tenants · <span className="font-semibold text-slate-900">{formatNaira(b.amount)}</span></span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Recent Activity feed ─────────────────────────────────────────
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
          <Activity className="size-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
        </div>
        <button className="text-xs font-semibold text-[#FF5000] hover:text-[#E04500] inline-flex items-center gap-0.5">
          View all <ArrowUpRight className="size-3" />
        </button>
      </div>
      <ul className="space-y-3.5">
        {ACTIVITY_FEED.map((a) => {
          const Icon = ACTIVITY_ICON[a.type as keyof typeof ACTIVITY_ICON] || Activity;
          const color = ACTIVITY_COLOR[a.type as keyof typeof ACTIVITY_COLOR] || "bg-slate-100 text-slate-600";
          return (
            <li key={a.id} className="flex items-start gap-3">
              <span className={`size-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900">{a.actor}</span>{" "}
                  <span className="text-slate-400 text-[11px]">({a.role})</span>{" "}
                  {a.action}{" "}
                  <span className="font-medium text-slate-800">{a.target}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── KYC funnel (compact) ─────────────────────────────────────────
function KycFunnel() {
  const max = KYC_FUNNEL[0].count;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">KYC Funnel</h3>
          <p className="text-xs text-slate-500 mt-0.5">Approval {KYC_RATES.approvalRate}% · avg {KYC_RATES.avgReviewHours}h review</p>
        </div>
        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          {KYC_RATES.pendingOver48h} stuck &gt;48h
        </span>
      </div>
      <ul className="space-y-2">
        {KYC_FUNNEL.map((s) => {
          const pct = (s.count / max) * 100;
          const tone =
            s.stage === "Approved" ? "bg-emerald-500" :
            s.stage === "Rejected" ? "bg-red-500" :
            s.stage === "In Review" ? "bg-amber-400" : "bg-slate-300";
          return (
            <li key={s.stage} className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-slate-600 w-20 shrink-0">{s.stage}</span>
              <div className="flex-1 h-6 bg-slate-50 rounded-md overflow-hidden relative">
                <div className={`h-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
                <span className="absolute inset-0 flex items-center px-2 text-[11px] font-semibold text-slate-800">{s.count.toLocaleString()}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Lease renewals (compact) ─────────────────────────────────────
function LeaseRenewals() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="size-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-slate-900">Lease Renewals</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Next 30 days</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{LEASE_RENEWALS.upForRenewal30d}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Next 90 days</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{LEASE_RENEWALS.upForRenewal90d}</div>
        </div>
      </div>
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Renewal rate</span>
          <span className="font-semibold text-emerald-600">{LEASE_RENEWALS.renewalRate}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Decline rate</span>
          <span className="font-semibold text-red-600">{LEASE_RENEWALS.declineRate}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Top/problem properties ───────────────────────────────────────
function TopProperties() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Star className="size-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-900">Top-Performing Properties</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {TOP_PERFORMING_PROPERTIES.map((p, i) => (
          <li key={p.name} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="size-6 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 text-sm truncate">{p.name}</div>
              <div className="text-[10px] text-slate-500">{p.location} · {p.occupancy}% occ.</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-semibold text-slate-900 tabular-nums">{formatNaira(p.revenue)}</div>
              <div className="text-[10px] text-emerald-600 font-semibold">Score {p.score}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProblemProperties() {
  const RISK_TONE: Record<string, string> = {
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="size-4 text-red-500" />
        <h3 className="text-sm font-semibold text-slate-900">Properties Needing Attention</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {PROBLEMATIC_PROPERTIES.map((p) => (
          <li key={p.name} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="size-6 rounded-md bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-3" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 text-sm truncate">{p.name}</div>
              <div className="text-[10px] text-slate-500">{p.location} · {p.openIssues} open · avg {p.avgResolutionDays}d</div>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${RISK_TONE[p.risk]}`}>{p.risk}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Apartment mix (compact) ──────────────────────────────────────
function ApartmentMix() {
  const total = APARTMENT_TYPE_MIX.reduce((s, t) => s + t.count, 0);
  const colors = ["#FF5000", "#FB923C", "#0F172A", "#64748B", "#CBD5E1"];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-0.5">Apartment Mix</h3>
      <p className="text-xs text-slate-500 mb-4">{total.toLocaleString()} units across platform</p>
      <div className="flex h-2 w-full rounded-full overflow-hidden mb-4">
        {APARTMENT_TYPE_MIX.map((t, i) => (
          <div key={t.type} style={{ width: `${t.share}%`, backgroundColor: colors[i] }} title={`${t.type}: ${t.share}%`} />
        ))}
      </div>
      <ul className="space-y-2">
        {APARTMENT_TYPE_MIX.map((t, i) => (
          <li key={t.type} className="flex items-center gap-2.5 text-xs">
            <span className="size-2 rounded-sm shrink-0" style={{ backgroundColor: colors[i] }} />
            <span className="flex-1 text-slate-600">{t.type}</span>
            <span className="text-slate-400 tabular-nums">{t.count.toLocaleString()}</span>
            <span className="font-semibold text-slate-800 tabular-nums w-10 text-right">{t.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Location table (compact) ─────────────────────────────────────
function vacancyHeat(v: number) {
  if (v >= 18) return "bg-red-500/90 text-white";
  if (v >= 12) return "bg-amber-400/90 text-white";
  if (v >= 7) return "bg-amber-200 text-amber-900";
  return "bg-emerald-100 text-emerald-800";
}

function LocationTable() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Geographic Performance</h3>
          <p className="text-xs text-slate-500 mt-0.5">Occupancy & vacancy by area</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-2.5 font-semibold">Area</th>
              <th className="px-4 py-2.5 font-semibold text-right">Props</th>
              <th className="px-4 py-2.5 font-semibold text-right">Occ.</th>
              <th className="px-4 py-2.5 font-semibold text-right">Avg rent</th>
              <th className="px-4 py-2.5 font-semibold text-right">Vacancy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {LOCATION_BREAKDOWN.map((l) => (
              <tr key={l.area} className="hover:bg-slate-50/50">
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3 text-slate-300" />
                    <span className="font-medium text-slate-800 text-xs">{l.area}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right text-xs tabular-nums text-slate-500">{l.properties}</td>
                <td className="px-4 py-2.5 text-right text-xs tabular-nums font-semibold text-slate-800">{l.occupancy}%</td>
                <td className="px-4 py-2.5 text-right text-xs tabular-nums text-slate-500">₦{(l.avgRent / 1_000_000).toFixed(1)}M</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`inline-flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums ${vacancyHeat(l.vacancy)}`}>
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

// ─── Tenant demographics (compact row) ────────────────────────────
function GenderDonut() {
  const size = 100;
  const r = 38;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="12" />
        {TENANT_GENDER.map((g) => {
          const len = (g.value / 100) * c;
          const el = (
            <circle key={g.label} cx={cx} cy={cy} r={r} fill="none" stroke={g.color} strokeWidth="12"
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform={`rotate(-90 ${cx} ${cy})`} />
          );
          offset += len;
          return el;
        })}
        <text x={cx} y={cy - 1} textAnchor="middle" className="fill-slate-900" fontSize="13" fontWeight="700">{TENANT_GENDER[0].value}%</text>
        <text x={cx} y={cy + 11} textAnchor="middle" className="fill-slate-400" fontSize="8">Male</text>
      </svg>
      <ul className="space-y-1.5">
        {TENANT_GENDER.map((g) => (
          <li key={g.label} className="flex items-center gap-2 text-xs">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
            <span className="text-slate-500 w-20">{g.label}</span>
            <span className="font-semibold text-slate-800 tabular-nums">{g.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AgeBands() {
  const max = Math.max(...TENANT_AGE_BANDS.map((b) => b.count));
  return (
    <ul className="space-y-2">
      {TENANT_AGE_BANDS.map((b) => (
        <li key={b.band}>
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="text-slate-600 font-medium">{b.band}</span>
            <span className="text-slate-400 tabular-nums">{b.count.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#FF5000] to-[#FB923C]" style={{ width: `${(b.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TenantGrowthBars() {
  const max = Math.max(...TENANT_GROWTH.map((d) => Math.max(d.new, d.churned)));
  return (
    <div>
      <div className="flex items-end gap-1.5 h-24 mb-2">
        {TENANT_GROWTH.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5 justify-end">
            <div className="w-full flex gap-px items-end">
              <div className="flex-1 bg-[#FF5000] rounded-t" style={{ height: `${(d.new / max) * 80}px` }} />
              <div className="flex-1 bg-slate-200 rounded-t" style={{ height: `${(d.churned / max) * 80}px` }} />
            </div>
            <span className="text-[9px] text-slate-400">{d.month}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-[#FF5000]" />New</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-slate-200" />Churned</span>
        <span className="font-semibold text-emerald-600">Net +{TENANT_GROWTH[TENANT_GROWTH.length - 1].new - TENANT_GROWTH[TENANT_GROWTH.length - 1].churned} this month</span>
      </div>
    </div>
  );
}

// ─── Top Facility Managers (compact) ─────────────────────────────
function TopFacilityManagers() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="size-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900">Top Facility Managers</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {TOP_FACILITY_MANAGERS.map((fm) => (
          <li key={fm.name} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="size-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {fm.name.split(" ").map((p) => p[0]).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 truncate">{fm.name}</div>
              <div className="text-[10px] text-slate-500">{fm.resolved} resolved · avg {fm.avgHours}h</div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              <Star className="size-2.5 fill-current" />{fm.rating}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function AdminDashboard() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-6 lg:p-8 max-w-[1280px] mx-auto space-y-0">

      {/* ── Header ───────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Platform Operations"
        subtitle={today}
      />

      {/* ── Needs Attention Today ─────────────────────────────────── */}
      <div className="mb-8">
        <SectionHeader
          title="Needs Attention Today"
          description="Actionable items requiring your review."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AttentionCard
            icon={ShieldCheck}
            count={ADMIN_KPIS.pendingKyc}
            label="Pending KYC Applications"
            detail={`${KYC_RATES.pendingOver48h} applications have been waiting more than 48 hours. Review needed.`}
            tone="warning"
            cta="Review KYC"
          />
          <AttentionCard
            icon={Wrench}
            count={ADMIN_KPIS.openServiceRequests}
            label="Open Maintenance Requests"
            detail="Across all properties. 14 at Cedar Park flagged for FM review."
            tone="warning"
            cta="View requests"
          />
          <AttentionCard
            icon={XCircle}
            count={8}
            label="Failed Payments"
            detail="Payment failure spike detected — 8 failures in last hour, 3.2× normal rate."
            tone="danger"
            cta="Investigate"
          />
          <AttentionCard
            icon={CalendarClock}
            count={LEASE_RENEWALS.upForRenewal30d}
            label="Leases Expiring in 30 Days"
            detail="Landlords should be notified to begin renewal discussions with tenants."
            tone="info"
            cta="View leases"
          />
          <AttentionCard
            icon={Wallet}
            count={FINANCIAL_HEALTH.tenantsOwing}
            label="Tenants with Overdue Rent"
            detail={`${formatNaira(FINANCIAL_HEALTH.totalOverdue)} outstanding. 8 tenants overdue more than 60 days.`}
            tone="danger"
            cta="View overdue"
          />
          <AttentionCard
            icon={Users}
            count={4}
            label="Landlords Requiring Attention"
            detail="Pending verification, low KYC approval rates, or high unresolved maintenance load."
            tone="neutral"
            cta="Review landlords"
          />
        </div>
      </div>

      <Divider />

      {/* ── Key Metrics ───────────────────────────────────────────── */}
      <div className="mb-8">
        <SectionHeader title="Platform Overview" description="Top-line health of the Lizt platform." />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="Total Properties" value={ADMIN_KPIS.totalProperties.toLocaleString()} delta={{ value: "+4.2%", up: true }} icon={Building2} />
          <MetricCard label="Total Landlords" value={ADMIN_KPIS.totalLandlords.toLocaleString()} delta={{ value: "+12", up: true }} icon={Users} />
          <MetricCard label="Total Tenants" value={ADMIN_KPIS.totalTenants.toLocaleString()} delta={{ value: "+8.4%", up: true }} icon={UserCheck} />
          <MetricCard label="Occupancy Rate" value={`${ADMIN_KPIS.occupancyRate}%`} delta={{ value: "+1.8pp", up: true }} icon={TrendingUp} tone="success" hint="92.7% in premium areas" />
          <MetricCard label="Pending KYC" value={ADMIN_KPIS.pendingKyc} delta={{ value: "+6", up: false }} icon={ShieldCheck} tone="warning" hint={`${KYC_RATES.pendingOver48h} stuck >48h`} />
          <MetricCard label="Open Maintenance" value={ADMIN_KPIS.openServiceRequests} delta={{ value: "-3.1%", up: true }} icon={Wrench} tone="warning" />
        </div>
      </div>

      <Divider />

      {/* ── Recent Activity ───────────────────────────────────────── */}
      <div className="mb-8">
        <SectionHeader title="Recent Activity" description="Latest platform events across all users." action="View all activity" />
        <ActivityFeed />
      </div>

      <Divider />

      {/* ── Financial Insights ────────────────────────────────────── */}
      <div className="mb-8">
        <SectionHeader title="Financial Insights" description="Revenue, collection and rent arrears." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueTrendChart />
          <ArrearsAging />
        </div>
      </div>

      <Divider />

      {/* ── Operations Intelligence ───────────────────────────────── */}
      <div className="mb-8">
        <SectionHeader title="Operations Intelligence" description="KYC pipeline, lease renewals and facility performance." />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <KycFunnel />
          <LeaseRenewals />
          <TopFacilityManagers />
        </div>
      </div>

      <Divider />

      {/* ── Property & Tenant Intelligence ───────────────────────── */}
      <div className="mb-8">
        <SectionHeader title="Property & Tenant Intelligence" description="Where value sits and who lives on the platform." />

        {/* Properties */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <TopProperties />
          <ProblemProperties />
        </div>

        {/* Geography */}
        <div className="mb-4">
          <LocationTable />
        </div>

        {/* Tenant demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-0.5">Gender Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Tenant base composition</p>
            <GenderDonut />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-0.5">Age Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Avg band: <span className="font-semibold text-slate-700">25–34</span></p>
            <AgeBands />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-0.5">Tenant Growth & Churn</h3>
            <p className="text-xs text-slate-500 mb-4">Net additions per month</p>
            <TenantGrowthBars />
          </div>
        </div>

        {/* Apartment mix */}
        <div className="mt-4">
          <ApartmentMix />
        </div>
      </div>

    </div>
  );
}
