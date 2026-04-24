/* eslint-disable */
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ArrowLeft, Download, Send, Save, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { calculateEndDate } from "./RenewTenancyModal";
import { formatNumberWithCommas, parseFormattedNumber } from "../utilities/utilities";

// ── helpers ────────────────────────────────────────────────────────────────

function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatShortDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatNaira(raw: string): string {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!n || isNaN(n)) return "—";
  return `₦${n.toLocaleString()}`;
}

function tenancyTermLabel(freq: string): string {
  switch (freq.toLowerCase()) {
    case "monthly": return "One Month Fixed.";
    case "quarterly": return "Three Months Fixed.";
    case "bi-annually": return "Six Months Fixed.";
    case "annually": return "One Year Fixed.";
    default: return "Fixed Term.";
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function longMonthYear(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

// ── types ──────────────────────────────────────────────────────────────────

export interface RenewTenancyData {
  rentAmount: string;
  paymentFrequency: string;
  serviceCharge: string;
  endDate?: string;
}

interface Props {
  onClose: () => void;
  onConfirm: (data: RenewTenancyData) => void;
  tenantName?: string;
  tenantAddress?: string;
  propertyName?: string;
  propertyAddress?: string;
  landlordName?: string;
  currentExpiryDate?: string;
  currentRentAmount?: number;
  currentPaymentFrequency?: string;
  currentServiceCharge?: number;
  isLoading?: boolean;
}

// ── component ──────────────────────────────────────────────────────────────

export function RenewTenancyScreen({
  onClose,
  onConfirm,
  tenantName = "Tenant",
  tenantAddress = "",
  propertyName = "",
  propertyAddress = "",
  landlordName = "Landlord",
  currentExpiryDate = "",
  currentRentAmount = 0,
  currentPaymentFrequency = "Annually",
  currentServiceCharge = 0,
  isLoading = false,
}: Props) {
  // ── form state ──────────────────────────────────────────────────────────
  const [frequency, setFrequency] = useState(currentPaymentFrequency);
  const [rentAmount, setRentAmount] = useState(
    currentRentAmount ? formatNumberWithCommas(currentRentAmount) : ""
  );
  const [serviceCharge, setServiceCharge] = useState(
    currentServiceCharge ? formatNumberWithCommas(currentServiceCharge) : ""
  );
  const [additionalFees, setAdditionalFees] = useState("");
  const [customLandlordName, setCustomLandlordName] = useState(landlordName);
  const [customEndDate, setCustomEndDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── derived dates ───────────────────────────────────────────────────────
  const newStartDate = useMemo(() => {
    if (!currentExpiryDate) return todayISO();
    const d = new Date(currentExpiryDate);
    if (isNaN(d.getTime())) return todayISO();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, [currentExpiryDate]);

  const autoEndDate = useMemo(() => calculateEndDate(newStartDate, frequency), [newStartDate, frequency]);
  const effectiveEndDate = customEndDate || autoEndDate;

  // ── editable letter state ───────────────────────────────────────────────
  const [letterSubject, setLetterSubject] = useState(
    `RENT RENEWAL OFFER FOR RENT OF ${propertyName ? propertyName.toUpperCase() : "PROPERTY"}`
  );
  const [letterOpening, setLetterOpening] = useState(
    `This is to formally notify you that your tenancy over the property situate at ${propertyAddress || propertyName} which you currently occupy expires on the ${formatDisplayDate(currentExpiryDate)}. Following the expiry of your tenancy, we hereby make you an offer to rent the property for another tenancy period upon the following terms:`
  );
  const [letterClosing, setLetterClosing] = useState(
    "This Rent Renewal Offer and the attached Terms of Tenancy (together the “Tenancy Agreement”) shall govern the tenancy relationship between the Landlord and you for the Tenancy Period."
  );

  // ── validation ──────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!frequency) e.frequency = "Payment frequency is required.";
    const rentNum = parseFloat((rentAmount || "").replace(/[^0-9.]/g, ""));
    if (!rentNum || isNaN(rentNum) || rentNum <= 0) e.rentAmount = "Rent amount is required.";
    if (customEndDate && customEndDate <= newStartDate) e.endDate = "End date must be after start date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSend() {
    if (!validate()) return;
    onConfirm({ rentAmount, paymentFrequency: frequency, serviceCharge, endDate: customEndDate || undefined });
  }

  function handleRentChange(v: string) {
    const n = v.replace(/[^0-9.]/g, "");
    setRentAmount(n ? formatNumberWithCommas(parseFloat(n)) : "");
    setErrors((p) => { const c = { ...p }; delete c.rentAmount; return c; });
  }

  function handleServiceChargeChange(v: string) {
    const n = v.replace(/[^0-9.]/g, "");
    setServiceCharge(n && parseFloat(n) > 0 ? formatNumberWithCommas(parseFloat(n)) : "");
  }

  // ── letter computed values ──────────────────────────────────────────────
  const todayFormatted = formatDisplayDate(todayISO());
  const rentDisplay = formatNaira(rentAmount);
  const serviceChargeDisplay = formatNaira(serviceCharge);
  const additionalFeesDisplay = formatNaira(additionalFees);
  const tenancyTerm = tenancyTermLabel(frequency);
  const periodDisplay =
    effectiveEndDate
      ? `${formatShortDate(newStartDate)}, to ${formatShortDate(effectiveEndDate)}`
      : `${formatShortDate(newStartDate)}, to —`;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden">
      {/* ── top bar ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shrink-0">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1 -ml-1 rounded"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Renew Tenancy</h1>
              {tenantName && propertyName && (
                <p className="text-xs text-gray-400 leading-none mt-0.5">
                  {tenantName} · {propertyName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-gray-600 border-gray-200 h-8 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-200 h-8 px-3 text-xs"
            >
              <Save className="w-3 h-3 mr-1.5" />
              Save Draft
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-200 h-8 px-3 text-xs"
            >
              <Download className="w-3 h-3 mr-1.5" />
              Download PDF
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={isLoading}
              className="bg-[#FF5000] hover:bg-[#e04600] text-white h-8 px-4 text-xs"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Send className="w-3 h-3" />
                  Send Offer Letter
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── body ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex gap-6 items-start">

            {/* ── LEFT: Form ─────────────────────────────────────────── */}
            <div className="w-[380px] shrink-0 space-y-5">

              {/* Auto-filled info banner */}
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Tenant and property details are pre-filled. Update the fields below to generate the offer letter.</span>
              </div>

              {/* Tenant Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tenant Name</Label>
                <Input value={tenantName} readOnly className="bg-gray-50 text-gray-600 text-sm" />
              </div>

              {/* Property */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Property</Label>
                <Input value={propertyAddress || propertyName} readOnly className="bg-gray-50 text-gray-600 text-sm" />
              </div>

              {/* Landlord Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Landlord Name</Label>
                <Input
                  value={customLandlordName}
                  onChange={(e) => setCustomLandlordName(e.target.value)}
                  className="text-sm"
                  placeholder="Landlord name"
                />
              </div>

              <div className="border-t border-gray-200 pt-1" />

              {/* Payment Frequency */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Payment Frequency <span className="text-red-500">*</span>
                </Label>
                <Select value={frequency} onValueChange={(v) => { setFrequency(v); setCustomEndDate(""); setErrors((p) => { const c = { ...p }; delete c.frequency; return c; }); }}>
                  <SelectTrigger className={`text-sm ${errors.frequency ? "border-red-400" : ""}`}>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Bi-annually">Bi-annually</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
                {errors.frequency && <p className="text-xs text-red-500">{errors.frequency}</p>}
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tenancy Start Date</Label>
                <Input
                  type="text"
                  value={formatShortDate(newStartDate)}
                  readOnly
                  className="bg-gray-50 text-gray-600 text-sm"
                />
                <p className="text-xs text-gray-400">Auto-calculated from previous tenancy end date.</p>
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tenancy End Date</Label>
                <Input
                  type="date"
                  value={customEndDate || autoEndDate}
                  min={newStartDate || undefined}
                  onChange={(e) => { setCustomEndDate(e.target.value); setErrors((p) => { const c = { ...p }; delete c.endDate; return c; }); }}
                  className={`text-sm ${errors.endDate ? "border-red-400" : ""}`}
                />
                {customEndDate && autoEndDate && customEndDate !== autoEndDate ? (
                  <p className="text-xs text-blue-600">
                    Manually set.{" "}
                    <button type="button" className="underline" onClick={() => setCustomEndDate("")}>Reset to auto</button>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Auto-calculated from frequency. You can adjust manually.</p>
                )}
                {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
              </div>

              <div className="border-t border-gray-200 pt-1" />

              {/* Rent Amount */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Rent Amount <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                  <Input
                    type="text"
                    placeholder="0"
                    value={rentAmount}
                    onChange={(e) => handleRentChange(e.target.value)}
                    className={`pl-7 text-sm ${errors.rentAmount ? "border-red-400" : ""}`}
                  />
                </div>
                {errors.rentAmount && <p className="text-xs text-red-500">{errors.rentAmount}</p>}
              </div>

              {/* Service Charge */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Service Charge</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                  <Input
                    type="text"
                    placeholder="0"
                    value={serviceCharge}
                    onChange={(e) => handleServiceChargeChange(e.target.value)}
                    className="pl-7 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400">Leave empty if not applicable.</p>
              </div>

              {/* Additional Fees */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Additional Fees <span className="text-gray-400 font-normal normal-case">(optional)</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                  <Input
                    type="text"
                    placeholder="0"
                    value={additionalFees}
                    onChange={(e) => {
                      const n = e.target.value.replace(/[^0-9.]/g, "");
                      setAdditionalFees(n && parseFloat(n) > 0 ? formatNumberWithCommas(parseFloat(n)) : "");
                    }}
                    className="pl-7 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* ── RIGHT: Letter Preview ───────────────────────────────── */}
            <div className="flex-1 min-w-0">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* document chrome */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <span className="ml-3 text-xs text-gray-400">Offer Letter Preview — editable</span>
                </div>

                {/* document body */}
                <div className="px-14 py-12 font-serif text-[13.5px] leading-relaxed text-gray-800 min-h-[calc(100vh-180px)]">

                  {/* date */}
                  <p className="mb-8 text-gray-700">{todayFormatted}</p>

                  {/* recipient */}
                  <div className="mb-8 space-y-0.5 font-sans font-semibold text-gray-900 text-sm">
                    <p>{tenantName}</p>
                    {tenantAddress ? (
                      tenantAddress.split(",").map((line, i) => <p key={i}>{line.trim()}</p>)
                    ) : null}
                  </div>

                  {/* salutation */}
                  <p className="mb-6">Dear {tenantName.split(" ")[0] || "Sir/Ma"},</p>

                  {/* subject — editable */}
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setLetterSubject(e.currentTarget.textContent || "")}
                    className="mb-6 font-sans font-bold text-sm uppercase underline outline-none focus:bg-yellow-50 rounded px-0.5 -mx-0.5 cursor-text"
                  >
                    {letterSubject}
                  </div>

                  {/* opening paragraph — editable */}
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setLetterOpening(e.currentTarget.textContent || "")}
                    className="mb-6 outline-none focus:bg-yellow-50 rounded px-0.5 -mx-0.5 cursor-text"
                  >
                    {letterOpening}
                  </div>

                  {/* terms table */}
                  <div className="mb-6 space-y-3 pl-4">
                    <TermRow label="Permitted Use" value="Residential." italic />
                    <TermRow label="Rent" value={rentDisplay} />
                    {serviceCharge ? <TermRow label="Service Charge" value={serviceChargeDisplay} footnote="1" /> : null}
                    {additionalFees ? <TermRow label="Additional Fees" value={additionalFeesDisplay} /> : null}
                    <TermRow label="Tenancy Term" value={tenancyTerm} italic />
                    <TermRow label="Tenancy Period" value={periodDisplay} italic />
                  </div>

                  {/* closing paragraph — editable */}
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setLetterClosing(e.currentTarget.textContent || "")}
                    className="mb-10 outline-none focus:bg-yellow-50 rounded px-0.5 -mx-0.5 cursor-text"
                  >
                    {letterClosing}
                  </div>

                  {/* sign-off */}
                  <p className="mb-10">Yours faithfully,</p>

                  {/* signature block */}
                  <div className="space-y-0.5">
                    <p className="font-sans font-bold text-sm text-gray-900">{customLandlordName}</p>
                    {propertyAddress && (
                      <p className="text-xs text-gray-500 font-sans">{propertyAddress}</p>
                    )}
                  </div>

                  {/* acceptance block */}
                  <div className="mt-16 pt-8 border-t border-gray-300">
                    <p className="font-sans font-bold text-sm uppercase mb-3">Acceptance of Terms</p>
                    <p className="mb-8">
                      I, <span className="font-semibold">{tenantName.toUpperCase()}</span>, accept the above terms and conditions contained in this Tenancy Agreement dated {todayFormatted}.
                    </p>
                    <div className="flex gap-20">
                      <div className="space-y-1">
                        <div className="w-44 border-b border-gray-400" />
                        <p className="text-xs font-sans text-gray-500">Signature</p>
                      </div>
                      <div className="space-y-1">
                        <div className="w-44 border-b border-gray-400" />
                        <p className="text-xs font-sans text-gray-500">Date</p>
                      </div>
                    </div>
                  </div>

                  {/* footnote */}
                  {serviceCharge ? (
                    <div className="mt-12 pt-4 border-t border-gray-200 text-xs text-gray-500 font-sans">
                      <sup>1</sup> This covers the associated cost of maintaining general utilities and services which include but are not limited to, the water treatment plant and supply system, meter vending platform, security, cleaning of general areas, and waste management.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── sub-components ─────────────────────────────────────────────────────────

function TermRow({
  label,
  value,
  italic,
  footnote,
}: {
  label: string;
  value: string;
  italic?: boolean;
  footnote?: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="w-36 shrink-0 font-sans font-semibold text-xs uppercase tracking-wide underline">
        {label}:{footnote ? <sup>{footnote}</sup> : null}
      </span>
      <span className={italic ? "italic" : ""}>{value}</span>
    </div>
  );
}
