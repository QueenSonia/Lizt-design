"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  Phone,
  Calendar,
  Check,
  Plus,
} from "lucide-react";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  OnboardingSubmission,
  OnboardingProperty,
  OnboardingDocument,
  OnboardingLandlordInfo,
} from "@/types/onboarding";
import {
  isLandlordOnboarded,
  isPropertyAdded,
  onboardLandlord,
  markPropertyAdded,
  generateLandlordId,
  subscribeToOnboardingConversionStore,
} from "@/lib/onboardingConversionStore";

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

/** A single uploaded document — icon, filename, and a "View" button opening it in a new tab. */
function DocumentRow({ document }: { document: OnboardingDocument }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <FileText className="w-5 h-5 text-gray-500 shrink-0" />
      <span className="text-sm text-gray-900 flex-1 truncate">{document.name}</span>
      <a href={document.url} target="_blank" rel="noopener noreferrer">
        <Button size="sm" variant="outline">View</Button>
      </a>
    </div>
  );
}

const SERVICE_BADGE_STYLE = "bg-orange-50 text-[#FF5000] border-orange-100";

/** Landlord identity section — layout depends on whether onboarding was Individual or Corporate. */
function LandlordInformationSection({ info }: { info: OnboardingLandlordInfo }) {
  const isIndividual = info.landlordType === "individual";

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Landlord Information
      </h3>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <InfoRow label="Landlord Type" value={isIndividual ? "Individual" : "Corporate"} />
          {isIndividual ? (
            <>
              <InfoRow label="First Name" value={info.firstName} />
              <InfoRow label="Last Name" value={info.lastName} />
              <InfoRow label="Date of Birth" value={formatDate(info.dateOfBirth)} />
              <InfoRow label="Email Address" value={info.email} />
              <InfoRow label="Contact Phone Number" value={info.phone} />
              <InfoRow label="Residential Address" value={info.residentialAddress} />
            </>
          ) : (
            <>
              <InfoRow label="Company / Entity Name" value={info.companyName} />
              <InfoRow label="Office Address" value={info.officeAddress} />
              <InfoRow label="Contact First Name" value={info.contactFirstName} />
              <InfoRow label="Contact Last Name" value={info.contactLastName} />
              <InfoRow label="Contact Phone Number" value={info.contactPhone} />
            </>
          )}
        </div>

        <div className="space-y-2">
          {isIndividual ? (
            <>
              <DocumentRow document={info.meansOfIdentification} />
              <DocumentRow document={info.photoOfIdentification} />
            </>
          ) : (
            <DocumentRow document={info.cacDocument} />
          )}
        </div>
      </div>
    </div>
  );
}

/** Every service the landlord selected during onboarding, shown as badges/chips. */
function ScopeOfServicesSection({
  services,
  otherServiceDescription,
}: {
  services: OnboardingSubmission["services"];
  otherServiceDescription?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Scope of Services
      </h3>
      <div className="flex flex-wrap gap-2">
        {services.map((service) => (
          <span
            key={service}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${SERVICE_BADGE_STYLE}`}
          >
            {service}
          </span>
        ))}
      </div>
      {services.includes("Others") && otherServiceDescription && (
        <p className="text-sm text-gray-600 mt-3">{otherServiceDescription}</p>
      )}
    </div>
  );
}

/**
 * Confirmation modal for "Onboard Landlord" — creates the landlord and, optionally, any
 * properties the Property Manager checks off from the submission's property list.
 */
function OnboardLandlordModal({
  open,
  properties,
  onClose,
  onConfirm,
}: {
  open: boolean;
  properties: OnboardingProperty[];
  onClose: () => void;
  onConfirm: (selectedPropertyIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) setSelected(new Set());
  }, [open]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Onboard Landlord</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600">
            This will create the landlord in the Landlords module using the information submitted
            during onboarding.
          </p>

          {properties.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Add Submitted Properties</p>
              <div className="rounded-lg border border-gray-100 divide-y divide-gray-100">
                {properties.map((property) => (
                  <label
                    key={property.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selected.has(property.id)}
                      onCheckedChange={() => toggle(property.id)}
                    />
                    <span className="text-sm text-gray-900">{property.description}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[#FF5000] hover:bg-[#e04600] text-white"
            onClick={() => onConfirm(Array.from(selected))}
          >
            Onboard Landlord
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PropertyCard({
  property,
  defaultOpen,
  isLandlordOnboarded: landlordOnboarded,
  isAdded,
  onAddProperty,
}: {
  property: OnboardingProperty;
  defaultOpen: boolean;
  isLandlordOnboarded: boolean;
  isAdded: boolean;
  onAddProperty: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOccupied = property.occupancyStatus === "occupied";

  const addPropertyControl = isAdded ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 whitespace-nowrap">
      <Check className="w-3.5 h-3.5" />
      Property Added
    </span>
  ) : landlordOnboarded ? (
    <Button
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onAddProperty();
      }}
      className="bg-[#FF5000] hover:bg-[#e04600] text-white h-7 px-2.5 text-xs whitespace-nowrap"
    >
      <Plus className="w-3.5 h-3.5 mr-1" />
      Add Property
    </Button>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button
            size="sm"
            disabled
            onClick={(e) => e.stopPropagation()}
            className="h-7 px-2.5 text-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Property
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Onboard the landlord before adding properties.</TooltipContent>
    </Tooltip>
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="w-full flex items-center justify-between gap-3 px-5 py-4">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-3 min-w-0 flex-1 text-left">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{property.description}</p>
                <p className="text-xs text-gray-500 truncate">{property.address}</p>
              </div>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${OCCUPANCY_BADGE_STYLES[property.occupancyStatus]}`}
            >
              {isOccupied ? "Occupied" : "Vacant"}
            </span>
            {addPropertyControl}
            <CollapsibleTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600">
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </CollapsibleTrigger>
          </div>
        </div>

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
                    <DocumentRow key={idx} document={doc} />
                  ))}
                </div>
              )}
            </div>

            {/* Ownership Documents */}
            {property.ownershipDocument && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Ownership Documents
                </h4>
                <div className="space-y-2">
                  <DocumentRow document={property.ownershipDocument} />
                </div>
              </div>
            )}
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
  const [, forceTick] = useState(0);
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  useEffect(() => {
    return subscribeToOnboardingConversionStore(() => forceTick((n) => n + 1));
  }, []);

  const landlordOnboarded = isLandlordOnboarded(submission.id);

  function handleConfirmOnboard(selectedPropertyIds: string[]) {
    onboardLandlord(submission.id, generateLandlordId(), selectedPropertyIds);
    setShowOnboardModal(false);
  }

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

        <div className="px-6 sm:px-8 py-5 flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
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
          <div className="shrink-0">
            {landlordOnboarded ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                <Check className="w-3.5 h-3.5" />
                Landlord Onboarded
              </span>
            ) : (
              <Button
                onClick={() => setShowOnboardModal(true)}
                className="bg-[#FF5000] hover:bg-[#e04600] text-white"
              >
                Onboard Landlord
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl space-y-6">
        {/* Landlord Information */}
        <LandlordInformationSection info={submission.landlordInfo} />

        {/* Scope of Services */}
        <ScopeOfServicesSection
          services={submission.services}
          otherServiceDescription={submission.otherServiceDescription}
        />

        {/* Submitted Properties */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Submitted Properties ({submission.properties.length})
          </h3>
          <div className="space-y-3">
            {submission.properties.map((property, idx) => (
              <PropertyCard
                key={property.id}
                property={property}
                defaultOpen={idx === 0}
                isLandlordOnboarded={landlordOnboarded}
                isAdded={isPropertyAdded(submission.id, property.id)}
                onAddProperty={() => markPropertyAdded(submission.id, property.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <OnboardLandlordModal
        open={showOnboardModal}
        properties={submission.properties}
        onClose={() => setShowOnboardModal(false)}
        onConfirm={handleConfirmOnboard}
      />
    </div>
  );
}
