"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "./AdminPageHeader";
import { RESIDENTS } from "./adminMockData";
import { UsersRound, Plus, ChevronRight, X, Clock } from "lucide-react";

export default function AdminResidents() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = RESIDENTS.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.building.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search)
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Residents"
        subtitle="All residents grouped by building."
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[#FF5000] hover:bg-[#E04500] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="size-4" />
            Add Resident
          </button>
        }
      />

      {/* Mobile search */}
      <div className="mb-4 md:hidden">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search residents..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5000]/20 focus:border-[#FF5000]"
        />
      </div>

      {/* Desktop search */}
      <div className="mb-4 hidden md:block">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, building or phone..."
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-[#FF5000]/20 focus:border-[#FF5000]"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2 p-4 border-b border-slate-200 text-sm text-slate-600">
          <UsersRound className="size-4" />
          <span className="font-semibold">{filtered.length} residents</span>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50">
                <th className="px-5 py-3 font-semibold">Resident Name</th>
                <th className="px-5 py-3 font-semibold">Phone Number</th>
                <th className="px-5 py-3 font-semibold">Building</th>
                <th className="px-5 py-3 font-semibold">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/admin/residents/${r.id}`)}
                  className="hover:bg-slate-50/50 cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{r.id}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{r.phone}</td>
                  <td className="px-5 py-3 text-slate-700">{r.building}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{r.dateAdded}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">No residents match your search.</div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-slate-100">
          {filtered.map((r) => (
            <div
              key={r.id}
              onClick={() => router.push(`/admin/residents/${r.id}`)}
              className="px-4 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-slate-900">{r.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{r.id}</p>
                </div>
                <ChevronRight className="size-4 text-slate-300 shrink-0 mt-0.5" />
              </div>
              <div className="grid grid-cols-2 gap-x-3 text-xs mt-2">
                <div>
                  <p className="text-slate-400 mb-0.5">Phone</p>
                  <p className="text-slate-700">{r.phone}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-0.5">Building</p>
                  <p className="text-slate-700">{r.building}</p>
                </div>
                <div className="mt-2">
                  <p className="text-slate-400 mb-0.5">Date Added</p>
                  <p className="text-slate-500">{r.dateAdded}</p>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">No residents match your search.</div>
          )}
        </div>
      </div>

      {/* Add Resident stub modal */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="size-10 rounded-full bg-[#FFF3EB] flex items-center justify-center">
                <Clock className="size-5 text-[#FF5000]" />
              </div>
              <button
                onClick={() => setAddOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Add Resident</h2>
            <p className="text-sm text-slate-500 mb-5">
              The full Add Resident flow is coming soon. This will include inline building creation and resident details.
            </p>
            <button
              onClick={() => setAddOpen(false)}
              className="w-full py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
