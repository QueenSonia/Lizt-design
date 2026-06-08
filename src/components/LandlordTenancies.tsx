/* eslint-disable */
"use client";
import { useState, useMemo, useCallback } from "react";
import {
  Search, ChevronRight, X, Phone, MessageSquare, FileText,
  Download, Upload, RefreshCw, Edit, AlertCircle, CheckCircle,
  Clock, Calendar, DollarSign, Building, User, Send,
  ChevronLeft, MoreHorizontal, Paperclip, Receipt, Info, Plus, Trash2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "./ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import LandlordTopNav from "./LandlordTopNav";
import { toast } from "sonner";
import { EditTenancyModal, EditTenancyData } from "./EditTenancyModal";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Tenancy {
  id: string;
  tenantName: string;
  tenantPhone: string;
  propertyName: string;
  propertyAddress: string;
  tenancyType: "Residential" | "Commercial";
  startDate: string;
  endDate: string;
  rentAmount: number;
  rentFrequency: "year" | "month";
  outstandingBalance: number;
  status: "active" | "expiring_soon" | "ended" | "outstanding";
  tenantId: string;
  propertyId: string;
  paymentHistory: Payment[];
  documents: TenancyDocument[];
  whatsappHistory: WhatsAppMsg[];
  invoices: Invoice[];
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  type: "rent" | "fee" | "deposit";
  label: string;
  method: string;
}

interface TenancyDocument {
  id: string;
  name: string;
  type: "lease" | "receipt" | "other";
  date: string;
}

interface WhatsAppMsg {
  id: string;
  direction: "sent" | "received";
  body: string;
  timestamp: string;
}

interface Invoice {
  id: string;
  ref: string;
  date: string;
  amount: number;
  status: "paid" | "unpaid" | "overdue";
  description: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_TENANCIES: Tenancy[] = [
  {
    id: "tn-001",
    tenantName: "James Okafor",
    tenantPhone: "+234 803 214 5678",
    propertyName: "Lekki Phase 1 Duplex",
    propertyAddress: "14 Admiralty Way, Lekki Phase 1, Lagos",
    tenancyType: "Residential",
    startDate: "2025-01-01",
    endDate: "2026-12-31",
    rentAmount: 1800000,
    rentFrequency: "year",
    outstandingBalance: 120000,
    status: "outstanding",
    tenantId: "t-001",
    propertyId: "p-001",
    paymentHistory: [
      { id: "pay-001", date: "2025-01-05", amount: 1800000, type: "rent", label: "Annual Rent – Jan 2025", method: "Bank Transfer" },
      { id: "pay-002", date: "2025-01-05", amount: 90000, type: "deposit", label: "Security Deposit", method: "Bank Transfer" },
    ],
    documents: [
      { id: "doc-001", name: "Lease Agreement – 2025.pdf", type: "lease", date: "2025-01-01" },
      { id: "doc-002", name: "Payment Receipt – Jan 2025.pdf", type: "receipt", date: "2025-01-05" },
    ],
    whatsappHistory: [
      { id: "wa-001", direction: "sent", body: "Hi James, your rent payment of ₦1,800,000 has been confirmed. Thank you!", timestamp: "2025-01-05T10:30:00Z" },
      { id: "wa-002", direction: "received", body: "Thank you. Please confirm the outstanding balance.", timestamp: "2025-04-10T09:15:00Z" },
      { id: "wa-003", direction: "sent", body: "There is an outstanding balance of ₦120,000 for maintenance charges. Please settle at your earliest convenience.", timestamp: "2025-04-10T09:45:00Z" },
    ],
    invoices: [
      { id: "inv-001", ref: "INV-2025-001", date: "2025-01-01", amount: 1800000, status: "paid", description: "Annual Rent – Jan 2025 to Dec 2025" },
      { id: "inv-002", ref: "INV-2025-018", date: "2025-04-01", amount: 120000, status: "overdue", description: "Maintenance Charges Q1 2025" },
    ],
  },
  {
    id: "tn-002",
    tenantName: "Adaeze Nwosu",
    tenantPhone: "+234 806 332 9910",
    propertyName: "Ikoyi 2-Bed Apartment",
    propertyAddress: "3 Cameron Road, Ikoyi, Lagos",
    tenancyType: "Residential",
    startDate: "2025-03-15",
    endDate: "2026-03-14",
    rentAmount: 2400000,
    rentFrequency: "year",
    outstandingBalance: 0,
    status: "active",
    tenantId: "t-002",
    propertyId: "p-002",
    paymentHistory: [
      { id: "pay-003", date: "2025-03-15", amount: 2400000, type: "rent", label: "Annual Rent – Mar 2025", method: "Bank Transfer" },
    ],
    documents: [
      { id: "doc-003", name: "Lease Agreement – 2025.pdf", type: "lease", date: "2025-03-15" },
    ],
    whatsappHistory: [
      { id: "wa-004", direction: "sent", body: "Welcome, Adaeze! Your tenancy at Ikoyi 2-Bed Apartment begins today. Lease and receipts are attached.", timestamp: "2025-03-15T09:00:00Z" },
    ],
    invoices: [
      { id: "inv-003", ref: "INV-2025-007", date: "2025-03-15", amount: 2400000, status: "paid", description: "Annual Rent – Mar 2025 to Mar 2026" },
    ],
  },
  {
    id: "tn-003",
    tenantName: "Emmanuel Etim",
    tenantPhone: "+234 812 554 7723",
    propertyName: "Victoria Island Studio",
    propertyAddress: "22 Ozumba Mbadiwe Ave, Victoria Island, Lagos",
    tenancyType: "Residential",
    startDate: "2025-06-01",
    endDate: "2026-05-31",
    rentAmount: 950000,
    rentFrequency: "year",
    outstandingBalance: 0,
    status: "expiring_soon",
    tenantId: "t-003",
    propertyId: "p-003",
    paymentHistory: [
      { id: "pay-004", date: "2025-06-01", amount: 950000, type: "rent", label: "Annual Rent – Jun 2025", method: "Mobile Transfer" },
    ],
    documents: [
      { id: "doc-004", name: "Lease Agreement – 2025.pdf", type: "lease", date: "2025-06-01" },
      { id: "doc-005", name: "Payment Receipt – Jun 2025.pdf", type: "receipt", date: "2025-06-01" },
    ],
    whatsappHistory: [
      { id: "wa-005", direction: "sent", body: "Hi Emmanuel, a reminder that your tenancy at Victoria Island Studio expires on 31 May 2026. Please let us know if you'd like to renew.", timestamp: "2026-03-01T08:00:00Z" },
      { id: "wa-006", direction: "received", body: "I would like to renew. Can you send me the new terms?", timestamp: "2026-03-02T11:30:00Z" },
    ],
    invoices: [
      { id: "inv-004", ref: "INV-2025-012", date: "2025-06-01", amount: 950000, status: "paid", description: "Annual Rent – Jun 2025 to May 2026" },
    ],
  },
  {
    id: "tn-004",
    tenantName: "Chidi Okafor",
    tenantPhone: "+234 708 991 2244",
    propertyName: "Greenfield Towers – Unit 4B",
    propertyAddress: "9 Walter Carrington Crescent, Lagos Island",
    tenancyType: "Residential",
    startDate: "2023-08-01",
    endDate: "2025-07-31",
    rentAmount: 1200000,
    rentFrequency: "year",
    outstandingBalance: 0,
    status: "ended",
    tenantId: "t-004",
    propertyId: "p-004",
    paymentHistory: [
      { id: "pay-005", date: "2023-08-01", amount: 1200000, type: "rent", label: "Annual Rent – Aug 2023", method: "Bank Transfer" },
      { id: "pay-006", date: "2024-08-01", amount: 1200000, type: "rent", label: "Annual Rent – Aug 2024", method: "Bank Transfer" },
    ],
    documents: [
      { id: "doc-006", name: "Lease Agreement – 2023.pdf", type: "lease", date: "2023-08-01" },
      { id: "doc-007", name: "Tenancy End Notice.pdf", type: "other", date: "2025-07-01" },
    ],
    whatsappHistory: [
      { id: "wa-007", direction: "sent", body: "Hi Chidi, your tenancy ended on 31 July 2025. Thank you for your time at Greenfield Towers. We hope to have you back.", timestamp: "2025-08-01T09:00:00Z" },
    ],
    invoices: [
      { id: "inv-005", ref: "INV-2023-004", date: "2023-08-01", amount: 1200000, status: "paid", description: "Annual Rent – Aug 2023 to Jul 2024" },
      { id: "inv-006", ref: "INV-2024-009", date: "2024-08-01", amount: 1200000, status: "paid", description: "Annual Rent – Aug 2024 to Jul 2025" },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_CONFIG = {
  active: { label: "Active", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  expiring_soon: { label: "Expiring Soon", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  outstanding: { label: "Outstanding Balance", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  ended: { label: "Ended", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
};

// ── Billing overrides (in-memory, shared across list + detail) ────────────────
// Keyed by tenancy ID. Stores only the fields that have been edited.
interface BillingOverride {
  rentAmount: number;
  serviceCharge: number;
  paymentFrequency: string;
}
const _billingOverrides = new Map<string, BillingOverride>();
const _billingListeners = new Set<() => void>();

function getBillingOverride(tenancyId: string): BillingOverride | null {
  return _billingOverrides.get(tenancyId) ?? null;
}

function setBillingOverride(tenancyId: string, data: BillingOverride) {
  _billingOverrides.set(tenancyId, data);
  _billingListeners.forEach((l) => l());
}

function useBillingOverride(tenancyId: string) {
  const [, forceUpdate] = useState(0);
  useMemo(() => {
    const listener = () => forceUpdate((n) => n + 1);
    _billingListeners.add(listener);
    return () => _billingListeners.delete(listener);
  }, []);
  return getBillingOverride(tenancyId);
}

// ── Tenancy List ──────────────────────────────────────────────────────────────

function TenancyListScreen({
  onSelect,
  onMenuClick,
  isMobile,
}: {
  onSelect: (t: Tenancy) => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return MOCK_TENANCIES.filter((t) => {
      if (t.status === "ended") return false;
      const q = search.toLowerCase();
      return (
        !q ||
        t.tenantName.toLowerCase().includes(q) ||
        t.propertyName.toLowerCase().includes(q)
      );
    });
  }, [search]);

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">
      <LandlordTopNav
        title="Tenancies"
        onMenuClick={onMenuClick}
        isMobile={isMobile}
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant or property…"
            className="pl-10 bg-white"
          />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <p className="text-gray-500 text-sm">No active tenancies found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tenancy) => (
              <div
                key={tenancy.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(tenancy)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(tenancy); } }}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:bg-gray-50 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF5000] focus:ring-offset-1"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900 leading-snug">{tenancy.tenantName}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{tenancy.propertyName}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                </div>

                <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Rent</p>
                    <p className="text-gray-900 font-medium">{fmtCurrency(tenancy.rentAmount)}<span className="text-gray-400 font-normal">/{tenancy.rentFrequency}</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Outstanding</p>
                    <p className={tenancy.outstandingBalance > 0 ? "text-red-600 font-medium" : "text-gray-500"}>
                      {tenancy.outstandingBalance > 0 ? fmtCurrency(tenancy.outstandingBalance) : "None"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Ends</p>
                    <p className="text-gray-900">{fmtDate(tenancy.endDate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tenancy Detail ────────────────────────────────────────────────────────────

type DetailTab = "overview" | "billing" | "documents" | "whatsapp" | "history" | "actions";

function TenancyDetailScreen({
  tenancy,
  onBack,
  isMobile,
}: {
  tenancy: Tenancy;
  onBack: () => void;
  isMobile?: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [msgInput, setMsgInput] = useState("");
  const [editBillingOpen, setEditBillingOpen] = useState(false);
  const [showBillingBreakdown, setShowBillingBreakdown] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceStep, setInvoiceStep] = useState<"form" | "preview">("form");
  const [invoiceForm, setInvoiceForm] = useState<{
    items: { feeName: string; amount: string }[];
    dueDate: Date | null;
    frequency: "one_time" | "weekly" | "monthly" | "quarterly" | "annually";
  }>({ items: [{ feeName: "", amount: "" }], dueDate: null, frequency: "one_time" });
  const [invoiceItemErrors, setInvoiceItemErrors] = useState<{ feeName: string; amount: string }[]>([{ feeName: "", amount: "" }]);
  const [invoiceDueDateError, setInvoiceDueDateError] = useState("");

  const resetInvoiceModal = () => {
    setInvoiceStep("form");
    setInvoiceForm({ items: [{ feeName: "", amount: "" }], dueDate: null, frequency: "one_time" });
    setInvoiceItemErrors([{ feeName: "", amount: "" }]);
    setInvoiceDueDateError("");
  };

  const invoiceTotal = invoiceForm.items.reduce((sum, item) => {
    const n = parseFloat(item.amount.replace(/,/g, ""));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const validateInvoiceForm = () => {
    let valid = true;
    const errs = invoiceForm.items.map((item) => {
      const e = { feeName: "", amount: "" };
      if (!item.feeName.trim()) { e.feeName = "Fee name is required"; valid = false; }
      const n = parseFloat(item.amount.replace(/,/g, ""));
      if (!item.amount.trim() || isNaN(n) || n <= 0) { e.amount = "Enter a valid amount"; valid = false; }
      return e;
    });
    setInvoiceItemErrors(errs);
    if (!invoiceForm.dueDate) { setInvoiceDueDateError("Due date is required"); valid = false; }
    return valid;
  };

  const billingOverride = useBillingOverride(tenancy.id);
  const effectiveRent = billingOverride?.rentAmount ?? tenancy.rentAmount;
  const effectiveServiceCharge = billingOverride?.serviceCharge ?? 0;
  const effectivePaymentFrequency = billingOverride?.paymentFrequency ?? (tenancy.rentFrequency === "year" ? "Annually" : "Monthly");

  const handleSaveBilling = useCallback((data: EditTenancyData) => {
    setBillingOverride(tenancy.id, {
      rentAmount: data.rentAmount,
      serviceCharge: data.serviceCharge,
      paymentFrequency: data.paymentFrequency,
    });
    setEditBillingOpen(false);
    toast.success("Billing updated.");
  }, [tenancy.id]);

  const s = STATUS_CONFIG[tenancy.status];

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "billing", label: "Billing" },
    { id: "documents", label: "Documents" },
    { id: "whatsapp", label: "WhatsApp" },
    { id: "history", label: "History" },
    { id: "actions", label: "Actions" },
  ];

  const handleAction = (label: string) => {
    toast.success(`${label} — sent via WhatsApp.`);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">
      {/* Top nav */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">Tenancy Details</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 shrink-0 overflow-x-auto">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-[#FF5000] text-[#FF5000]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-5xl">
            {/* Tenant block */}
            <div className="flex items-start gap-5 mb-8 pb-8 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-[#FFF3EB] flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-[#FF5000]" />
              </div>
              <div className="flex-1">
                <button className="flex items-center gap-1 text-gray-900 font-semibold mb-1.5 underline decoration-[#FF5000] underline-offset-2 hover:decoration-2 transition-all cursor-pointer text-left">
                  <span>{tenancy.tenantName}</span>
                </button>
                <button className="flex items-center gap-1 text-gray-900 text-sm underline decoration-[#FF5000] underline-offset-2 hover:decoration-2 transition-all cursor-pointer text-left">
                  <span>{tenancy.propertyName}</span>
                </button>
              </div>
              {tenancy.outstandingBalance > 0 && (
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-400 mb-0.5">Outstanding Balance</p>
                  <p className="text-base font-bold text-red-500">{fmtCurrency(tenancy.outstandingBalance)}</p>
                </div>
              )}
            </div>

            {/* Tenancy info grid */}
            <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 gap-x-20 gap-y-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">Tenancy Type</p>
                <p className="text-sm text-gray-900 font-medium">{tenancy.rentFrequency === "year" ? "Annually" : "Monthly"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Tenancy Start Date</p>
                <p className="text-sm text-gray-900 font-medium">{fmtDate(tenancy.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Tenancy End Date</p>
                <p className="text-sm text-gray-900 font-medium">{fmtDate(tenancy.endDate)}</p>
              </div>
            </div>

            {/* Charges grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-20 gap-y-7 mb-10">
              <div>
                <p className="text-xs text-gray-400 mb-1">Rent</p>
                <p className="text-sm font-semibold text-gray-900 tabular-nums">{fmtCurrency(tenancy.rentAmount)}</p>
                <p className="text-xs text-gray-400 mt-1">{tenancy.rentFrequency === "year" ? "Annually" : "Monthly"} · Next due: {fmtDate(tenancy.endDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Service Charge</p>
                <p className="text-sm font-semibold text-gray-900 tabular-nums">₦50,000</p>
                <p className="text-xs text-gray-400 mt-1">Annually · Next due: {fmtDate(tenancy.endDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Legal Fee</p>
                <p className="text-sm font-semibold text-gray-900 tabular-nums">₦30,000</p>
                <p className="text-xs text-gray-400 mt-1">One-time · Due: {fmtDate(tenancy.endDate)}</p>
              </div>
            </div>

            {/* Billing + Payment Plans (merged) */}
            <div className="pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-baseline gap-1.5">
                  <p className="text-xl font-bold text-gray-900">Billing</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>·</span>
                    <button type="button" onClick={() => setEditBillingOpen(true)} className="font-medium text-[#FF5000] hover:underline transition-colors">Edit</button>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-[#FF5000] hover:bg-[#e04600] text-white shrink-0"
                  onClick={() => { resetInvoiceModal(); setShowInvoiceModal(true); }}
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" /> Generate Invoice
                </Button>
              </div>

              <p className="text-sm text-gray-900 mb-2">
                The tenant is expected to pay{" "}
                <span className="font-semibold">{fmtCurrency(effectiveRent + (effectiveServiceCharge ?? 0))}</span>
                {" "}
                <button
                  type="button"
                  onClick={() => setShowBillingBreakdown(v => !v)}
                  className="inline-flex items-center ml-0.5 text-gray-400 hover:text-gray-600 transition-colors align-middle"
                  aria-label="View billing breakdown"
                >
                  <Info className="w-4 h-4" />
                </button>
                {" "}by {fmtDate(tenancy.endDate)}.
              </p>

              {showBillingBreakdown && (
                <div className="mb-4 max-w-lg">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-2">
                    <div className="flex justify-between text-gray-700">
                      <span>Rent</span>
                      <span className="font-medium">{fmtCurrency(effectiveRent)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Service Charge</span>
                      <span className="font-medium">₦50,000</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Legal Fee</span>
                      <span className="font-medium">₦30,000</span>
                    </div>
                    {effectiveServiceCharge > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Additional Service Charge</span>
                        <span className="font-medium">{fmtCurrency(effectiveServiceCharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1.5">
                      <span>Total</span>
                      <span>{fmtCurrency(effectiveRent + (effectiveServiceCharge ?? 0))}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6" />

              {/* Payment Plans sub-link */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Payment Plans</p>
                <button
                  type="button"
                  onClick={() => {
                    const charges = [
                      { name: "Rent", amount: effectiveRent },
                      ...(effectiveServiceCharge > 0 ? [{ name: "Service Charge", amount: effectiveServiceCharge }] : []),
                      { name: "Legal Fee", amount: 30000 },
                    ];
                    const params = new URLSearchParams({
                      property: tenancy.propertyName,
                      tenant: tenancy.tenantId,
                      charges: JSON.stringify(charges),
                    });
                    router.push(`/landlord/payment-plans?${params.toString()}`);
                  }}
                  className="flex items-center gap-1 text-left group cursor-pointer"
                >
                  <span className="text-sm font-medium text-[#FF5000] underline-offset-2 group-hover:underline transition-all">View Payment Plans</span>
                  <svg className="w-3.5 h-3.5 text-[#FF5000] opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Billing ── */}
        {activeTab === "billing" && (
          <div className="space-y-5 max-w-xl">
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#FF5000] hover:bg-[#e04600] text-white" onClick={() => toast.success("Invoice generated.")}>
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Generate Invoice
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditBillingOpen(true)}>
                <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Billing
              </Button>
            </div>

            <Section title="Current Billing">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 py-1">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Rent Amount</p>
                  <p className="text-sm font-semibold text-gray-900">{fmtCurrency(effectiveRent)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Payment Frequency</p>
                  <p className="text-sm font-semibold text-gray-900">{effectivePaymentFrequency}</p>
                </div>
                {effectiveServiceCharge > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Service Charge</p>
                    <p className="text-sm font-semibold text-gray-900">{fmtCurrency(effectiveServiceCharge)}</p>
                  </div>
                )}
              </div>
            </Section>

            <Section title="Invoices">
              {tenancy.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.ref}</p>
                    <p className="text-xs text-gray-500">{inv.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(inv.date)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold text-gray-900">{fmtCurrency(inv.amount)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      inv.status === "paid" ? "bg-green-100 text-green-700" :
                      inv.status === "overdue" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </Section>

            <Section title="Payment Plans">
              <p className="text-sm text-gray-500 py-1">No active payment plans.</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => toast.success("Payment plan feature coming soon.")}>
                Add Payment Plan
              </Button>
            </Section>

            <Section title="Fees">
              <p className="text-sm text-gray-500 py-1">No additional fees added.</p>
            </Section>
          </div>
        )}

        {/* ── Documents ── */}
        {activeTab === "documents" && (
          <div className="space-y-5 max-w-xl">
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#FF5000] hover:bg-[#e04600] text-white" onClick={() => toast.success("Upload dialog would open here.")}>
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Document
              </Button>
            </div>

            {[
              { heading: "Lease Agreements", type: "lease" as const },
              { heading: "Receipts", type: "receipt" as const },
              { heading: "Other Documents", type: "other" as const },
            ].map(({ heading, type }) => {
              const docs = tenancy.documents.filter((d) => d.type === type);
              if (docs.length === 0) return null;
              return (
                <Section key={type} title={heading}>
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-sm text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-400">{fmtDate(doc.date)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toast.success(`Downloading ${doc.name}…`)}
                        className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </Section>
              );
            })}
          </div>
        )}

        {/* ── WhatsApp ── */}
        {activeTab === "whatsapp" && (
          <div className="space-y-4 max-w-xl">
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" className="bg-[#25D366] hover:bg-[#1ebe57] text-white" onClick={() => handleAction("Message sent")}>
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Send Message
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleAction("Invoice sent")}>
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Send Invoice
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleAction("Receipt sent")}>
                <Receipt className="w-3.5 h-3.5 mr-1.5" /> Send Receipt
              </Button>
            </div>

            <Section title="Message History">
              <div className="space-y-3 py-1">
                {tenancy.whatsappHistory.map((msg) => {
                  const isSent = msg.direction === "sent";
                  return (
                    <div key={msg.id} className={`flex flex-col gap-1 ${isSent ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isSent ? "bg-[#FF5000] text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"
                      }`}>
                        {msg.body}
                      </div>
                      <div className={`flex items-center gap-1.5 ${isSent ? "flex-row-reverse" : ""}`}>
                        <span className="text-[10px] text-gray-400 font-medium">{isSent ? "You" : tenancy.tenantName}</span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">{fmtTimestamp(msg.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Quick message input */}
            <div className="flex items-end gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus-within:border-gray-400 focus-within:bg-white transition-colors">
              <textarea
                rows={1}
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none"
                style={{ maxHeight: 100, overflowY: "auto", lineHeight: "1.5" }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!msgInput.trim()) return;
                  toast.success("Message sent via WhatsApp.");
                  setMsgInput("");
                }}
                disabled={!msgInput.trim()}
                className="shrink-0 w-8 h-8 rounded-lg bg-[#FF5000] disabled:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* ── History ── */}
        {activeTab === "history" && (
          <div className="space-y-5 max-w-xl">
            <Section title="Rent History">
              {tenancy.paymentHistory.filter((p) => p.type === "rent").map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm text-gray-900">{p.label}</p>
                    <p className="text-xs text-gray-400">{fmtDate(p.date)} · {p.method}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 shrink-0 ml-4">{fmtCurrency(p.amount)}</p>
                </div>
              ))}
            </Section>

            <Section title="Billing History">
              {tenancy.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm text-gray-900">{inv.ref}</p>
                    <p className="text-xs text-gray-500">{inv.description}</p>
                    <p className="text-xs text-gray-400">{fmtDate(inv.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 shrink-0 ml-4">{fmtCurrency(inv.amount)}</p>
                </div>
              ))}
            </Section>

            <Section title="Tenancy Updates">
              <div className="space-y-2 py-1">
                {[
                  { label: "Tenancy started", date: tenancy.startDate },
                  tenancy.status === "ended" ? { label: "Tenancy ended", date: tenancy.endDate } : null,
                ].filter(Boolean).map((ev: any) => (
                  <div key={ev.label} className="flex items-center gap-3 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                    <p className="text-sm text-gray-700">{ev.label}</p>
                    <p className="text-xs text-gray-400 ml-auto">{fmtDate(ev.date)}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── Actions ── */}
        {activeTab === "actions" && (
          <div className="space-y-3 max-w-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-4">Tenancy Actions</p>
            <ActionButton
              icon={<RefreshCw className="w-4 h-4" />}
              label="Renew Tenancy"
              description="Extend or create a new term for this tenancy."
              onClick={() => toast.success("Renewal flow — coming soon.")}
              variant="primary"
            />
            <ActionButton
              icon={<Edit className="w-4 h-4" />}
              label="Edit Tenancy"
              description="Update rent amount, dates, or tenant details."
              onClick={() => toast.success("Edit tenancy — coming soon.")}
            />
            <ActionButton
              icon={<AlertCircle className="w-4 h-4" />}
              label="End Tenancy"
              description="Mark this tenancy as ended and notify the tenant."
              onClick={() => toast.success("Tenancy ended.")}
              variant="danger"
            />
          </div>
        )}

      </div>

      {/* Generate Invoice Modal */}
      <Dialog
        open={showInvoiceModal}
        onOpenChange={(open) => { if (!open) { setShowInvoiceModal(false); resetInvoiceModal(); } }}
      >
        <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto">
          {invoiceStep === "form" ? (
            <>
              <DialogHeader>
                <DialogTitle>Generate Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                {/* Tenant (read-only) */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Tenant</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
                    {tenancy.tenantName}
                  </div>
                </div>
                {/* Invoice Items */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Invoice Items <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {invoiceForm.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder="Fee name (e.g. Diesel Fee)"
                            value={item.feeName}
                            onChange={(e) => {
                              const items = [...invoiceForm.items];
                              items[idx] = { ...items[idx], feeName: e.target.value };
                              setInvoiceForm((f) => ({ ...f, items }));
                              const errs = [...invoiceItemErrors];
                              errs[idx] = { ...errs[idx], feeName: "" };
                              setInvoiceItemErrors(errs);
                            }}
                            className={invoiceItemErrors[idx]?.feeName ? "border-red-500" : ""}
                          />
                          {invoiceItemErrors[idx]?.feeName && (
                            <p className="text-xs text-red-500">{invoiceItemErrors[idx].feeName}</p>
                          )}
                        </div>
                        <div className="w-36 space-y-1">
                          <Input
                            placeholder="Amount"
                            value={item.amount}
                            onChange={(e) => {
                              const items = [...invoiceForm.items];
                              items[idx] = { ...items[idx], amount: e.target.value };
                              setInvoiceForm((f) => ({ ...f, items }));
                              const errs = [...invoiceItemErrors];
                              errs[idx] = { ...errs[idx], amount: "" };
                              setInvoiceItemErrors(errs);
                            }}
                            className={invoiceItemErrors[idx]?.amount ? "border-red-500" : ""}
                          />
                          {invoiceItemErrors[idx]?.amount && (
                            <p className="text-xs text-red-500">{invoiceItemErrors[idx].amount}</p>
                          )}
                        </div>
                        {invoiceForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setInvoiceForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
                              setInvoiceItemErrors((e) => e.filter((_, i) => i !== idx));
                            }}
                            className="mt-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInvoiceForm((f) => ({ ...f, items: [...f.items, { feeName: "", amount: "" }] }));
                      setInvoiceItemErrors((e) => [...e, { feeName: "", amount: "" }]);
                    }}
                    className="mt-3 flex items-center gap-1.5 text-sm text-[#FF5000] hover:text-[#E64500] transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                  <div className="mt-4 flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-md border border-gray-200">
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <span className="text-sm font-semibold text-gray-900">₦{invoiceTotal.toLocaleString()}</span>
                  </div>
                </div>
                {/* Due Date */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Due Date <span className="text-red-500">*</span></label>
                  <DatePickerInput
                    value={invoiceForm.dueDate}
                    onChange={(date) => { setInvoiceForm((f) => ({ ...f, dueDate: date })); setInvoiceDueDateError(""); }}
                    placeholder="Select due date"
                    className={invoiceDueDateError ? "border-red-500" : ""}
                  />
                  {invoiceDueDateError && <p className="text-xs text-red-500 mt-1">{invoiceDueDateError}</p>}
                </div>
                {/* Frequency */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Frequency</label>
                  <Select value={invoiceForm.frequency} onValueChange={(v) => setInvoiceForm((f) => ({ ...f, frequency: v as typeof f.frequency }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One-time</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => { setShowInvoiceModal(false); resetInvoiceModal(); }}>Cancel</Button>
                <Button className="bg-[#FF5000] hover:bg-[#E64500] text-white" onClick={() => { if (validateInvoiceForm()) setInvoiceStep("preview"); }}>Continue</Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Invoice Preview</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-[#FF5000] px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-xs uppercase tracking-wide mb-1">Invoice</p>
                        <p className="text-white font-semibold text-lg">#{String(Date.now()).slice(-6)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-xs mb-0.5">Date Issued</p>
                        <p className="text-white text-sm">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Billed To</p>
                      <p className="text-sm font-semibold text-gray-900">{tenancy.tenantName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{tenancy.tenantPhone}</p>
                    </div>
                    <div className="sm:text-right">
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Due Date</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {invoiceForm.dueDate ? invoiceForm.dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Frequency</p>
                        <p className="text-sm text-gray-900 capitalize">{invoiceForm.frequency.replace("_", " ")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 text-xs text-gray-500 font-medium uppercase tracking-wide">Description</th>
                          <th className="text-right py-2 text-xs text-gray-500 font-medium uppercase tracking-wide">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceForm.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-50 last:border-0">
                            <td className="py-3 text-gray-900">{item.feeName}</td>
                            <td className="py-3 text-right text-gray-900">₦{(parseFloat(item.amount.replace(/,/g, "")) || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Total Due</span>
                    <span className="text-lg font-bold text-[#FF5000]">₦{invoiceTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setInvoiceStep("form")}>Back / Edit</Button>
                <Button
                  className="bg-[#FF5000] hover:bg-[#E64500] text-white"
                  onClick={() => {
                    setShowInvoiceModal(false);
                    resetInvoiceModal();
                    toast.success("Invoice generated successfully");
                  }}
                >
                  Confirm &amp; Generate Invoice
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <EditTenancyModal
        isOpen={editBillingOpen}
        onClose={() => setEditBillingOpen(false)}
        onConfirm={handleSaveBilling}
        mode="next-period"
        currentRentAmount={effectiveRent}
        currentServiceCharge={effectiveServiceCharge}
        currentPaymentFrequency={effectivePaymentFrequency}
        currentExpiryDate={tenancy.endDate}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function Row({ label, value, valueClass = "text-gray-900" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0 mt-0.5 min-w-[120px]">{label}</span>
      <span className={`text-sm text-right ${valueClass}`}>{value}</span>
    </div>
  );
}

function ActionButton({
  icon, label, description, onClick, variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  variant?: "primary" | "danger" | "default";
}) {
  const styles = {
    primary: "border-[#FF5000] bg-[#FFF3EB] hover:bg-[#FFE8D8] text-[#FF5000]",
    danger: "border-red-200 bg-red-50 hover:bg-red-100 text-red-600",
    default: "border-gray-200 bg-white hover:bg-gray-50 text-gray-700",
  };
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${styles[variant]}`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs mt-0.5 opacity-70">{description}</p>
      </div>
    </button>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

interface LandlordTenanciesProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordTenancies({ onMenuClick, isMobile }: LandlordTenanciesProps) {
  const [selected, setSelected] = useState<Tenancy | null>(null);

  if (selected) {
    return (
      <TenancyDetailScreen
        tenancy={selected}
        onBack={() => setSelected(null)}
        isMobile={isMobile}
      />
    );
  }

  return (
    <TenancyListScreen
      onSelect={setSelected}
      onMenuClick={onMenuClick}
      isMobile={isMobile}
    />
  );
}
