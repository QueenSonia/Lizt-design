"use client";

import { useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";
import { Input } from "./ui/input";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { KYCService, KYCApplication } from "@/services/kyc/kyc.service";
import { mockKYCApplications } from "./LandlordKYCList";
import { TablePagination, stickyHeadClass } from "./TableControls";
import { useTablePagination } from "@/hooks/useTablePagination";
import { useTableScrollShadow } from "@/hooks/useTableScrollShadow";

/**
 * An agent is derived from KYC data rather than owning its own record — every field here is
 * rolled up from every `application.referralAgent` that shares the same normalized phone number.
 * Phone number is the identity; every name seen alongside that phone becomes an alias, and the
 * most frequently used one (ties broken by first-seen order) is shown as the primary name.
 */
export interface Agent {
  /** Normalized phone number — the unique identifier so the same agent entered under different
   *  names by different tenants collapses into a single row. */
  id: string;
  /** Phone number as first entered, used for display. */
  phone: string;
  primaryName: string;
  /** Other names used for this phone number, excluding the primary name. */
  aliases: string[];
  applicantCount: number;
  activeTenantCount: number;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

export function deriveAgents(applications: KYCApplication[]): Agent[] {
  interface AgentBucket {
    phone: string;
    nameCounts: Map<string, number>;
    nameFirstSeen: Map<string, number>;
    applicantCount: number;
    activeTenantCount: number;
  }

  const byPhone = new Map<string, AgentBucket>();
  let order = 0;

  for (const app of applications) {
    const agent = app.referralAgent;
    if (!agent?.phoneNumber || !agent.fullName) continue;
    const id = normalizePhone(agent.phoneNumber);
    const name = agent.fullName.trim();
    if (!name) continue;

    let bucket = byPhone.get(id);
    if (!bucket) {
      bucket = {
        phone: agent.phoneNumber,
        nameCounts: new Map(),
        nameFirstSeen: new Map(),
        applicantCount: 0,
        activeTenantCount: 0,
      };
      byPhone.set(id, bucket);
    }

    bucket.nameCounts.set(name, (bucket.nameCounts.get(name) ?? 0) + 1);
    if (!bucket.nameFirstSeen.has(name)) bucket.nameFirstSeen.set(name, order++);
    bucket.applicantCount += 1;
    if (app.status === "approved") bucket.activeTenantCount += 1;
  }

  return Array.from(byPhone.entries())
    .map(([id, bucket]) => {
      const names = Array.from(bucket.nameCounts.keys()).sort((a, b) => {
        const countDiff = (bucket.nameCounts.get(b) ?? 0) - (bucket.nameCounts.get(a) ?? 0);
        if (countDiff !== 0) return countDiff;
        return (bucket.nameFirstSeen.get(a) ?? 0) - (bucket.nameFirstSeen.get(b) ?? 0);
      });
      const [primaryName, ...aliases] = names;
      return {
        id,
        phone: bucket.phone,
        primaryName,
        aliases,
        applicantCount: bucket.applicantCount,
        activeTenantCount: bucket.activeTenantCount,
      };
    })
    .sort((a, b) => a.primaryName.localeCompare(b.primaryName));
}

interface LandlordAgentsProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordAgents({ onMenuClick, isMobile }: LandlordAgentsProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";

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
      (a) =>
        a.primaryName.toLowerCase().includes(q) ||
        a.aliases.some((alias) => alias.toLowerCase().includes(q)) ||
        a.phone.toLowerCase().includes(q) ||
        normalizePhone(a.phone).includes(normalizePhone(q))
    );
  }, [agents, search]);

  const pagination = useTablePagination(filtered, search);

  const goToAgent = (agent: Agent) => {
    router.push(`/${userRole}/agents/${encodeURIComponent(agent.id)}`);
  };

  const goToApplicants = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${userRole}/agents/${encodeURIComponent(agent.id)}?tab=applicants`);
  };

  const goToTenants = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${userRole}/agents/${encodeURIComponent(agent.id)}?tab=tenants`);
  };

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
                Referral agents behind your tenant applicants, grouped by phone number
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
              placeholder="Search by name, alias, or phone..."
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
                      <th className="text-left px-6 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Agent</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone Number</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tenant Applicants</span>
                      </th>
                      <th className="text-left px-4 py-3 pr-6">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active Tenants</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagination.paginated.map((agent) => (
                      <tr
                        key={agent.id}
                        onClick={() => goToAgent(agent)}
                        className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{agent.primaryName}</p>
                          {agent.aliases.length > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Also referenced as: {agent.aliases.join(", ")}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-900">{agent.phone}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={(e) => goToApplicants(agent, e)}
                            className="text-sm font-medium hover:underline"
                            style={{ color: "#FF5000" }}
                          >
                            {agent.applicantCount} Applicant{agent.applicantCount === 1 ? "" : "s"}
                          </button>
                        </td>
                        <td className="px-4 py-4 pr-6">
                          <button
                            onClick={(e) => goToTenants(agent, e)}
                            className="text-sm font-medium hover:underline"
                            style={{ color: "#FF5000" }}
                          >
                            {agent.activeTenantCount} Tenant{agent.activeTenantCount === 1 ? "" : "s"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {pagination.paginated.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => goToAgent(agent)}
                    className="px-4 py-4 active:bg-gray-50"
                  >
                    <p className="font-medium text-gray-900">{agent.primaryName}</p>
                    {agent.aliases.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Also referenced as: {agent.aliases.join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{agent.phone}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={(e) => goToApplicants(agent, e)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: "#FF5000" }}
                      >
                        {agent.applicantCount} Applicant{agent.applicantCount === 1 ? "" : "s"}
                      </button>
                      <button
                        onClick={(e) => goToTenants(agent, e)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: "#FF5000" }}
                      >
                        {agent.activeTenantCount} Tenant{agent.activeTenantCount === 1 ? "" : "s"}
                      </button>
                    </div>
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
