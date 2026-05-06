"use client";
import { AdminPageHeader } from "./AdminPageHeader";
import { PROPERTIES } from "./adminMockData";
import { Building2, Filter, Plus } from "lucide-react";

export default function AdminProperties() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Properties"
        subtitle="All properties listed across the platform."
        actions={
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-[#FF5000] hover:bg-[#E04500] text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="size-4" />
            Add property
          </button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="size-4" />
            <span className="font-semibold">{PROPERTIES.length} properties</span>
          </div>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
            <Filter className="size-4" />
            Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50">
                <th className="px-5 py-3 font-semibold">Property</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Landlord</th>
                <th className="px-5 py-3 font-semibold text-right">Units</th>
                <th className="px-5 py-3 font-semibold text-right">Occupancy</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PROPERTIES.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{p.id}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.location}</td>
                  <td className="px-5 py-3 text-slate-700">{p.landlord}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{p.units}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FF5000]"
                          style={{ width: `${p.occupancy}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 tabular-nums w-10 text-right">
                        {p.occupancy}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full ${
                        p.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
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
