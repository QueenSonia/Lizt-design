"use client";
import { useState, useEffect } from "react";
import { X, Trash2, Plus, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IKycApplication } from "@/types/kyc-application";
import { useFetchAllVacantProperties } from "@/services/property/query";
import { useCheckExistingOffer } from "@/services/offer-letters/query";
import Image from "next/image";
import { isValidImageSrc } from "@/lib/utils";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { parseFormattedNumber } from "@/utils/formatters";
import { OfferLetterPreview } from "@/components/OfferLetterPreview";
import { OfferLetterData } from "@/components/OfferLetterDocument";

interface AttachTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: IKycApplication;
}

type FlowType = "attach" | "offer-letter";
type RentFrequency = "Monthly" | "Quarterly" | "Bi-Annually" | "Annually";

interface OtherFee {
  name: string;
  amount: string;
  recurring: boolean;
}

// ── Inline recurring toggle ──────────────────────────────────────────────────
function RecurringToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border transition-all select-none ${
        value
          ? "bg-[#FFF5F0] border-[#FF5000] text-[#FF5000]"
          : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
      }`}
      title={value ? "Recurring — included in billing total" : "One-time — not in billing total"}
    >
      <RefreshCw className={`w-3 h-3 ${value ? "" : "opacity-50"}`} />
      Recurring
    </button>
  );
}

export function AttachTenantFromKycModal({
  isOpen,
  onClose,
  application,
}: AttachTenantModalProps) {
  const [flowType, setFlowType] = useState<FlowType>("attach");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [attachSuccess, setAttachSuccess] = useState(false);

  // Property selection
  const [selectedProperty, setSelectedProperty] = useState<{ id: string; name: string; address?: string } | null>(null);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");

  // Core fields
  const [rentAmount, setRentAmount] = useState("");
  const [rentFrequency, setRentFrequency] = useState<RentFrequency | "">("");
  const [tenancyStartDate, setTenancyStartDate] = useState<Date | undefined>(undefined);
  const [tenancyEndDate, setTenancyEndDate] = useState<Date | undefined>(undefined);
  const [endDateManuallySet, setEndDateManuallySet] = useState(false);

  // Fees with recurring flags
  const [serviceCharge, setServiceCharge] = useState("");
  const [serviceChargeRecurring, setServiceChargeRecurring] = useState(true);   // default ON

  const [cautionDeposit, setCautionDeposit] = useState("");
  const [cautionDepositRecurring, setCautionDepositRecurring] = useState(false); // default OFF

  const [legalFee, setLegalFee] = useState("");
  const [legalFeeRecurring, setLegalFeeRecurring] = useState(false);             // default OFF

  const [agencyFee, setAgencyFee] = useState("");
  const [agencyFeeRecurring, setAgencyFeeRecurring] = useState(false);           // default OFF

  const [otherFees, setOtherFees] = useState<OtherFee[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: properties = [] } = useFetchAllVacantProperties();

  const { data: existingOffer, isLoading: isCheckingOffer } = useCheckExistingOffer(
    application.id,
    selectedProperty?.id || "",
    { enabled: flowType === "offer-letter" && !!selectedProperty?.id },
  );

  const frequencies: RentFrequency[] = ["Monthly", "Quarterly", "Bi-Annually", "Annually"];

  // Auto-calculate end date
  useEffect(() => {
    if (tenancyStartDate && rentFrequency && !endDateManuallySet) {
      const s = new Date(tenancyStartDate);
      let e: Date;
      switch (rentFrequency) {
        case "Monthly":     e = new Date(s); e.setMonth(e.getMonth() + 1);        break;
        case "Quarterly":   e = new Date(s); e.setMonth(e.getMonth() + 3);        break;
        case "Bi-Annually": e = new Date(s); e.setMonth(e.getMonth() + 6);        break;
        case "Annually":    e = new Date(s); e.setFullYear(e.getFullYear() + 1);  break;
        default: return;
      }
      e.setDate(e.getDate() - 1);
      setTenancyEndDate(e);
    }
  }, [tenancyStartDate, rentFrequency, endDateManuallySet]);

  // Pre-fill from existing offer
  useEffect(() => {
    if (existingOffer && flowType === "offer-letter") {
      setRentAmount(existingOffer.rentAmount.toString());
      setRentFrequency(existingOffer.rentFrequency as RentFrequency);
      if (existingOffer.serviceCharge) setServiceCharge(existingOffer.serviceCharge.toString());
      if (existingOffer.tenancyStartDate) setTenancyStartDate(new Date(existingOffer.tenancyStartDate));
      if (existingOffer.tenancyEndDate) { setTenancyEndDate(new Date(existingOffer.tenancyEndDate)); setEndDateManuallySet(true); }
      if (existingOffer.cautionDeposit) setCautionDeposit(existingOffer.cautionDeposit.toString());
      if (existingOffer.legalFee) setLegalFee(existingOffer.legalFee.toString());
      if (existingOffer.agencyFee) setAgencyFee(existingOffer.agencyFee.toString());
    }
  }, [existingOffer, flowType]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setFlowType("attach");
      setShowPreview(false);
      setShowConfirmModal(false);
      setAttachSuccess(false);
      setSelectedProperty(null);
      setShowPropertyDropdown(false);
      setPropertySearchQuery("");
      setRentAmount("");
      setRentFrequency("");
      setServiceCharge(""); setServiceChargeRecurring(true);
      setTenancyStartDate(undefined);
      setTenancyEndDate(undefined);
      setEndDateManuallySet(false);
      setCautionDeposit(""); setCautionDepositRecurring(false);
      setLegalFee(""); setLegalFeeRecurring(false);
      setAgencyFee(""); setAgencyFeeRecurring(false);
      setOtherFees([]);
      setErrors({});
    }
  }, [isOpen]);

  const filteredProperties = (properties as Array<{ id: string; name: string; address?: string }>).filter(
    (p) =>
      p.name?.toLowerCase().includes(propertySearchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(propertySearchQuery.toLowerCase()),
  );

  const parseCurrency = (val: string) =>
    parseFloat(parseFormattedNumber(val.replace(/,/g, ""))) || 0;

  const formatCurrency = (value: string) => {
    const num = value.replace(/,/g, "");
    if (!num || isNaN(Number(num))) return value;
    return Number(num).toLocaleString();
  };

  const handleNumericInput = (value: string, setter: (v: string) => void, errorKey?: string) => {
    const cleaned = value.replace(/,/g, "");
    if (cleaned === "" || /^\d+(\.\d*)?$/.test(cleaned)) {
      setter(cleaned);
      if (errorKey && errors[errorKey]) setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedProperty) newErrors.property = "Property is required";
    if (!rentAmount || parseCurrency(rentAmount) <= 0) newErrors.rentAmount = "Valid rent amount is required";
    if (!rentFrequency) newErrors.rentFrequency = "Rent frequency is required";
    if (!serviceCharge || parseCurrency(serviceCharge) < 0) newErrors.serviceCharge = "Service charge is required";
    if (!tenancyStartDate) newErrors.tenancyStartDate = "Tenancy start date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Compute billing total (recurring fees only)
  const recurringTotal = (() => {
    let total = parseCurrency(rentAmount);
    if (serviceChargeRecurring) total += parseCurrency(serviceCharge);
    if (cautionDepositRecurring && cautionDeposit) total += parseCurrency(cautionDeposit);
    if (legalFeeRecurring && legalFee) total += parseCurrency(legalFee);
    if (agencyFeeRecurring && agencyFee) total += parseCurrency(agencyFee);
    otherFees.forEach((f) => { if (f.recurring && f.amount) total += parseCurrency(f.amount); });
    return total;
  })();

  const handleSubmit = () => {
    if (!validate()) return;
    if (flowType === "attach") setShowConfirmModal(true);
    else setShowPreview(true);
  };

  const handleConfirmAttach = () => {
    setShowConfirmModal(false);
    setAttachSuccess(true);
    setTimeout(() => onClose(), 1800);
  };

  const formatDate = (d: Date | undefined) => {
    if (!d) return "—";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getExistingOfferStatus = () => {
    if (!existingOffer) return null;
    const status = existingOffer.status;
    if (status === "accepted") return { label: "Accepted", color: "green" };
    if (status === "rejected") return { label: "Declined", color: "red" };
    if (existingOffer.sentAt) return { label: "Sent", color: "blue" };
    return { label: "Saved", color: "gray" };
  };

  const getOfferLetterData = (): OfferLetterData => ({
    applicantName: application.name,
    applicantEmail: application.email,
    applicantGender: application.sex,
    propertyName: selectedProperty?.name || "",
    rentAmount: parseCurrency(rentAmount),
    rentFrequency: rentFrequency || "",
    serviceCharge: serviceCharge ? parseCurrency(serviceCharge) : undefined,
    tenancyStartDate: tenancyStartDate
      ? `${tenancyStartDate.getFullYear()}-${String(tenancyStartDate.getMonth() + 1).padStart(2, "0")}-${String(tenancyStartDate.getDate()).padStart(2, "0")}`
      : "",
    tenancyEndDate: tenancyEndDate
      ? `${tenancyEndDate.getFullYear()}-${String(tenancyEndDate.getMonth() + 1).padStart(2, "0")}-${String(tenancyEndDate.getDate()).padStart(2, "0")}`
      : undefined,
    cautionDeposit: cautionDeposit ? parseCurrency(cautionDeposit) : undefined,
    legalFee: legalFee ? parseCurrency(legalFee) : undefined,
    agencyFee: agencyFee && !isNaN(parseCurrency(agencyFee)) ? parseCurrency(agencyFee) : undefined,
    tenantAddress: application.contactAddress,
  });

  const isFormValid =
    !!selectedProperty &&
    !!rentAmount &&
    parseCurrency(rentAmount) > 0 &&
    !!rentFrequency &&
    !!serviceCharge &&
    !!tenancyStartDate;

  if (!isOpen) return null;

  // ── Offer letter preview ─────────────────────────────────────────────────
  if (showPreview && flowType === "offer-letter") {
    return (
      <OfferLetterPreview
        data={getOfferLetterData()}
        applicantPhone={application.phone}
        kycApplicationId={application.id}
        propertyId={selectedProperty?.id || ""}
        onBack={() => setShowPreview(false)}
        onComplete={onClose}
        initialSavedOfferToken={
          existingOffer?.status !== "accepted" && existingOffer?.status !== "rejected"
            ? existingOffer?.token
            : undefined
        }
        initialSavedOfferId={
          existingOffer?.status !== "accepted" && existingOffer?.status !== "rejected"
            ? existingOffer?.id
            : undefined
        }
      />
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (attachSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-8 text-center">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Tenant Attached</h3>
          <p className="text-sm text-gray-500">Tenancy has been activated successfully.</p>
        </div>
      </div>
    );
  }

  // ── Confirmation modal ───────────────────────────────────────────────────
  if (showConfirmModal) {
    // Build recurring and one-time rows separately
    const recurringRows: { label: string; value: string }[] = [
      { label: "Rent", value: `₦${parseCurrency(rentAmount).toLocaleString()} / ${rentFrequency}` },
    ];
    if (serviceCharge && serviceChargeRecurring)
      recurringRows.push({ label: "Service Charge", value: `₦${parseCurrency(serviceCharge).toLocaleString()}` });
    if (cautionDeposit && cautionDepositRecurring)
      recurringRows.push({ label: "Security Deposit", value: `₦${parseCurrency(cautionDeposit).toLocaleString()}` });
    if (legalFee && legalFeeRecurring)
      recurringRows.push({ label: "Legal Fee", value: `₦${parseCurrency(legalFee).toLocaleString()}` });
    if (agencyFee && agencyFeeRecurring)
      recurringRows.push({ label: "Agency Fee", value: `₦${parseCurrency(agencyFee).toLocaleString()}` });
    otherFees.forEach((f) => {
      if ((f.name || f.amount) && f.recurring)
        recurringRows.push({ label: f.name || "Other Fee", value: `₦${parseCurrency(f.amount).toLocaleString()}` });
    });

    const oneTimeRows: { label: string; value: string }[] = [];
    if (serviceCharge && !serviceChargeRecurring)
      oneTimeRows.push({ label: "Service Charge", value: `₦${parseCurrency(serviceCharge).toLocaleString()}` });
    if (cautionDeposit && !cautionDepositRecurring)
      oneTimeRows.push({ label: "Security Deposit", value: `₦${parseCurrency(cautionDeposit).toLocaleString()}` });
    if (legalFee && !legalFeeRecurring)
      oneTimeRows.push({ label: "Legal Fee", value: `₦${parseCurrency(legalFee).toLocaleString()}` });
    if (agencyFee && !agencyFeeRecurring)
      oneTimeRows.push({ label: "Agency Fee", value: `₦${parseCurrency(agencyFee).toLocaleString()}` });
    otherFees.forEach((f) => {
      if ((f.name || f.amount) && !f.recurring)
        oneTimeRows.push({ label: f.name || "Other Fee", value: `₦${parseCurrency(f.amount).toLocaleString()}` });
    });

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg text-gray-900 font-medium">Confirm Tenancy Details</h2>
            <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Tenant */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              {isValidImageSrc(application.passportPhoto) ? (
                <Image src={application.passportPhoto} alt={application.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#FF5000] text-white flex items-center justify-center text-sm font-semibold">
                  {application.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{application.name}</p>
                <p className="text-sm text-gray-500">{application.phone}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Start Date</p>
                <p className="font-medium text-gray-900">{formatDate(tenancyStartDate)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">End Date</p>
                <p className="font-medium text-gray-900">{formatDate(tenancyEndDate)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Property</p>
                <p className="font-medium text-gray-900">{selectedProperty?.name}</p>
              </div>
            </div>

            {/* Recurring fees */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" /> Recurring charges
              </p>
              <div className="space-y-2">
                {recurringRows.map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-medium text-gray-900">{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold text-gray-900 border-t border-gray-100 pt-2">
                  <span>Billing Total</span>
                  <span>₦{recurringTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* One-time fees */}
            {oneTimeRows.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">One-time charges</p>
                <div className="space-y-2">
                  {oneTimeRows.map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-gray-600">{row.label}</span>
                      <span className="font-medium text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-orange-700">
                The tenancy will be <strong>activated immediately</strong> once you confirm. No offer letter will be sent.
              </p>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)}>Back</Button>
            <Button className="flex-1 bg-[#FF5000] hover:bg-[#E64800] text-white" onClick={handleConfirmAttach}>
              Confirm &amp; Attach
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg text-gray-900 font-medium">Attach Tenant — Tenancy Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Applicant summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {isValidImageSrc(application.passportPhoto) ? (
                <Image src={application.passportPhoto} alt={application.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#FF5000] text-white flex items-center justify-center font-semibold">
                  {application.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-gray-900 font-medium">{application.name}</p>
                <p className="text-sm text-gray-500">{application.phone}</p>
                <p className="text-sm text-gray-500">{application.email}</p>
              </div>
            </div>
          </div>

          {/* Flow type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">How would you like to attach this tenant?</label>
            <div className="grid grid-cols-2 gap-3">
              {(["attach", "offer-letter"] as FlowType[]).map((type) => (
                <label
                  key={type}
                  className={`flex flex-col gap-1.5 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    flowType === type ? "border-[#FF5000] bg-[#FFF5F0]" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <input type="radio" name="flowType" value={type} checked={flowType === type} onChange={() => setFlowType(type)} className="sr-only" />
                  <span className={`text-sm font-semibold ${flowType === type ? "text-[#FF5000]" : "text-gray-900"}`}>
                    {type === "attach" ? "Attach Tenant" : "Attach with Offer Letter"}
                  </span>
                  <span className="text-xs text-gray-500 leading-relaxed">
                    {type === "attach"
                      ? "Activate tenancy immediately. No offer letter sent."
                      : "Send an offer letter for review before activating tenancy."}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {/* Property */}
            <div className="relative">
              <label className="block text-sm text-gray-700 mb-1.5">
                Property <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  value={selectedProperty ? selectedProperty.name : propertySearchQuery}
                  onChange={(e) => {
                    if (selectedProperty) setSelectedProperty(null);
                    setPropertySearchQuery(e.target.value);
                    setShowPropertyDropdown(true);
                  }}
                  onFocus={() => setShowPropertyDropdown(true)}
                  placeholder="Search and select property..."
                  className={errors.property ? "border-red-500" : ""}
                />
                {selectedProperty && (
                  <button
                    onClick={() => { setSelectedProperty(null); setPropertySearchQuery(""); setShowPropertyDropdown(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {showPropertyDropdown && !selectedProperty && filteredProperties.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {filteredProperties.map((property) => (
                    <div
                      key={property.id}
                      onClick={() => {
                        setSelectedProperty({ id: property.id, name: property.name, address: property.address });
                        setPropertySearchQuery("");
                        setShowPropertyDropdown(false);
                        setErrors((prev) => ({ ...prev, property: "" }));
                      }}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 text-sm">{property.name}</div>
                      {property.address && <div className="text-xs text-gray-500 mt-0.5">{property.address}</div>}
                    </div>
                  ))}
                </div>
              )}
              {errors.property && <p className="text-xs text-red-500 mt-1">{errors.property}</p>}

              {existingOffer && !isCheckingOffer && flowType === "offer-letter" && (() => {
                const offerStatus = getExistingOfferStatus();
                if (!offerStatus) return null;
                const colorClasses: Record<string, string> = {
                  green: "bg-green-50 border-green-200 text-green-700",
                  blue: "bg-blue-50 border-blue-200 text-blue-700",
                  gray: "bg-gray-50 border-gray-200 text-gray-700",
                  red: "bg-red-50 border-red-200 text-red-700",
                };
                return (
                  <div className={`mt-2 p-3 border rounded text-xs ${colorClasses[offerStatus.color]}`}>
                    <div className="font-medium mb-1">📄 Existing Offer Letter Found</div>
                    <div>
                      Previously{" "}
                      <strong>{offerStatus.label === "Saved" ? "saved (not sent)" : offerStatus.label.toLowerCase()}</strong>.{" "}
                      {existingOffer?.status === "accepted" || existingOffer?.status === "rejected"
                        ? "A new offer letter will be created."
                        : "Continuing will let you view and edit it."}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Rent amount + frequency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-gray-700">Rent amount <span className="text-red-500">*</span></label>
                  {/* Rent is always recurring — no toggle */}
                  <span className="text-xs text-gray-400 flex items-center gap-1"><RefreshCw className="w-3 h-3" />Always recurring</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                  <Input
                    value={formatCurrency(rentAmount)}
                    onChange={(e) => handleNumericInput(e.target.value, setRentAmount, "rentAmount")}
                    placeholder="0"
                    className={`pl-8 ${errors.rentAmount ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.rentAmount && <p className="text-xs text-red-500 mt-1">{errors.rentAmount}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1.5">
                  Rent frequency <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={rentFrequency}
                    onChange={(e) => {
                      setRentFrequency(e.target.value as RentFrequency | "");
                      setEndDateManuallySet(false);
                      if (errors.rentFrequency) setErrors((prev) => ({ ...prev, rentFrequency: "" }));
                    }}
                    className={`w-full h-10 px-3 pr-10 border rounded-md text-sm bg-white appearance-none ${
                      errors.rentFrequency ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-[#FF5000]/20 focus:border-[#FF5000]`}
                  >
                    <option value="">Select frequency</option>
                    {frequencies.map((freq) => <option key={freq} value={freq}>{freq}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {errors.rentFrequency && <p className="text-xs text-red-500 mt-1">{errors.rentFrequency}</p>}
              </div>
            </div>

            {/* Service charge */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-gray-700">Service charge <span className="text-red-500">*</span></label>
                <RecurringToggle value={serviceChargeRecurring} onChange={setServiceChargeRecurring} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                <Input
                  value={formatCurrency(serviceCharge)}
                  onChange={(e) => handleNumericInput(e.target.value, setServiceCharge, "serviceCharge")}
                  placeholder="0"
                  className={`pl-8 ${errors.serviceCharge ? "border-red-500" : ""}`}
                />
              </div>
              {errors.serviceCharge && <p className="text-xs text-red-500 mt-1">{errors.serviceCharge}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">
                  Tenancy start date <span className="text-red-500">*</span>
                </label>
                <DatePickerInput
                  value={tenancyStartDate}
                  onChange={(date) => {
                    setTenancyStartDate(date);
                    setEndDateManuallySet(false);
                    if (errors.tenancyStartDate) setErrors((prev) => ({ ...prev, tenancyStartDate: "" }));
                  }}
                  placeholder="Select start date"
                  error={!!errors.tenancyStartDate}
                />
                {errors.tenancyStartDate && <p className="text-xs text-red-500 mt-1">{errors.tenancyStartDate}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">
                  Tenancy end date{" "}
                  <span className="text-xs text-gray-400">(auto-calculated)</span>
                </label>
                <DatePickerInput
                  value={tenancyEndDate}
                  onChange={(date) => { setTenancyEndDate(date); setEndDateManuallySet(true); }}
                  placeholder="Auto or select"
                />
              </div>
            </div>

            {/* Optional fees */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-4">Optional Fees</p>

              <div className="space-y-4">
                {/* Security deposit */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-gray-700">Security deposit</label>
                    <RecurringToggle value={cautionDepositRecurring} onChange={setCautionDepositRecurring} />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                    <Input value={formatCurrency(cautionDeposit)} onChange={(e) => handleNumericInput(e.target.value, setCautionDeposit)} placeholder="0" className="pl-8" />
                  </div>
                </div>

                {/* Legal fee */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-gray-700">Legal fee</label>
                    <RecurringToggle value={legalFeeRecurring} onChange={setLegalFeeRecurring} />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                    <Input value={formatCurrency(legalFee)} onChange={(e) => handleNumericInput(e.target.value, setLegalFee)} placeholder="0" className="pl-8" />
                  </div>
                </div>

                {/* Agency fee */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-gray-700">Agency fee</label>
                    <RecurringToggle value={agencyFeeRecurring} onChange={setAgencyFeeRecurring} />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                    <Input value={formatCurrency(agencyFee)} onChange={(e) => handleNumericInput(e.target.value, setAgencyFee)} placeholder="0" className="pl-8" />
                  </div>
                </div>
              </div>
            </div>

            {/* Other fees */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-700 font-medium">Other Fees</label>
                <button
                  type="button"
                  onClick={() => setOtherFees((prev) => [...prev, { name: "", amount: "", recurring: false }])}
                  className="flex items-center gap-1 text-xs text-[#FF5000] hover:text-[#E64800] font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add fee
                </button>
              </div>
              {otherFees.length === 0 && (
                <p className="text-xs text-gray-400">No additional fees added.</p>
              )}
              <div className="space-y-3">
                {otherFees.map((fee, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex gap-2 items-center">
                      <Input
                        value={fee.name}
                        onChange={(e) => {
                          const updated = [...otherFees];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setOtherFees(updated);
                        }}
                        placeholder="Fee name (e.g. Diesel levy)"
                        className="flex-1 text-sm"
                      />
                      <div className="relative w-36">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                        <Input
                          value={formatCurrency(fee.amount)}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/,/g, "");
                            if (cleaned === "" || /^\d+$/.test(cleaned)) {
                              const updated = [...otherFees];
                              updated[i] = { ...updated[i], amount: cleaned };
                              setOtherFees(updated);
                            }
                          }}
                          placeholder="0"
                          className="pl-8 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtherFees((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <RecurringToggle
                        value={fee.recurring}
                        onChange={(v) => {
                          const updated = [...otherFees];
                          updated[i] = { ...updated[i], recurring: v };
                          setOtherFees(updated);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live billing preview */}
            {parseCurrency(rentAmount) > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" /> Recurring billing total
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  ₦{recurringTotal.toLocaleString()}
                  {rentFrequency && <span className="text-sm text-gray-400 font-normal ml-1">/ {rentFrequency.toLowerCase()}</span>}
                </p>
                <p className="text-xs text-gray-400 mt-1">One-time fees are not included in this total.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="bg-[#FF5000] hover:bg-[#E64800] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {flowType === "attach" ? "Review & Confirm" : "Preview Offer Letter"}
          </Button>
        </div>
      </div>
    </div>
  );
}
