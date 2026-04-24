/* eslint-disable */
"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Download, Send, Save, Plus, Trash2 } from "lucide-react";
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
import { formatNumberWithCommas } from "../utilities/utilities";

// ── helpers ────────────────────────────────────────────────────────────────

function formatLongDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatShortMonthDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatOrdinalDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" :
    day % 10 === 2 && day !== 12 ? "nd" :
    day % 10 === 3 && day !== 13 ? "rd" : "th";
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const year = d.getFullYear();
  return `${day}${suffix} of ${month} ${year}`;
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
  landlordCompany?: string;
  landlordLogoUrl?: string;
  tenantWhatsApp?: string;
  tenantEmail?: string;
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
  landlordName = "Olatunji Oginni",
  landlordCompany = "Panda Homes Nigeria Limited",
  landlordLogoUrl,
  tenantWhatsApp = "09069333649",
  tenantEmail = "tenant@email.com",
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
  const [additionalFees, setAdditionalFees] = useState<{ id: string; name: string; amount: string }[]>([]);
  const [customLandlordName, setCustomLandlordName] = useState(landlordName);
  const [customLandlordCompany, setCustomLandlordCompany] = useState(landlordCompany);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── derived dates ───────────────────────────────────────────────────────
  const autoStartDate = useMemo(() => {
    if (!currentExpiryDate) return todayISO();
    const d = new Date(currentExpiryDate);
    if (isNaN(d.getTime())) return todayISO();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, [currentExpiryDate]);

  const newStartDate = customStartDate || autoStartDate;
  const autoEndDate = useMemo(() => calculateEndDate(newStartDate, frequency), [newStartDate, frequency]);
  const effectiveEndDate = customEndDate || autoEndDate;

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

  const [savedAt, setSavedAt] = useState<string | null>(null);
  function handleSave() {
    try {
      const payload = {
        frequency,
        rentAmount,
        serviceCharge,
        additionalFees,
        customStartDate,
        customEndDate,
        customLandlordName,
        customLandlordCompany,
        savedAt: new Date().toISOString(),
      };
      const key = `renewal-draft:${propertyName || "default"}:${tenantName || "default"}`;
      window.localStorage.setItem(key, JSON.stringify(payload));
      setSavedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // silently ignore storage errors
    }
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

  // ── computed letter values ──────────────────────────────────────────────
  const letterDate = formatLongDate(todayISO());
  const rentDisplay = formatNaira(rentAmount);
  const serviceChargeDisplay = formatNaira(serviceCharge);
  const activeAdditionalFees = additionalFees.filter((f) => f.name.trim() !== "" || (f.amount && parseFloat(f.amount.replace(/[^0-9.]/g, "")) > 0));
  const tenancyTerm = tenancyTermLabel(frequency);
  const startDisplay = formatShortMonthDate(newStartDate);
  const endDisplay = formatShortMonthDate(effectiveEndDate);
  const periodDisplay = effectiveEndDate ? `${startDisplay}, to ${endDisplay}` : `${startDisplay}, to —`;
  const expiryOrdinal = formatOrdinalDate(currentExpiryDate);
  const firstName = tenantName.split(" ")[0] || "Sir/Ma";
  const subjectLine = `RENT RENEWAL OFFER FOR RENT OF ${(propertyName || "PROPERTY").toUpperCase()}${propertyAddress ? " AT " + propertyAddress.toUpperCase() : ""}`;
  const addressLines = (tenantAddress || "").split(",").map((l) => l.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
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
            {savedAt && <span className="text-[11px] text-gray-400">Saved at {savedAt}</span>}
            <Button type="button" variant="outline" size="sm" onClick={handleSave} className="text-gray-600 border-gray-200 h-8 px-3 text-xs">
              <Save className="w-3 h-3 mr-1.5" />
              Save
            </Button>
            <Button type="button" variant="outline" size="sm" className="text-gray-600 border-gray-200 h-8 px-3 text-xs">
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
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-[1400px] mx-auto px-6 py-10">
          <div className="flex gap-10 items-start">

            {/* ── LEFT: Form (secondary) ─────────────────────────────── */}
            <div className="w-[320px] shrink-0 space-y-4 opacity-95">

              {/* 1. Tenancy Start Date */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Tenancy Start Date</Label>
                <Input
                  type="date"
                  value={customStartDate || autoStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setCustomEndDate("");
                  }}
                  className="text-sm"
                />
                <p className="text-xs text-gray-400">Auto-filled from previous tenancy. You can adjust if needed.</p>
              </div>

              {/* 2. Rent Frequency */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  Rent Frequency <span className="text-red-500">*</span>
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

              {/* 3. Tenancy End Date */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Tenancy End Date</Label>
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
                  <p className="text-xs text-gray-400">Auto-calculated from rent frequency. You can adjust manually.</p>
                )}
                {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
              </div>

              <div className="border-t border-gray-200 pt-1" />

              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  Rent Amount <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                  <Input type="text" placeholder="0" value={rentAmount} onChange={(e) => handleRentChange(e.target.value)} className={`pl-7 text-sm ${errors.rentAmount ? "border-red-400" : ""}`} />
                </div>
                {errors.rentAmount && <p className="text-xs text-red-500">{errors.rentAmount}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Service Charge</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                  <Input type="text" placeholder="0" value={serviceCharge} onChange={(e) => handleServiceChargeChange(e.target.value)} className="pl-7 text-sm" />
                </div>
                <p className="text-xs text-gray-400">Leave empty if not applicable.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    Additional Fees <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setAdditionalFees((prev) => [...prev, { id: Math.random().toString(36).slice(2, 9), name: "", amount: "" }])}
                    className="flex items-center gap-1 text-xs text-[#FF5000] hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    Add Fee
                  </button>
                </div>

                {additionalFees.length === 0 ? (
                  <p className="text-xs text-gray-400">No additional fees. Click "Add Fee" to include one.</p>
                ) : (
                  <div className="space-y-2">
                    {additionalFees.map((fee) => (
                      <div key={fee.id} className="grid grid-cols-[1fr_110px_auto] gap-2 items-center">
                        <Input
                          type="text"
                          placeholder="e.g. Legal Fee, Agency Fee"
                          value={fee.name}
                          onChange={(e) =>
                            setAdditionalFees((prev) =>
                              prev.map((f) => (f.id === fee.id ? { ...f, name: e.target.value } : f))
                            )
                          }
                          className="text-sm"
                        />
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                          <Input
                            type="text"
                            placeholder="0"
                            value={fee.amount}
                            onChange={(e) => {
                              const n = e.target.value.replace(/[^0-9.]/g, "");
                              const formatted = n && parseFloat(n) > 0 ? formatNumberWithCommas(parseFloat(n)) : "";
                              setAdditionalFees((prev) =>
                                prev.map((f) => (f.id === fee.id ? { ...f, amount: formatted } : f))
                              );
                            }}
                            className="pl-6 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setAdditionalFees((prev) => prev.filter((f) => f.id !== fee.id))}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          aria-label="Remove fee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Letter Preview — mirrors the reference document ─ */}
            <div className="flex-1 min-w-0 flex justify-center">
              <div
                contentEditable
                suppressContentEditableWarning
                className="bg-white mx-auto outline-none rounded-sm"
                style={{
                  width: "min(100%, 780px)",
                  minHeight: "1100px",
                  padding: "64px 72px",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  color: "#222",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.05)",
                  border: "1px solid rgba(0,0,0,0.04)",
                }}
              >
                {/* ── Page 1 ────────────────────────────────────────── */}

                {/* Letterhead: left = date + recipient, right = logo */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "32px",
                    marginBottom: "32px",
                    flexWrap: "wrap",
                  }}
                  contentEditable={false}
                >
                  <div style={{ flex: "1 1 auto", minWidth: "0" }}>
                    {/* date */}
                    <p style={{ marginBottom: "24px" }} contentEditable suppressContentEditableWarning>
                      {letterDate}
                    </p>

                    {/* recipient block */}
                    <div style={{ fontWeight: "bold" }} contentEditable suppressContentEditableWarning>
                      <p>{tenantName}</p>
                      {addressLines.length > 0 ? (
                        addressLines.map((line, i) => <p key={i}>{line}</p>)
                      ) : (
                        <>
                          <p>Plot 23, Providence Street</p>
                          <p>Lekki Phase 1</p>
                          <p>Lagos State</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Logo / placeholder */}
                  {landlordLogoUrl ? (
                    <img
                      src={landlordLogoUrl}
                      alt={`${customLandlordCompany} logo`}
                      style={{
                        flex: "0 0 auto",
                        width: "110px",
                        height: "auto",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        flex: "0 0 auto",
                        width: "110px",
                        height: "110px",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        fontSize: "11px",
                        fontWeight: 500,
                        textAlign: "center",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        backgroundColor: "#f8fafc",
                      }}
                      aria-label="Landlord logo placeholder"
                    >
                      Logo
                    </div>
                  )}
                </div>

                {/* salutation */}
                <p style={{ marginBottom: "24px" }}>Dear Mr {firstName},</p>

                {/* subject */}
                <p style={{ fontWeight: "bold", textDecoration: "underline", textTransform: "uppercase", marginBottom: "24px" }}>
                  {subjectLine}
                </p>

                {/* opening paragraph */}
                <p style={{ marginBottom: "24px" }}>
                  This is to formally notify you that your tenancy over the property situate at{" "}
                  {propertyAddress || propertyName} which you currently occupy expires on the{" "}
                  {expiryOrdinal}. Following the expiry of your tenancy, we hereby make you an
                  offer to rent the property for another tenancy period upon the following terms:
                </p>

                {/* bullet terms */}
                <ul style={{ listStyle: "disc", paddingLeft: "28px", marginBottom: "24px" }}>
                  <li style={{ marginBottom: "10px" }}>
                    <span style={{ fontWeight: "bold", textDecoration: "underline" }}>Permitted Use:</span>{" "}
                    <span style={{ fontStyle: "italic" }}>Residential.</span>
                  </li>
                  <li style={{ marginBottom: "10px" }}>
                    <span style={{ fontWeight: "bold", textDecoration: "underline" }}>Rent:</span>{" "}
                    {rentDisplay}
                  </li>
                  {serviceCharge ? (
                    <li style={{ marginBottom: "10px" }}>
                      <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
                        Service Charge:<sup>1</sup>
                      </span>{" "}
                      {serviceChargeDisplay}
                    </li>
                  ) : null}
                  {activeAdditionalFees.map((fee) => (
                    <li key={fee.id} style={{ marginBottom: "10px" }}>
                      <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
                        {fee.name.trim() || "Additional Fee"}:
                      </span>{" "}
                      {formatNaira(fee.amount)}
                    </li>
                  ))}
                  <li style={{ marginBottom: "10px" }}>
                    <span style={{ fontWeight: "bold", textDecoration: "underline" }}>Tenancy Term:</span>{" "}
                    <span style={{ fontStyle: "italic" }}>{tenancyTerm}</span>
                  </li>
                  <li style={{ marginBottom: "10px" }}>
                    <span style={{ fontWeight: "bold", textDecoration: "underline" }}>Tenancy Period:</span>{" "}
                    <span style={{ fontStyle: "italic" }}>{periodDisplay}</span>
                  </li>
                </ul>

                {/* agreement clause */}
                <p style={{ marginBottom: "24px" }}>
                  This <span style={{ textDecoration: "underline" }}>Rent Renewal Offer</span> and the attached{" "}
                  <span style={{ textDecoration: "underline" }}>Terms of Tenancy</span> (together the{" "}
                  <strong>“Tenancy Agreement”</strong>) shall govern the tenancy relationship between{" "}
                  <span style={{ textDecoration: "underline" }}>{customLandlordCompany}</span> (
                  <strong>“the Landlord”</strong>) and you,{" "}
                  <span style={{ textDecoration: "underline" }}>{tenantName}</span>{" "}
                  <strong>(“the Tenant”)</strong> for the{" "}
                  <span style={{ textDecoration: "underline" }}>Tenancy Period</span>.
                </p>

                {/* sign-off */}
                <p style={{ marginBottom: "40px" }}>Yours faithfully,</p>

                <p style={{ fontWeight: "bold", marginBottom: "60px" }}>{customLandlordName}</p>

                {/* footnote (only when service charge present) */}
                {serviceCharge ? (
                  <div style={{ borderTop: "1px solid #999", paddingTop: "8px", fontSize: "11px", fontStyle: "italic", color: "#444", marginBottom: "40px" }}>
                    <p>
                      <sup>1</sup> This covers the associated cost of maintaining general utilities and
                      services which include but are not limited to, the water treatment plant and supply
                      system, meter vending platform, security, cleaning of general areas, and waste management.
                    </p>
                  </div>
                ) : null}

                {/* footer */}
                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", marginTop: "40px" }}>
                  <p>{propertyAddress || "17 Ayinde Akinmade Street"}</p>
                  <p>Lekki Phase 1, Lagos State</p>
                  <p style={{ color: "#2563eb", textDecoration: "underline", fontWeight: "normal" }}>
                    www.propertykraft.africa
                  </p>
                </div>

                {/* ── Page break ────────────────────────────────────── */}
                <div style={{ borderTop: "1px dashed #d1d5db", margin: "60px -40px 40px" }} />

                {/* ── Page 2 ────────────────────────────────────────── */}

                <p style={{ fontStyle: "italic", fontWeight: "bold", marginBottom: "12px" }}>for Landlord</p>
                <p style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "28px" }}>
                  TERMS OF TENANCY
                </p>

                {/* 1. Permitted Use */}
                <p style={{ fontWeight: "bold", marginBottom: "10px" }}>1. Permitted Use</p>
                <p style={{ marginBottom: "24px", paddingLeft: "20px" }}>
                  The Property shall be used solely for residential purposes. Commercial use,
                  Airbnb/short-let, or subletting is strictly prohibited.
                </p>

                {/* 2. Conduct & Restrictions */}
                <p style={{ fontWeight: "bold", marginBottom: "10px" }}>2. Conduct &amp; Restrictions</p>
                <ul style={{ listStyle: "disc", paddingLeft: "48px", marginBottom: "24px" }}>
                  <li style={{ marginBottom: "8px" }}>
                    Pets must remain inside your apartment; pets in common areas are prohibited.
                  </li>
                  <li>
                    You are not to cause to be done or permit any act or operation within the premises
                    that is illegal or maybe considered a nuisance.
                  </li>
                </ul>

                {/* 3. Repairs & Maintenance */}
                <p style={{ fontWeight: "bold", marginBottom: "10px" }}>3. Repairs &amp; Maintenance</p>
                <ul style={{ listStyle: "disc", paddingLeft: "48px", marginBottom: "24px" }}>
                  <li style={{ marginBottom: "8px" }}>Tenant shall be responsible for internal repairs &amp; minor maintenance.</li>
                  <li style={{ marginBottom: "8px" }}>Landlord shall be responsible for structural repairs and major building systems.</li>
                  <li>Damage caused by Tenant negligence is Tenant’s responsibility.</li>
                </ul>

                {/* 4. Access */}
                <p style={{ fontWeight: "bold", marginBottom: "10px" }}>4. Access</p>
                <p style={{ marginBottom: "24px", paddingLeft: "20px" }}>
                  The Landlord may access the Property with reasonable notice for inspections,
                  repairs, or emergencies.
                </p>

                {/* 5. Service of Notices */}
                <p style={{ fontWeight: "bold", marginBottom: "10px" }}>5. Service of Notices</p>
                <ul style={{ listStyle: "disc", paddingLeft: "48px", marginBottom: "16px" }}>
                  <li style={{ marginBottom: "8px" }}>
                    Notices to the Tenant will be considered duly served if delivered by any of the
                    following methods:
                    <div style={{ paddingLeft: "28px", marginTop: "8px" }}>
                      <p>(1) Affixed to the door of the Property;</p>
                      <p>
                        (2) Sent via WhatsApp to{" "}
                        <strong>{tenantWhatsApp}</strong>;
                      </p>
                      <p>
                        (3) Sent via email to{" "}
                        <strong>{tenantEmail}</strong>.
                      </p>
                    </div>
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    The Tenant shall ensure that the WhatsApp number and email address provided in
                    this Agreement remain valid and reachable. If the Tenant changes, loses access
                    to, or is no longer reachable through either contact detail, the Tenant shall
                    promptly notify the Landlord or the Landlord’s representative in writing and
                    provide updated contact details.
                  </li>
                  <li>
                    Until such notice of change is received, any notice sent to the last provided
                    WhatsApp number or email address shall be deemed validly served.
                  </li>
                </ul>

                {/* 6. Breach & Termination */}
                <p style={{ fontWeight: "bold", marginTop: "24px", marginBottom: "10px" }}>6. Breach &amp; Termination</p>
                <p style={{ marginBottom: "24px", paddingLeft: "20px" }}>
                  Non-compliance with these terms may result in disconnection from general utilities
                  and services, termination, and/or eviction.
                </p>

                {/* 7. Refunds */}
                <p style={{ fontWeight: "bold", marginBottom: "10px" }}>7. Refunds</p>
                <ul style={{ listStyle: "disc", paddingLeft: "48px", marginBottom: "24px" }}>
                  <li style={{ marginBottom: "8px" }}>
                    If the tenancy is terminated before the expiry date, whether by the Tenant or by
                    the Landlord (in the case of breach by the Tenant), the Tenant shall only be
                    entitled to a refund of the rent and service charge for the unused days remaining
                    on the tenancy from the day the Property is fully vacated, and possesion returned
                    to the landlord.
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    Caution deposit and rent refund (if applicable) will be paid to the Tenant only
                    after the Tenant has fully vacated the Property and returned possession to the
                    landlord.
                  </li>
                  <li>
                    Deductions from the caution deposit may be made for damages beyond fair wear and
                    tear or outstanding obligations.
                  </li>
                </ul>

                {/* 8. Entire Agreement */}
                <p style={{ fontWeight: "bold", marginBottom: "10px" }}>8. Entire Agreement</p>
                <p style={{ marginBottom: "32px", paddingLeft: "20px" }}>
                  This Agreement constitutes the entire agreement between the parties in relation to
                  the Property and supersedes all prior discussions, representations or understandings,
                  whether oral or written.
                </p>

                {/* Acceptance of Terms */}
                <p style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "16px" }}>
                  ACCEPTANCE OF TERMS
                </p>
                <p style={{ marginBottom: "40px" }}>
                  I, <strong>{tenantName.toUpperCase()},</strong> accept the above terms and conditions
                  contained in this Tenancy Agreement dated {letterDate}.
                </p>

                {/* signature lines */}
                <div style={{ display: "flex", gap: "80px", marginBottom: "60px" }}>
                  <div>
                    <p style={{ letterSpacing: "2px" }}>………………………………….</p>
                    <p>Signature</p>
                  </div>
                  <div>
                    <p style={{ letterSpacing: "2px" }}>………………………..……………</p>
                    <p>Date</p>
                  </div>
                </div>

                {/* footer (page 2) */}
                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", marginTop: "40px" }}>
                  <p>{propertyAddress || "17 Ayinde Akinmade Street"}</p>
                  <p>Lekki Phase 1, Lagos State</p>
                  <p style={{ color: "#2563eb", textDecoration: "underline", fontWeight: "normal" }}>
                    www.propertykraft.africa
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
