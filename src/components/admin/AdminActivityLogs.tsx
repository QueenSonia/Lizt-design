"use client";
import { AdminPageHeader } from "./AdminPageHeader";
import { ACTIVITY_LOGS } from "./adminMockData";
import { History } from "lucide-react";

export default function AdminActivityLogs() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Activity Logs"
        subtitle="Audit trail of all platform actions."
      />

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2 p-4 border-b border-slate-200 text-sm text-slate-600">
          <History className="size-4" />
          <span className="font-semibold">{ACTIVITY_LOGS.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50">
                <th className="px-5 py-3 font-semibold">Log ID</th>
                <th className="px-5 py-3 font-semibold">Actor</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Target</th>
                <th className="px-5 py-3 font-semibold">IP Address</th>
                <th className="px-5 py-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ACTIVITY_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">
                    {log.id}
                  </td>
                  <td className="px-5 py-3 text-slate-900 font-medium">
                    {log.actor}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{log.action}</td>
                  <td className="px-5 py-3 text-slate-600">{log.target}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    {log.ip}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
