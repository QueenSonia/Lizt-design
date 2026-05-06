"use client";
import { AdminPageHeader } from "./AdminPageHeader";
import { KYC_APPLICATIONS } from "./adminMockData";
import { ShieldCheck } from "lucide-react";

const STATUS: Record<string, string> = {
  "Pending Review": "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

export default function AdminKycApplications() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="KYC Applications"
        subtitle="Tenant verification submissions awaiting review."
      />

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2 p-4 border-b border-slate-200 text-sm text-slate-600">
          <ShieldCheck className="size-4" />
          <span className="font-semibold">{KYC_APPLICATIONS.length} applications</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50">
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Applicant</th>
                <th className="px-5 py-3 font-semibold">Property</th>
                <th className="px-5 py-3 font-semibold">Submitted</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {KYC_APPLICATIONS.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">
                    {k.id}
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    {k.applicant}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{k.property}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {k.submitted}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full ${
                        STATUS[k.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-xs font-semibold text-[#FF5000] hover:text-[#E04500]">
                      Review
                    </button>
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
