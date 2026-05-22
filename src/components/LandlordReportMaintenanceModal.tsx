/* eslint-disable */
"use client";
import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronDown, Home, MapPin, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LandlordMaintenancePayload {
  type: "property" | "common_area";
  propertyId?: string;
  propertyName?: string;
  tenantName?: string;
  commonAreaId?: string;
  commonAreaName?: string;
  title: string;
  description: string;
  category: string;
  isPriority: boolean;
  assignedFmId?: string;
  assignedFmName?: string;
}

interface LandlordReportMaintenanceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LandlordMaintenancePayload) => void;
  preselectedProperty?: { id: string; name: string; tenantName: string };
  preselectedCommonArea?: { id: string; name: string };
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PROPERTIES = [
  { id: "p-001", name: "Lekki Phase 1 Duplex", tenantName: "James Okafor" },
  { id: "p-002", name: "Banana Island Flat", tenantName: "Adaeze Nwosu" },
  { id: "p-003", name: "Victoria Island Penthouse", tenantName: "" },
  { id: "p-004", name: "Ikoyi Terrace", tenantName: "Emmanuel Etim" },
];

const COMMON_AREA_OPTIONS = [
  "Main Lobby",
  "Rooftop Garden",
  "Parking Lot B",
  "Generator Room",
  "Laundry Room",
];

const MOCK_FMS = [
  { id: "fm1", name: "Jide Akinola" },
  { id: "fm2", name: "Chukwuemeka Obi" },
  { id: "fm3", name: "Fatima Bello" },
];

// ── Custom Property Dropdown ──────────────────────────────────────────────────

function PropertyDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = MOCK_PROPERTIES.find((p) => p.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center text-left px-3 py-2.5 bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg text-sm cursor-pointer transition-colors hover:border-[#B0ADA8] pr-9"
      >
        {selected ? (
          <span className="flex-1 min-w-0 overflow-hidden">
            <span className="font-medium text-[#1A1A1A]">{selected.name}</span>
            <span className="font-normal text-[#1A1A1A]"> · {selected.tenantName || "Vacant"}</span>
          </span>
        ) : (
          <span className="flex-1 text-[#B0ADA8]">Select a property…</span>
        )}
        <ChevronDown
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0ADA8] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-[#E2E0DC] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {MOCK_PROPERTIES.map((p, i) => {
            const isSelected = p.id === value;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange(p.id); setOpen(false); }}
                className={`flex flex-col w-full px-3.5 py-2.5 text-left gap-0.5 transition-colors ${
                  isSelected ? "bg-[#F5F4F1]" : "hover:bg-[#F8F7F4]"
                } ${i < MOCK_PROPERTIES.length - 1 ? "border-b border-[#F0EEEA]" : ""}`}
              >
                <span className="text-sm font-medium text-[#1A1A1A] leading-snug">{p.name}</span>
                <span className="text-xs font-normal text-[#1A1A1A] leading-snug">{p.tenantName || "Vacant"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export function LandlordReportMaintenanceModal({
  open,
  onClose,
  onSubmit,
  preselectedProperty,
  preselectedCommonArea,
}: LandlordReportMaintenanceModalProps) {
  const hasPreselection = !!(preselectedProperty || preselectedCommonArea);

  const initialMode: "property" | "common_area" | null = preselectedProperty
    ? "property"
    : preselectedCommonArea
    ? "common_area"
    : null;

  const [step, setStep] = useState<1 | 2>(hasPreselection ? 2 : 1);
  const [mode, setMode] = useState<"property" | "common_area" | null>(initialMode);

  // Form fields
  const [selectedPropertyId, setSelectedPropertyId] = useState(preselectedProperty?.id ?? "");
  const [selectedCommonArea, setSelectedCommonArea] = useState(preselectedCommonArea?.name ?? "");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [assignedFmId, setAssignedFmId] = useState("");

  // Reset when modal opens/closes
  useEffect(() => {
    if (!open) return;
    setStep(hasPreselection ? 2 : 1);
    setMode(initialMode);
    setSelectedPropertyId(preselectedProperty?.id ?? "");
    setSelectedCommonArea(preselectedCommonArea?.name ?? "");
    setDescription("");
    setCategory("");
    setIsPriority(false);
    setAssignedFmId("");
  }, [open]);

  const chooseMode = (m: "property" | "common_area") => {
    setMode(m);
    setStep(2);
  };

  const goBack = () => {
    setStep(1);
    setMode(null);
    setSelectedPropertyId("");
    setSelectedCommonArea("");
  };

  // Validation
  const propertyOk = mode === "property" && (preselectedProperty ? true : !!selectedPropertyId);
  const commonAreaOk = mode === "common_area" && (preselectedCommonArea ? true : !!selectedCommonArea);
  const locationOk = propertyOk || commonAreaOk;
  const isValid = locationOk && description.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    const assignedFm = MOCK_FMS.find((f) => f.id === assignedFmId);

    let propertyId: string | undefined;
    let propertyName: string | undefined;
    let tenantName: string | undefined;
    let commonAreaId: string | undefined;
    let commonAreaName: string | undefined;

    if (mode === "property") {
      if (preselectedProperty) {
        propertyId = preselectedProperty.id;
        propertyName = preselectedProperty.name;
        tenantName = preselectedProperty.tenantName;
      } else {
        const prop = MOCK_PROPERTIES.find((p) => p.id === selectedPropertyId);
        propertyId = prop?.id;
        propertyName = prop?.name;
        tenantName = prop?.tenantName;
      }
    } else {
      if (preselectedCommonArea) {
        commonAreaId = preselectedCommonArea.id;
        commonAreaName = preselectedCommonArea.name;
      } else {
        commonAreaId = selectedCommonArea.toLowerCase().replace(/\s+/g, "-");
        commonAreaName = selectedCommonArea;
      }
    }

    const payload: LandlordMaintenancePayload = {
      type: mode as "property" | "common_area",
      propertyId,
      propertyName,
      tenantName,
      commonAreaId,
      commonAreaName,
      title: description.trim(),
      description: description.trim(),
      category,
      isPriority,
      assignedFmId: assignedFm?.id,
      assignedFmName: assignedFm?.name,
    };

    onSubmit(payload);

    if (assignedFm) {
      toast.success(`Request submitted. ${assignedFm.name} notified on WhatsApp.`);
    } else {
      toast.success("Request submitted successfully.");
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="p-0 gap-0 max-w-[440px] rounded-xl overflow-hidden max-h-[90vh] flex flex-col [&>button:last-child]:hidden">
        {/* Step 1: Choose type */}
        {step === 1 && (
          <>
            <div className="flex items-start justify-between p-6 pb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1A1A1A]">Report Maintenance Request</h2>
                <p className="text-sm text-gray-500 mt-1 leading-snug">
                  Is this for a property or a common area?
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-[#F5F4F1] border border-[#E8E6E1] text-[#9A9790] hover:text-[#6B7280] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-2.5">
              {/* Property card */}
              <button
                type="button"
                onClick={() => chooseMode("property")}
                className="flex items-center gap-3.5 w-full px-4 py-3.5 bg-[#F8F7F4] border border-[#E2E0DC] rounded-xl text-left transition-colors hover:bg-[#F0EEE9] hover:border-[#D5D2CD]"
              >
                <Home className="w-[18px] h-[18px] text-gray-500 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-[#1A1A1A] mb-0.5">Property</span>
                  <span className="block text-xs text-[#9A9790] leading-snug">Report an issue at a specific property</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#C0BDB8] shrink-0" />
              </button>

              {/* Common Area card */}
              <button
                type="button"
                onClick={() => chooseMode("common_area")}
                className="flex items-center gap-3.5 w-full px-4 py-3.5 bg-[#F8F7F4] border border-[#E2E0DC] rounded-xl text-left transition-colors hover:bg-[#F0EEE9] hover:border-[#D5D2CD]"
              >
                <MapPin className="w-[18px] h-[18px] text-gray-500 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-[#1A1A1A] mb-0.5">Common Area</span>
                  <span className="block text-xs text-[#9A9790] leading-snug">Report an issue in a shared common area</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#C0BDB8] shrink-0" />
              </button>
            </div>
          </>
        )}

        {/* Step 2: Form */}
        {step === 2 && mode && (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 shrink-0">
              {!hasPreselection && (
                <button
                  onClick={goBack}
                  className="p-1 rounded-md text-[#9A9790] hover:text-[#6B7280] hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-[#1A1A1A]">Report Maintenance Request</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {mode === "property" ? "Reporting at a property" : "Reporting at a common area"}
                </p>
              </div>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Property / Common Area selector */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  {mode === "property" ? "Property" : "Common Area"}
                </label>

                {mode === "property" && preselectedProperty && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
                    <span className="text-sm font-medium text-gray-800">{preselectedProperty.name}</span>
                    {preselectedProperty.tenantName && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="text-sm text-gray-600">{preselectedProperty.tenantName}</span>
                      </>
                    )}
                  </div>
                )}

                {mode === "property" && !preselectedProperty && (
                  <PropertyDropdown value={selectedPropertyId} onChange={setSelectedPropertyId} />
                )}

                {mode === "common_area" && preselectedCommonArea && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
                    <span className="text-sm font-medium text-gray-800">{preselectedCommonArea.name}</span>
                  </div>
                )}

                {mode === "common_area" && !preselectedCommonArea && (
                  <div className="relative">
                    <select
                      value={selectedCommonArea}
                      onChange={(e) => setSelectedCommonArea(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg text-sm appearance-none cursor-pointer pr-9 transition-colors focus:outline-none focus:border-[#B0ADA8]"
                      style={{ color: selectedCommonArea ? "#1A1A1A" : "#B0ADA8" }}
                    >
                      <option value="" disabled>Select a common area…</option>
                      {COMMON_AREA_OPTIONS.map((a) => (
                        <option key={a} value={a} style={{ color: "#1A1A1A" }}>{a}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0ADA8] pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Describe the issue */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Describe the issue <span className="text-red-400">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Kitchen sink is leaking and water pools under the cabinet."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg text-sm text-[#1A1A1A] placeholder-[#B0ADA8] focus:outline-none focus:border-[#B0ADA8] transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Priority toggle */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Priority</label>
                <button
                  type="button"
                  onClick={() => setIsPriority((p) => !p)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    isPriority
                      ? "border-[#C94A00] text-[#C94A00] bg-[#FFF1EC]"
                      : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
                  }`}
                >
                  {isPriority ? "Priority: On" : "Add Priority"}
                </button>
              </div>

              {/* Assign FM */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Assign Facility Manager</label>
                <div className="relative">
                  <select
                    value={assignedFmId}
                    onChange={(e) => setAssignedFmId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#F8F7F4] border border-[#E2E0DC] rounded-lg text-sm appearance-none cursor-pointer pr-9 focus:outline-none focus:border-[#B0ADA8] transition-colors"
                    style={{ color: assignedFmId ? "#1A1A1A" : "#B0ADA8" }}
                  >
                    <option value="" style={{ color: "#B0ADA8" }}>Assign to facility manager (optional)</option>
                    {MOCK_FMS.map((fm) => (
                      <option key={fm.id} value={fm.id} style={{ color: "#1A1A1A" }}>{fm.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0ADA8] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-white flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                  isValid
                    ? "bg-[#FF5000] hover:bg-[#e04600] text-white cursor-pointer"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Submit Request
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
