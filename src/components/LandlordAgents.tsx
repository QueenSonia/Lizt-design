"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users, X, Pencil } from "lucide-react";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { KYCService, KYCApplication } from "@/services/kyc/kyc.service";
import { mockKYCApplications } from "./LandlordKYCList";
import { TablePagination, stickyHeadClass } from "./TableControls";
import { useTablePagination } from "@/hooks/useTablePagination";
import { useTableScrollShadow } from "@/hooks/useTableScrollShadow";
import { getOfficialAgentName, setOfficialAgentName, subscribeToAgentStore } from "@/lib/agentStore";

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
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

export function deriveAgents(applications: KYCApplication[]): Agent[] {
  interface AgentBucket {
    phone: string;
    nameCounts: Map<string, number>;
    nameFirstSeen: Map<string, number>;
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
      bucket = { phone: agent.phoneNumber, nameCounts: new Map(), nameFirstSeen: new Map() };
      byPhone.set(id, bucket);
    }

    bucket.nameCounts.set(name, (bucket.nameCounts.get(name) ?? 0) + 1);
    if (!bucket.nameFirstSeen.has(name)) bucket.nameFirstSeen.set(name, order++);
  }

  return Array.from(byPhone.entries())
    .map(([id, bucket]) => {
      const names = Array.from(bucket.nameCounts.keys()).sort((a, b) => {
        const countDiff = (bucket.nameCounts.get(b) ?? 0) - (bucket.nameCounts.get(a) ?? 0);
        if (countDiff !== 0) return countDiff;
        return (bucket.nameFirstSeen.get(a) ?? 0) - (bucket.nameFirstSeen.get(b) ?? 0);
      });

      // A Property-Manager-assigned official name takes over as the primary display name. The
      // KYC-derived name it replaces isn't discarded — it folds back into the alias list (unless
      // it's already there) so the original submitted names stay visible as historical references.
      const officialName = getOfficialAgentName(id);
      let primaryName: string;
      let aliases: string[];
      if (officialName) {
        primaryName = officialName;
        aliases = names.includes(officialName) ? names.filter((n) => n !== officialName) : names;
      } else {
        [primaryName, ...aliases] = names;
      }

      return { id, phone: bucket.phone, primaryName, aliases };
    })
    .sort((a, b) => a.primaryName.localeCompare(b.primaryName));
}

/** A single person linked to an agent's phone number, for the unified list in the details modal. */
interface LinkedPerson {
  applicationId: string;
  fullName: string;
  property?: string;
  unit?: string;
  applicationDate?: string;
  status: "Applicant" | "Tenant";
}

function derivePersonStatus(app: KYCApplication): LinkedPerson["status"] | null {
  if (app.status !== "approved") {
    // Rejected applications aren't a live lead or a tenant — leave them out of the roster.
    return app.status === "rejected" ? null : "Applicant";
  }
  // Approved means the referral converted into a tenant — active or ended tenancy both count.
  return "Tenant";
}

function deriveLinkedPeople(applications: KYCApplication[], agentId: string): LinkedPerson[] {
  return applications
    .filter(
      (app) =>
        app.referralAgent?.phoneNumber &&
        normalizePhone(app.referralAgent.phoneNumber) === agentId
    )
    .map((app): LinkedPerson | null => {
      const status = derivePersonStatus(app);
      if (!status) return null;
      return {
        applicationId: app.id,
        fullName: `${app.firstName} ${app.lastName}`.trim(),
        property: app.property?.name,
        unit: undefined,
        applicationDate: app.submissionDate,
        status,
      };
    })
    .filter((p): p is LinkedPerson => p !== null);
}

const STATUS_TAG_STYLES: Record<LinkedPerson["status"], string> = {
  Applicant: "bg-gray-100 text-gray-700 border-gray-200",
  Tenant: "bg-green-100 text-green-700 border-green-200",
};

function formatDate(dateString?: string) {
  if (!dateString) return undefined;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function AgentDetailsModal({
  agent,
  people,
  onClose,
}: {
  agent: Agent;
  people: LinkedPerson[];
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white rounded-xl max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{agent.phone}</DialogTitle>
        </DialogHeader>

        <div>
          <p className="font-medium text-gray-900">{agent.primaryName}</p>
          {agent.aliases.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              Also referenced as: {agent.aliases.join(", ")}
            </p>
          )}
        </div>

        <div className="border-t border-gray-100 -mx-6 px-6 pt-4 flex-1 overflow-y-auto">
          {people.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No applicants or tenants linked to this agent yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {people.map((person) => {
                const dateLabel = formatDate(person.applicationDate);
                return (
                  <li
                    key={person.applicationId}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {person.fullName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {[person.property, person.unit, dateLabel].filter(Boolean).join(" · ") || "-"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_TAG_STYLES[person.status]}`}
                    >
                      {person.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 -mx-6 px-6 pt-4">
          <p className="text-xs text-gray-500">
            {people.length} {people.length === 1 ? "person" : "people"} linked to this agent
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditAgentNameModal({
  agent,
  onClose,
  onSaved,
}: {
  agent: Agent;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const [name, setName] = useState(agent.primaryName);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSaved(trimmed);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white rounded-xl max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Agent Name</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Phone Number</p>
            <p className="text-sm text-gray-900">{agent.phone}</p>
          </div>

          <div>
            <label htmlFor="official-agent-name" className="text-xs font-medium text-gray-500 mb-1 block">
              Official Agent Name
            </label>
            <Input
              id="official-agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="Enter official agent name"
              autoFocus
              className="h-9 text-sm"
            />
          </div>

          {agent.aliases.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Also referenced as</p>
              <p className="text-xs text-gray-500">{agent.aliases.join(", ")}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!canSave}
            onClick={handleSave}
            className="text-white disabled:opacity-50"
            style={{ backgroundColor: "#FF5000" }}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface LandlordAgentsProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordAgents({ onMenuClick, isMobile }: LandlordAgentsProps) {
  const [search, setSearch] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [, agentStoreTick] = useState(0);

  useEffect(() => {
    return subscribeToAgentStore(() => agentStoreTick((n) => n + 1));
  }, []);

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

  const selectedAgent = useMemo(
    () => (selectedAgentId ? agents.find((a) => a.id === selectedAgentId) ?? null : null),
    [agents, selectedAgentId]
  );

  const selectedAgentPeople = useMemo(
    () => (selectedAgentId ? deriveLinkedPeople(kycApplications, selectedAgentId) : []),
    [kycApplications, selectedAgentId]
  );

  const editingAgent = useMemo(
    () => (editingAgentId ? agents.find((a) => a.id === editingAgentId) ?? null : null),
    [agents, editingAgentId]
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
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone Number</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Agent Name(s)</span>
                      </th>
                      <th className="text-right px-4 py-3 pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagination.paginated.map((agent) => (
                      <tr
                        key={agent.id}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-900">{agent.phone}</td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-900">{agent.primaryName}</p>
                          {agent.aliases.length > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Also referenced as: {agent.aliases.join(", ")}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 pr-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAgentId(agent.id);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
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
                    onClick={() => setSelectedAgentId(agent.id)}
                    className="px-4 py-4 active:bg-gray-50 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">{agent.phone}</p>
                      <p className="font-medium text-gray-900 mt-0.5">{agent.primaryName}</p>
                      {agent.aliases.length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Also referenced as: {agent.aliases.join(", ")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAgentId(agent.id);
                      }}
                      className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
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

      {selectedAgent && (
        <AgentDetailsModal
          agent={selectedAgent}
          people={selectedAgentPeople}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {editingAgent && (
        <EditAgentNameModal
          agent={editingAgent}
          onClose={() => setEditingAgentId(null)}
          onSaved={(name) => {
            setOfficialAgentName(editingAgent.id, name);
            setEditingAgentId(null);
          }}
        />
      )}
    </div>
  );
}
