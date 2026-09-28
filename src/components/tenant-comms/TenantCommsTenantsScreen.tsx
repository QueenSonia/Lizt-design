/* eslint-disable */
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MOCK_TENANCIES } from "@/components/LandlordTenancies";

// Derive a flat tenant list from the tenancies mock — one row per unique tenant.
// Excludes ended tenancies to show the active directory, consistent with the
// Tenancies list screen which also filters out ended records.
const TENANT_ROWS = (() => {
  const seen = new Set<string>();
  return MOCK_TENANCIES.filter((t) => {
    if (t.status === "ended") return false;
    if (seen.has(t.tenantId)) return false;
    seen.add(t.tenantId);
    return true;
  }).map((t) => ({
    id: t.tenantId,
    name: t.tenantName,
    phone: t.tenantPhone,
    address: t.propertyAddress,
  }));
})();

interface Props {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function TenantCommsTenantsScreen({ onMenuClick, isMobile }: Props) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TENANT_ROWS;
    return TENANT_ROWS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">

      {/* Header — sticky within the scrollable main container */}
      <div className="sticky top-0 z-20 bg-white shadow-sm shrink-0">
        {/* Title row */}
        <div className="px-4 lg:px-8 py-4 flex items-center gap-3">
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
          <h1 className="text-lg font-semibold text-slate-900">Tenants</h1>
          <span className="text-sm text-gray-400 font-normal">{rows.length}</span>
        </div>

        <div className="border-t border-gray-200 mx-4 lg:mx-8" />

        {/* Search row */}
        <div className="px-4 lg:px-8 py-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or address…"
              className="pl-10 h-9 bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-orange-200 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
            <p className="text-gray-700 text-sm font-medium mb-1">No tenants found</p>
            <p className="text-gray-400 text-xs">Try adjusting your search.</p>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant Name</span>
                    </th>
                    <th className="text-left px-4 py-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone Number</span>
                    </th>
                    <th className="text-left px-4 py-3 pr-6">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">House Address</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/tenant-comms/kyc-application-detail/${t.id}`)}
                      className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 underline decoration-[#FF5000] underline-offset-2">{t.name}</td>
                      <td className="px-4 py-4 text-gray-600 tabular-nums whitespace-nowrap">{t.phone}</td>
                      <td className="px-4 py-4 pr-6 text-gray-600">{t.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile stacked cards ── */}
            <div className="sm:hidden bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
              {rows.map((t) => (
                <div
                  key={t.id}
                  onClick={() => router.push(`/tenant-comms/kyc-application-detail/${t.id}`)}
                  className="px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                >
                  <p className="font-medium text-gray-900 mb-1 underline decoration-[#FF5000] underline-offset-2">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.phone}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.address}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
