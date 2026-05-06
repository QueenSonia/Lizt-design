"use client";
import { AdminPageHeader } from "./AdminPageHeader";
import { RECENT_PAYMENTS, ADMIN_KPIS } from "./adminMockData";
import { CreditCard, TrendingUp, AlertCircle } from "lucide-react";

const STATUS: Record<string, string> = {
  Successful: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Failed: "bg-red-50 text-red-700",
};

export default function AdminPayments() {
  const successful = RECENT_PAYMENTS.filter((p) => p.status === "Successful").length;
  const failed = RECENT_PAYMENTS.filter((p) => p.status === "Failed").length;
  const pending = RECENT_PAYMENTS.filter((p) => p.status === "Pending").length;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Payments"
        subtitle="Monitor all payment transactions on the platform."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
            <CreditCard className="size-4" />
            Total Volume (Month)
          </div>
          <div className="text-2xl font-semibold text-slate-900">
            ₦{(ADMIN_KPIS.monthlyRevenue / 1_000_000).toFixed(1)}M
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-emerald-600 text-xs mb-2">
            <TrendingUp className="size-4" />
            Successful
          </div>
          <div className="text-2xl font-semibold text-slate-900">{successful}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-amber-600 text-xs mb-2">
            <AlertCircle className="size-4" />
            Pending
          </div>
          <div className="text-2xl font-semibold text-slate-900">{pending}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-red-600 text-xs mb-2">
            <AlertCircle className="size-4" />
            Failed
          </div>
          <div className="text-2xl font-semibold text-slate-900">{failed}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="p-4 border-b border-slate-200 text-sm font-semibold text-slate-900">
          All Transactions
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
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">{p.id}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{p.tenant}</td>
                  <td className="px-5 py-3 text-slate-600">{p.property}</td>
                  <td className="px-5 py-3 text-slate-600">{p.method}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{p.date}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">
                    ₦{p.amount.toLocaleString("en-NG")}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full ${
                        STATUS[p.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {p.status}
                    </span>
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
