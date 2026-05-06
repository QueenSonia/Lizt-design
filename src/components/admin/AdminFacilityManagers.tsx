"use client";
import { AdminPageHeader } from "./AdminPageHeader";
import { FACILITY_MANAGERS } from "./adminMockData";
import { Wrench } from "lucide-react";

export default function AdminFacilityManagers() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Facility Managers"
        subtitle="Operations team members handling property maintenance."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FACILITY_MANAGERS.map((fm) => (
          <div
            key={fm.id}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold">
                  {fm.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{fm.name}</div>
                  <div className="text-xs text-slate-500">{fm.email}</div>
                </div>
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                {fm.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
              <div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                  <Wrench className="size-3" />
                  Properties
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {fm.propertiesAssigned}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 mb-1">Open</div>
                <div className="text-lg font-semibold text-amber-600">
                  {fm.openIssues}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 mb-1">Resolved</div>
                <div className="text-lg font-semibold text-emerald-600">
                  {fm.resolvedThisMonth}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
