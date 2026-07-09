"use client";

import { useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";
import { Input } from "./ui/input";
import { useQuery } from "@tanstack/react-query";
import { KYCService, KYCApplication } from "@/services/kyc/kyc.service";
import { mockKYCApplications } from "./LandlordKYCList";
import { ColumnsButton, TablePagination, stickyHeadClass } from "./TableControls";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { useTablePagination } from "@/hooks/useTablePagination";
import { useTableScrollShadow } from "@/hooks/useTableScrollShadow";

/**
 * An agent is derived from KYC data rather than owning its own record — every field here comes
 * from `application.referralAgent`. Deliberately minimal for now (name + phone only); designed to
 * grow (referral count, linked tenancies, status, etc.) without changing how the list is built —
 * just add fields to this shape and derive them in `deriveAgents` below.
 */
interface Agent {
  /** Phone number, normalized — the unique identifier so the same agent entered by different
   *  tenants collapses into a single row. */
  id: string;
  name: string;
  phone: string;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

function deriveAgents(applications: KYCApplication[]): Agent[] {
  const byPhone = new Map<string, Agent>();
  for (const app of applications) {
    const agent = app.referralAgent;
    if (!agent?.phoneNumber || !agent.fullName) continue;
    const id = normalizePhone(agent.phoneNumber);
    if (!byPhone.has(id)) {
      byPhone.set(id, { id, name: agent.fullName, phone: agent.phoneNumber });
    }
  }
  return Array.from(byPhone.values()).sort((a, b) => a.name.localeCompare(b.name));
}

type AgentColumnId = "name" | "phone";

const AGENT_COLUMN_DEFS: { id: AgentColumnId; label: string }[] = [
  { id: "name", label: "Agent Name" },
  { id: "phone", label: "Phone Number" },
];

// The table needs at least one identifying column — name can't be hidden entirely.
const AGENT_PRIMARY_COLUMNS: AgentColumnId[] = ["name"];

interface LandlordAgentsProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordAgents({ onMenuClick, isMobile }: LandlordAgentsProps) {
  const [search, setSearch] = useState("");

  const { visibility: columnVisibility, toggleColumn, visibleCount, totalCount } =
    useColumnVisibility<AgentColumnId>(
      "lizt.agents.columnVisibility",
      AGENT_COLUMN_DEFS.map((c) => c.id),
      AGENT_PRIMARY_COLUMNS
    );
  const { ref: tableScrollRef, scrolled: tableScrolled, onScroll: handleTableScroll } =
    useTableScrollShadow<HTMLDivElement>();

  const { data: kycApplicationsRaw = [] } = useQuery({
    queryKey: ["kycApplications"],
    queryFn: KYCService.getAllKycApplications,
    staleTime: 30000,
  });

  const kycApplications =
    kycApplicationsRaw.length > 0 ? kycApplicationsRaw : mockKYCApplications;

  const agents = useMemo(() => deriveAgents(kycApplications), [kycApplications]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return agents;
    return agents.filter(
      (a) => a.name.toLowerCase().includes(q) || a.phone.toLowerCase().includes(q)
    );
  }, [agents, search]);

  const pagination = useTablePagination(filtered, search);

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
              <h1 className="text-lg font-semibold text-slate-900">Agents</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Agents referenced by tenants during KYC
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mx-4 lg:mx-8" />

        {/* Search row */}
        <div className="px-4 lg:px-8 py-4 flex items-center gap-2">
          <div className="relative w-72 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents by name or phone..."
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

          <ColumnsButton
            columns={AGENT_COLUMN_DEFS}
            visibility={columnVisibility}
            primaryColumns={AGENT_PRIMARY_COLUMNS}
            onToggle={toggleColumn}
            visibleCount={visibleCount}
            totalCount={totalCount}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto lg:pt-[109px]">
        <div className="px-4 sm:px-6 pt-8 pb-5">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 text-sm font-medium mb-1">
                {search ? "No agents match your search." : "No agents yet"}
              </p>
              <p className="text-gray-400 text-xs">
                {search
                  ? ""
                  : "Agents entered by tenants during KYC will appear here."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div ref={tableScrollRef} onScroll={handleTableScroll} className="max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className={stickyHeadClass(tableScrolled)}>
                    <tr>
                      {columnVisibility.name && (
                        <th className="text-left px-6 py-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Agent Name</span>
                        </th>
                      )}
                      {columnVisibility.phone && (
                        <th className="text-left px-4 py-3 pr-6 first:pl-6">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone Number</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagination.paginated.map((agent) => (
                      <tr key={agent.id} className="bg-white">
                        {columnVisibility.name && (
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{agent.name}</p>
                          </td>
                        )}
                        {columnVisibility.phone && (
                          <td className="px-4 py-4 pr-6 first:pl-6 text-gray-900">{agent.phone}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {pagination.paginated.map((agent) => (
                  <div key={agent.id} className="px-4 py-4">
                    <p className="font-medium text-gray-900">{agent.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{agent.phone}</p>
                  </div>
                ))}
              </div>

              <TablePagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                rangeStart={pagination.rangeStart}
                rangeEnd={pagination.rangeEnd}
                total={pagination.total}
                itemLabel="agents"
                getPageNumbers={pagination.getPageNumbers}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
