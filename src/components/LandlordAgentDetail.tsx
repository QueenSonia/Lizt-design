"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Users, UserCheck, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { KYCService } from "@/services/kyc/kyc.service";
import { mockKYCApplications } from "./LandlordKYCList";
import { deriveAgents, normalizePhone } from "./LandlordAgents";

interface LandlordAgentDetailProps {
  agentId: string;
  initialTab?: "applicants" | "tenants";
  onMenuClick?: () => void;
  isMobile?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  pending_completion: { label: "Pending Completion", color: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Approved", color: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200" },
};

function formatDate(dateString?: string) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function LandlordAgentDetail({
  agentId,
  initialTab = "applicants",
  onMenuClick,
  isMobile,
}: LandlordAgentDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";

  const { data: kycApplicationsRaw = [] } = useQuery({
    queryKey: ["kycApplications"],
    queryFn: KYCService.getAllKycApplications,
    staleTime: 30000,
  });

  const kycApplications =
    kycApplicationsRaw.length > 0 ? kycApplicationsRaw : mockKYCApplications;

  const agent = useMemo(
    () => deriveAgents(kycApplications).find((a) => a.id === normalizePhone(agentId)),
    [kycApplications, agentId]
  );

  const referredApplications = useMemo(
    () =>
      kycApplications.filter(
        (app) =>
          app.referralAgent?.phoneNumber &&
          normalizePhone(app.referralAgent.phoneNumber) === normalizePhone(agentId)
      ),
    [kycApplications, agentId]
  );

  const applicants = referredApplications;
  const activeTenants = referredApplications.filter((app) => app.status === "approved");
  const conversionRate =
    applicants.length === 0 ? 0 : Math.round((activeTenants.length / applicants.length) * 100);

  const handleBack = () => router.push(`/${userRole}/agents`);

  const goToApplication = (id: string) => {
    router.push(`/${userRole}/kyc-application-detail/${id}`);
  };

  if (!agent) {
    return (
      <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">
        <div className="px-4 lg:px-8 py-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Agents
          </button>
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 text-sm font-medium mb-1">Agent not found</p>
            <p className="text-gray-400 text-xs">
              This agent may no longer be referenced by any tenant applications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">
      {/* Fixed header */}
      <div className="lg:fixed top-0 right-0 left-0 lg:left-72 z-20 bg-white shadow-sm">
        <div className="px-4 lg:px-8 py-4">
          <div className="flex items-center gap-3 mb-3">
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
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Agents
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{agent.primaryName}</h1>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <Phone className="w-3.5 h-3.5" />
                {agent.phone}
              </div>
              {agent.aliases.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Also referenced as: {agent.aliases.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto lg:pt-[145px]">
        <div className="px-4 sm:px-6 pt-8 pb-10 max-w-5xl mx-auto w-full">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                  <Users className="w-3.5 h-3.5" /> Tenant Applicants
                </div>
                <p className="text-2xl font-semibold text-gray-900">{applicants.length}</p>
              </div>

              <div className="text-gray-300 rotate-90 sm:rotate-0 text-xl">→</div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                  <UserCheck className="w-3.5 h-3.5" /> Converted to Tenants
                </div>
                <p className="text-2xl font-semibold text-gray-900">{activeTenants.length}</p>
              </div>

              <div className="text-gray-300 rotate-90 sm:rotate-0 text-xl">→</div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Conversion Rate
                </div>
                <p className="text-2xl font-semibold" style={{ color: "#FF5000" }}>
                  {conversionRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Tenant Applicants */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Tenant Applicants</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Applicants who listed {agent.primaryName} as their referral agent during KYC
              </p>
            </div>
            {applicants.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No applicants yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Applicant Name</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Property Applied For</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Application Status</span>
                      </th>
                      <th className="text-left px-4 py-3 pr-5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Date Applied</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {applicants.map((app) => {
                      const status = STATUS_LABELS[app.status] ?? {
                        label: app.status,
                        color: "bg-gray-100 text-gray-700 border-gray-200",
                      };
                      return (
                        <tr
                          key={app.id}
                          onClick={() => goToApplication(app.id)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-4 font-medium text-gray-900">
                            {app.firstName} {app.lastName}
                          </td>
                          <td className="px-4 py-4 text-gray-700">{app.property?.name || "-"}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 pr-5 text-gray-500">{formatDate(app.submissionDate)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Tenants */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Active Tenants</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Applicants who converted into tenants from this agent&apos;s referrals
              </p>
            </div>
            {activeTenants.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No active tenants yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tenant Name</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Property</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tenancy Status</span>
                      </th>
                      <th className="text-left px-4 py-3 pr-5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Start Date</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeTenants.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => goToApplication(app.id)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4 font-medium text-gray-900">
                          {app.firstName} {app.lastName}
                        </td>
                        <td className="px-4 py-4 text-gray-700">{app.property?.name || "-"}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">
                            Active
                          </span>
                        </td>
                        <td className="px-4 py-4 pr-5 text-gray-500">
                          {formatDate(app.offerLetter?.tenancyStartDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
