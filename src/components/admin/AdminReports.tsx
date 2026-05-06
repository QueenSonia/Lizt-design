"use client";
import { AdminPageHeader } from "./AdminPageHeader";
import { REPORTS } from "./adminMockData";
import { FileBarChart2, Download } from "lucide-react";

export default function AdminReports() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Reports & Analytics"
        subtitle="Generated reports across the platform."
        actions={
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-[#FF5000] hover:bg-[#E04500] text-white text-sm font-semibold rounded-lg transition-colors">
            Generate report
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <div
            key={r.id}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF5000] shrink-0">
                <FileBarChart2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 truncate">
                  {r.name}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {r.type} · Generated {r.generated} · {r.size}
                </div>
              </div>
              <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                <Download className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
