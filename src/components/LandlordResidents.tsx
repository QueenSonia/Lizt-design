"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Search, UsersRound, Plus, ChevronRight, X, Clock } from "lucide-react";
import { Input } from "./ui/input";
import { stickyHeadClass } from "./TableControls";
import { useTableScrollShadow } from "@/hooks/useTableScrollShadow";

// ── Mock Data ─────────────────────────────────────────────────────────────────

const RESIDENTS = [
  {
    id: "RES-001",
    name: "Chibuike Okonkwo",
    phone: "+234 803 441 2211",
    building: "Palm Grove Estate",
    dateAdded: "2026-01-15",
  },
  {
    id: "RES-002",
    name: "Funmilola Adeyemi",
    phone: "+234 806 887 3344",
    building: "Palm Grove Estate",
    dateAdded: "2026-02-03",
  },
  {
    id: "RES-003",
    name: "Aminu Suleiman",
    phone: "+234 812 223 9900",
    building: "Maple Court",
    dateAdded: "2026-01-28",
  },
  {
    id: "RES-004",
    name: "Adaeze Nwosu",
    phone: "+234 809 551 7762",
    building: "Maple Court",
    dateAdded: "2026-03-10",
  },
  {
    id: "RES-005",
    name: "Babatunde Fashola",
    phone: "+234 702 334 8810",
    building: "Sapphire Heights",
    dateAdded: "2026-03-22",
  },
  {
    id: "RES-006",
    name: "Chiamaka Igwe",
    phone: "+234 815 662 5531",
    building: "Sapphire Heights",
    dateAdded: "2026-04-01",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface LandlordResidentsProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordResidents({ onMenuClick, isMobile }: LandlordResidentsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { ref: tableScrollRef, scrolled: tableScrolled, onScroll: handleTableScroll } =
    useTableScrollShadow<HTMLDivElement>();

  const filtered = RESIDENTS.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.building.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search)
  );

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">

      {/* Fixed header */}
      <div className="lg:fixed top-0 right-0 left-0 lg:left-72 z-20 bg-white shadow-sm">
        <div className="px-4 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isMobile && onMenuClick && (
              <button
                onClick={onMenuClick}
                className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-slate-100"
              >
                <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Residents</h1>
              <p className="text-xs text-slate-500 mt-0.5">All residents grouped by building</p>
            </div>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-3 bg-[#FF5000] hover:bg-[#e04600] text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Resident</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        <div className="border-t border-gray-200 mx-4 lg:mx-8" />

        {/* Search row */}
        <div className="px-4 lg:px-8 py-4 flex items-center gap-2">
          <div className="relative w-72 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, building or phone..."
              className="pl-10 h-9 bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-orange-200 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto lg:pt-[125px]">
        <div className="px-4 sm:px-6 pt-8 pb-5">

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
              <UsersRound className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 text-sm font-medium mb-1">
                {search ? "No residents match your search." : "No residents yet"}
              </p>
              {!search && (
                <p className="text-gray-400 text-xs">Add a resident to get started.</p>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div ref={tableScrollRef} onScroll={handleTableScroll} className="max-h-[70vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className={stickyHeadClass(tableScrolled)}>
                      <tr>
                        <th className="text-left px-6 py-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resident Name</span>
                        </th>
                        <th className="text-left px-4 py-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone Number</span>
                        </th>
                        <th className="text-left px-4 py-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Building</span>
                        </th>
                        <th className="text-left px-4 py-3 pr-6">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Date Added</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => router.push(`/${userRole}/residents/${r.id}`)}
                          className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{r.name}</p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{r.id}</p>
                          </td>
                          <td className="px-4 py-4 text-gray-600">{r.phone}</td>
                          <td className="px-4 py-4 text-gray-700">{r.building}</td>
                          <td className="px-4 py-4 pr-6 text-gray-500 text-xs">{r.dateAdded}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {filtered.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => router.push(`/${userRole}/residents/${r.id}`)}
                    className="px-4 py-4 active:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{r.name}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{r.id}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 text-xs">
                      <div>
                        <p className="text-gray-400 mb-0.5">Phone</p>
                        <p className="text-gray-700">{r.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5">Building</p>
                        <p className="text-gray-700">{r.building}</p>
                      </div>
                      <div className="mt-2">
                        <p className="text-gray-400 mb-0.5">Date Added</p>
                        <p className="text-gray-500">{r.dateAdded}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Add Resident</h2>
            <p className="text-sm text-gray-500 mb-5">
              The full Add Resident flow is coming soon. This will include inline building creation and resident details.
            </p>
            <button
              onClick={() => setAddOpen(false)}
              className="w-full py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
