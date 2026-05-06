"use client";
import { AdminPageHeader } from "./AdminPageHeader";
import { TENANTS } from "./adminMockData";
import { UserCheck } from "lucide-react";

const STATUS: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Renewing: "bg-blue-50 text-blue-700",
  Overdue: "bg-red-50 text-red-700",
};

export default function AdminTenants() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Tenants"
        subtitle="All tenants currently on the platform."
      />

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2 p-4 border-b border-slate-200 text-sm text-slate-600">
          <UserCheck className="size-4" />
          <span className="font-semibold">{TENANTS.length} tenants shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50">
                <th className="px-5 py-3 font-semibold">Tenant</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Property</th>
                <th className="px-5 py-3 font-semibold">Lease End</th>
                <th className="px-5 py-3 font-semibold text-right">Rent</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TENANTS.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{t.id}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{t.email}</td>
                  <td className="px-5 py-3 text-slate-700">{t.property}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{t.leaseEnd}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-900">
                    ₦{t.rent.toLocaleString("en-NG")}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full ${
                        STATUS[t.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t.status}
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
