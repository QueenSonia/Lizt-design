"use client";
import { AdminPageHeader } from "./AdminPageHeader";
import { LANDLORDS } from "./adminMockData";
import { Users } from "lucide-react";

export default function AdminLandlords() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Landlords"
        subtitle="All landlord accounts on the platform."
      />

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2 p-4 border-b border-slate-200 text-sm text-slate-600">
          <Users className="size-4" />
          <span className="font-semibold">{LANDLORDS.length} landlords</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50">
                <th className="px-5 py-3 font-semibold">Landlord</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
                <th className="px-5 py-3 font-semibold text-right">Properties</th>
                <th className="px-5 py-3 font-semibold text-right">Tenants</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {LANDLORDS.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-900">{l.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{l.id}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{l.email}</td>
                  <td className="px-5 py-3 text-slate-600">{l.phone}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium">
                    {l.properties}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium">
                    {l.tenants}
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{l.joined}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full ${
                        l.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {l.status}
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
