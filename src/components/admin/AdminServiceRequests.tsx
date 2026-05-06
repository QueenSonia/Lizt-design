"use client";
import { AdminPageHeader } from "./AdminPageHeader";
import { SERVICE_REQUESTS } from "./adminMockData";
import { Headphones } from "lucide-react";

const PRIORITY: Record<string, string> = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-700",
};

const STATUS: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};

export default function AdminServiceRequests() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Service Requests"
        subtitle="Maintenance tickets across all properties."
      />

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2 p-4 border-b border-slate-200 text-sm text-slate-600">
          <Headphones className="size-4" />
          <span className="font-semibold">
            {SERVICE_REQUESTS.length} requests
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50">
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Tenant</th>
                <th className="px-5 py-3 font-semibold">Property</th>
                <th className="px-5 py-3 font-semibold">Issue</th>
                <th className="px-5 py-3 font-semibold">Priority</th>
                <th className="px-5 py-3 font-semibold">Submitted</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SERVICE_REQUESTS.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">
                    {s.id}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {s.tenant}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{s.property}</td>
                  <td className="px-5 py-3 text-slate-700">{s.issue}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full ${
                        PRIORITY[s.priority] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {s.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{s.submitted}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full ${
                        STATUS[s.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {s.status}
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
