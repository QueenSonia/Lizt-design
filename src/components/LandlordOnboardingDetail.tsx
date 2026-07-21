"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  Phone,
  Calendar,
} from "lucide-react";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { OnboardingSubmission, OnboardingProperty } from "@/types/onboarding";

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) +
    ", " +
    date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

const OCCUPANCY_BADGE_STYLES: Record<OnboardingProperty["occupancyStatus"], string> = {
  occupied: "bg-green-100 text-green-700 border-green-200",
  vacant: "bg-gray-100 text-gray-600 border-gray-200",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function PropertyCard({
  property,
  defaultOpen,
}: {
  property: OnboardingProperty;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOccupied = property.occupancyStatus === "occupied";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{property.description}</p>
                <p className="text-xs text-gray-500 truncate">{property.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${OCCUPANCY_BADGE_STYLES[property.occupancyStatus]}`}
              >
                {isOccupied ? "Occupied" : "Vacant"}
              </span>
              {open ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-gray-100 px-5 py-5 space-y-6">
            {isOccupied && (
              <>
                {/* Financial Information */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Financial Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <InfoRow label="Rent" value={property.rent !== undefined ? formatCurrency(property.rent) : "-"} />
                    <InfoRow
                      label="Service Charge"
                      value={property.serviceCharge !== undefined ? formatCurrency(property.serviceCharge) : "-"}
                    />
                  </div>
                </div>

                {/* Tenant Information */}
                {property.tenant && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Tenant Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      <InfoRow label="Tenant Name" value={property.tenant.name} />
                      <InfoRow label="Phone Number" value={property.tenant.phone} />
                      <InfoRow label="Email Address" value={property.tenant.email} />
                    </div>
                  </div>
                )}

                {/* Tenancy Information */}
                {property.tenancy && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Tenancy Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      <InfoRow label="Tenancy Type" value={property.tenancy.tenancyType} />
                      <InfoRow label="Start Date" value={formatDate(property.tenancy.startDate)} />
                      <InfoRow label="End Date" value={formatDate(property.tenancy.endDate)} />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Uploaded Documents */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Uploaded Documents
              </h4>
              {property.documents.length === 0 ? (
                <p className="text-sm text-gray-400">No documents uploaded for this property.</p>
              ) : (
                <div className="space-y-2">
                  {property.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                      <span className="text-sm text-gray-900 flex-1 truncate">{doc.name}</span>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">View</Button>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface LandlordOnboardingDetailProps {
  submission: OnboardingSubmission;
  onBack: () => void;
}

export default function LandlordOnboardingDetail({
  submission,
  onBack,
}: LandlordOnboardingDetailProps) {
  return (
    <div className="page-container">
      {/* Header card */}
      <div className="bg-white shadow-sm mb-4 overflow-hidden -mt-4 -mx-4 sm:-mt-6 sm:-mx-6 lg:-mt-8 lg:-mx-8">
        <div className="px-6 sm:px-8 py-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Onboarding
          </button>
        </div>

        <div className="border-t border-gray-100" />

        <div className="px-6 sm:px-8 py-5">
          <h1 className="text-xl font-semibold text-slate-900 leading-snug">
            {submission.landlordName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            {submission.landlordPhone}
          </p>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Submitted {formatDateTime(submission.submittedAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl space-y-6">
        {/* Submitted Properties */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Submitted Properties ({submission.properties.length})
          </h3>
          <div className="space-y-3">
            {submission.properties.map((property, idx) => (
              <PropertyCard key={property.id} property={property} defaultOpen={idx === 0} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
