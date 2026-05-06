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
} from "lucide-react";
import { AdminPageHeader } from "./AdminPageHeader";
import {
  ADMIN_KPIS,
  REVENUE_TREND,
  RECENT_PAYMENTS,
  ACTIVITY_FEED,
} from "./adminMockData";

const formatNaira = (n: number) =>
  `₦${(n / 1_000_000).toLocaleString("en-NG", { maximumFractionDigits: 1 })}M`;

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  delta?: { value: string; up: boolean };
  icon: typeof Building2;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClass = {
    default: "text-slate-700 bg-slate-50",
    warning: "text-amber-700 bg-amber-50",
    danger: "text-red-700 bg-red-50",
    success: "text-emerald-700 bg-emerald-50",
  }[tone];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`size-10 rounded-lg flex items-center justify-center ${toneClass}`}>
          <Icon className="size-5" />
        </div>
        {delta && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
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
      <div className="text-2xl font-semibold text-slate-900 tracking-tight">
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function RevenueChart() {
  const max = Math.max(...REVENUE_TREND.map((d) => d.revenue));
  const min = Math.min(...REVENUE_TREND.map((d) => d.revenue));
  const range = max - min || 1;

  const width = 600;
  const height = 180;
  const padding = { top: 10, right: 10, bottom: 24, left: 10 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const points = REVENUE_TREND.map((d, i) => {
    const x = padding.left + (i * innerW) / (REVENUE_TREND.length - 1);
    const y =
      padding.top + innerH - ((d.revenue - min) / range) * innerH;
    return { x, y, label: d.month, value: d.revenue };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${path} L ${points[points.length - 1].x} ${
    padding.top + innerH
  } L ${points[0].x} ${padding.top + innerH} Z`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Platform Revenue</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Last 7 months · in millions (₦)
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
          <TrendingUp className="size-3" />
          +18.2%
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="revenue-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF5000" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FF5000" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#revenue-area)" />
        <path d={path} fill="none" stroke="#FF5000" strokeWidth="2" />
        {points.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="3" fill="#FF5000" />
            <text
              x={p.x}
              y={height - 6}
              textAnchor="middle"
              className="fill-slate-500"
              fontSize="10"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Successful: "bg-emerald-50 text-emerald-700",
    Pending: "bg-amber-50 text-amber-700",
    Failed: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full ${
        map[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
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

export default function AdminDashboard() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Platform Overview"
        subtitle="Real-time view of activity across all properties and users."
      />

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Properties"
          value={ADMIN_KPIS.totalProperties.toLocaleString()}
          delta={{ value: "+4.2%", up: true }}
          icon={Building2}
        />
        <KpiCard
          label="Total Landlords"
          value={ADMIN_KPIS.totalLandlords.toLocaleString()}
          delta={{ value: "+12", up: true }}
          icon={Users}
        />
        <KpiCard
          label="Total Tenants"
          value={ADMIN_KPIS.totalTenants.toLocaleString()}
          delta={{ value: "+8.4%", up: true }}
          icon={UserCheck}
        />
        <KpiCard
          label="Occupancy Rate"
          value={`${ADMIN_KPIS.occupancyRate}%`}
          delta={{ value: "+1.8%", up: true }}
          icon={TrendingUp}
          tone="success"
        />
        <KpiCard
          label="Pending KYC"
          value={ADMIN_KPIS.pendingKyc}
          delta={{ value: "+6", up: false }}
          icon={ShieldCheck}
          tone="warning"
        />
        <KpiCard
          label="Open Service Requests"
          value={ADMIN_KPIS.openServiceRequests}
          delta={{ value: "-3.1%", up: true }}
          icon={Headphones}
          tone="warning"
        />
        <KpiCard
          label="Monthly Revenue"
          value={formatNaira(ADMIN_KPIS.monthlyRevenue)}
          delta={{ value: "+18.2%", up: true }}
          icon={CreditCard}
          tone="success"
        />
        <KpiCard
          label="Active Leases"
          value={ADMIN_KPIS.activeLeases.toLocaleString()}
          delta={{ value: "+2.4%", up: true }}
          icon={CheckCircle2}
        />
      </div>

      {/* Chart + activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">
                Platform Activity
              </h3>
            </div>
            <button className="text-xs font-semibold text-[#FF5000] hover:text-[#E04500] inline-flex items-center gap-0.5">
              View all
              <ArrowUpRight className="size-3" />
            </button>
          </div>
          <ul className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
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
                      <span className="text-slate-500">({a.role})</span>{" "}
                      {a.action}{" "}
                      <span className="font-medium text-slate-900">
                        {a.target}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {a.time}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Recent Payments
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest transactions across the platform
            </p>
          </div>
          <button className="text-xs font-semibold text-[#FF5000] hover:text-[#E04500] inline-flex items-center gap-0.5">
            View all payments
            <ArrowUpRight className="size-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50">
                <th className="px-5 py-3 font-semibold">Transaction</th>
                <th className="px-5 py-3 font-semibold">Tenant</th>
                <th className="px-5 py-3 font-semibold">Property</th>
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold text-right">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RECENT_PAYMENTS.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">
                    {p.id}
                  </td>
                  <td className="px-5 py-3 text-slate-900 font-medium">
                    {p.tenant}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.property}</td>
                  <td className="px-5 py-3 text-slate-600">{p.method}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{p.date}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">
                    ₦{p.amount.toLocaleString("en-NG")}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
