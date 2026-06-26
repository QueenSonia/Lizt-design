/* eslint-disable */
"use client";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search, ChevronRight, X, Phone, MessageSquare, FileText,
  Download, Upload, RefreshCw, Edit, AlertCircle, CheckCircle,
  Clock, Calendar, DollarSign, Building, User, Send,
  ChevronLeft, MoreHorizontal, Paperclip, Receipt, Info, Plus, Trash2, SlidersHorizontal, Settings,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "./ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import LandlordTopNav from "./LandlordTopNav";
import { toast } from "sonner";
import { EditTenancyModal, EditTenancyData } from "./EditTenancyModal";
import { EndTenancyModal } from "./EndTenancyModal";
import { RenewTenancyScreen, type RenewTenancyData } from "./RenewTenancyScreen";
import { TenancyReminderSettings, InvoiceDrawer, MOCK_INVOICES, type Invoice } from "./InvoicesPage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { GlobalSearchDropdown } from "./GlobalSearch";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Tenancy {
  id: string;
  tenantName: string;
  tenantPhone: string;
  propertyName: string;
  propertyAddress: string;
  landlordName: string;
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
    landlordName: "Michael Adeyemi",
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
    landlordName: "Michael Adeyemi",
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
    landlordName: "Sarah Johnson",
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
    landlordName: "Adeyemi Holdings Ltd",
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

type SortColumn = "tenant" | "property" | "rent" | "outstanding" | "endDate" | "daysLeft" | null;
type SortDir = "asc" | "desc";
type OutstandingFilter = "has" | "none" | null;
type RentRangeFilter = "under1m" | "1m-2m" | "over2m" | null;
type ExpiryFilter = 30 | 60 | 90 | null;

interface TenancyFilters {
  outstanding: OutstandingFilter;
  rentRange: RentRangeFilter;
  expiry: ExpiryFilter;
}

const EMPTY_FILTERS: TenancyFilters = { outstanding: null, rentRange: null, expiry: null };

function activeFilterCount(f: TenancyFilters) {
  return [f.outstanding, f.rentRange, f.expiry].filter(Boolean).length;
}

function filterChips(f: TenancyFilters): { key: keyof TenancyFilters; label: string }[] {
  const chips: { key: keyof TenancyFilters; label: string }[] = [];
  if (f.outstanding === "has") chips.push({ key: "outstanding", label: "Has Outstanding Balance" });
  if (f.outstanding === "none") chips.push({ key: "outstanding", label: "No Outstanding Balance" });
  if (f.rentRange === "under1m") chips.push({ key: "rentRange", label: "Under ₦1,000,000" });
  if (f.rentRange === "1m-2m") chips.push({ key: "rentRange", label: "₦1m – ₦2m" });
  if (f.rentRange === "over2m") chips.push({ key: "rentRange", label: "Above ₦2,000,000" });
  if (f.expiry === 30) chips.push({ key: "expiry", label: "Expiring in 30 Days" });
  if (f.expiry === 60) chips.push({ key: "expiry", label: "Expiring in 60 Days" });
  if (f.expiry === 90) chips.push({ key: "expiry", label: "Expiring in 90 Days" });
  return chips;
}

function daysUntilExpiry(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

function DaysLeftCell({ endDate }: { endDate: string }) {
  const days = daysUntilExpiry(endDate);
  if (days <= 0) return <span className="text-red-500 font-medium">Expired</span>;
  if (days <= 7) return <span className="text-red-500">{days} Days</span>;
  if (days <= 30) return <span className="text-amber-500">{days} Days</span>;
  return <span className="text-gray-700">{days} Days</span>;
}


function TenancyListScreen({
  onSelect,
  onMenuClick,
  isMobile,
}: {
  onSelect: (t: Tenancy) => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";

  const [search, setSearch] = useState("");
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<TenancyFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<TenancyFilters>(EMPTY_FILTERS);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const [filterPos, setFilterPos] = useState({ top: 0, left: 0 });
  const [sortCol, setSortCol] = useState<SortColumn>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const openFilter = () => {
    if (filterBtnRef.current) {
      const rect = filterBtnRef.current.getBoundingClientRect();
      // Anchor dropdown below button, right-aligned to button's right edge
      setFilterPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 288) });
    }
    setDraftFilters(filters);
    setFilterOpen(true);
  };
  const applyFilters = () => { setFilters(draftFilters); setFilterOpen(false); };
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setFilterOpen(false); };
  const removeChip = (key: keyof TenancyFilters) => setFilters(prev => ({ ...prev, [key]: null }));
  const chips = filterChips(filters);

  const sorted = useMemo(() => {
    const base = MOCK_TENANCIES.filter((t) => {
      if (t.status === "ended") return false;
      const q = search.toLowerCase();
      if (q && !t.tenantName.toLowerCase().includes(q) && !t.propertyName.toLowerCase().includes(q)) return false;
      if (filters.outstanding === "has" && t.outstandingBalance <= 0) return false;
      if (filters.outstanding === "none" && t.outstandingBalance > 0) return false;
      if (filters.rentRange === "under1m" && t.rentAmount >= 1_000_000) return false;
      if (filters.rentRange === "1m-2m" && (t.rentAmount < 1_000_000 || t.rentAmount > 2_000_000)) return false;
      if (filters.rentRange === "over2m" && t.rentAmount <= 2_000_000) return false;
      if (filters.expiry) {
        const days = daysUntilExpiry(t.endDate);
        if (days < 0 || days > filters.expiry) return false;
      }
      return true;
    });
    if (!sortCol) return base;
    return [...base].sort((a, b) => {
      let diff = 0;
      if (sortCol === "tenant") diff = a.tenantName.localeCompare(b.tenantName);
      if (sortCol === "property") diff = a.propertyName.localeCompare(b.propertyName);
      if (sortCol === "rent") diff = a.rentAmount - b.rentAmount;
      if (sortCol === "outstanding") diff = a.outstandingBalance - b.outstandingBalance;
      if (sortCol === "endDate") diff = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      if (sortCol === "daysLeft") diff = daysUntilExpiry(a.endDate) - daysUntilExpiry(b.endDate);
      return sortDir === "asc" ? diff : -diff;
    });
  }, [search, filters, sortCol, sortDir]);

  function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          active ? "border-[#FF5000] bg-[#FFF3EB] text-[#FF5000]" : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">

      {/* Unified header — title + search + filter */}
      <div className="lg:fixed top-0 right-0 left-0 lg:left-72 z-20 bg-white shadow-sm">
        {/* Title row */}
        <div className="px-4 lg:px-8 py-4 flex items-center gap-3">
          {isMobile && onMenuClick && (
            <button onClick={onMenuClick} className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-slate-100">
              <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          )}
          <h1 className="text-lg font-semibold text-slate-900">Tenancies</h1>
        </div>

        <div className="border-t border-gray-200 mx-4 lg:mx-8" />

        {/* Search + filter row */}
        <div className="px-4 lg:px-8 py-4 flex items-center gap-2">
          <div ref={searchWrapperRef} className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowGlobalSearch(true)}
              onBlur={() => setTimeout(() => setShowGlobalSearch(false), 150)}
              placeholder="Search landlords, properties, tenants..."
              className="pl-10 h-9 bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-orange-200 text-sm"
            />
            {showGlobalSearch && search.length >= 2 && (
              <GlobalSearchDropdown
                query={search}
                anchorRef={searchWrapperRef}
                onClose={() => { setShowGlobalSearch(false); setSearch(""); }}
              />
            )}
          </div>
          <div className="relative">
            <button
              ref={filterBtnRef}
              type="button"
              onClick={openFilter}
              title="Filter tenancies"
              className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${
                activeFilterCount(filters) > 0
                  ? "border-[#FF5000] text-[#FF5000] bg-[#FFF3EB]"
                  : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-white"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount(filters) > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#FF5000] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount(filters)}
                </span>
              )}
            </button>

            {/* Filter dropdown — rendered via portal to escape overflow:hidden containers */}
            {filterOpen && typeof document !== "undefined" && createPortal(
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setFilterOpen(false)} />
                <div className="fixed z-[100] w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                  style={{ top: filterPos.top, left: filterPos.left }}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Filters</p>
                    <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="px-4 py-4 space-y-5">
                    {/* Outstanding Balance */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Outstanding Balance</p>
                      <div className="flex flex-wrap gap-2">
                        <FilterBtn label="Has Outstanding" active={draftFilters.outstanding === "has"} onClick={() => setDraftFilters(f => ({ ...f, outstanding: f.outstanding === "has" ? null : "has" }))} />
                        <FilterBtn label="No Outstanding" active={draftFilters.outstanding === "none"} onClick={() => setDraftFilters(f => ({ ...f, outstanding: f.outstanding === "none" ? null : "none" }))} />
                      </div>
                    </div>

                    {/* Rent Range */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rent Range</p>
                      <div className="flex flex-wrap gap-2">
                        <FilterBtn label="Under ₦1m" active={draftFilters.rentRange === "under1m"} onClick={() => setDraftFilters(f => ({ ...f, rentRange: f.rentRange === "under1m" ? null : "under1m" }))} />
                        <FilterBtn label="₦1m – ₦2m" active={draftFilters.rentRange === "1m-2m"} onClick={() => setDraftFilters(f => ({ ...f, rentRange: f.rentRange === "1m-2m" ? null : "1m-2m" }))} />
                        <FilterBtn label="Above ₦2m" active={draftFilters.rentRange === "over2m"} onClick={() => setDraftFilters(f => ({ ...f, rentRange: f.rentRange === "over2m" ? null : "over2m" }))} />
                      </div>
                    </div>

                    {/* Expiry */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tenancy End Date</p>
                      <div className="flex flex-wrap gap-2">
                        {([30, 60, 90] as const).map(d => (
                          <FilterBtn key={d} label={`Expiring in ${d}d`} active={draftFilters.expiry === d} onClick={() => setDraftFilters(f => ({ ...f, expiry: f.expiry === d ? null : d }))} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-gray-100 flex gap-2 justify-end">
                    <button onClick={() => setDraftFilters(EMPTY_FILTERS)} className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Reset</button>
                    <button onClick={applyFilters} className="px-3 py-1.5 text-xs font-medium text-white bg-[#FF5000] rounded-lg hover:bg-[#e04600] transition-colors">Apply</button>
                  </div>
                </div>
              </>,
              document.body
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {chips.length > 0 && (
          <div className="px-4 lg:px-8 pb-3 flex flex-wrap gap-2 items-center">
            {chips.map(({ key, label }) => (
              <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-700 font-medium">
                {label}
                <button onClick={() => removeChip(key)} className="text-gray-400 hover:text-gray-600 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button onClick={clearFilters} className="text-xs text-[#FF5000] hover:underline font-medium ml-1">
              Clear All
            </button>
          </div>
        )}
      </div>{/* end unified header */}

      <div className="flex-1 overflow-y-auto lg:pt-[134px]">
        <div className="px-4 sm:px-6 pt-6 pb-5">
        {sorted.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
            <p className="text-gray-700 text-sm font-medium mb-1">No tenancies found</p>
            <p className="text-gray-400 text-xs">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-6 py-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Landlord</span>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button onClick={() => handleSort("tenant")} className="flex items-center gap-0.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors">
                        Tenant                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button onClick={() => handleSort("property")} className="flex items-center gap-0.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors">
                        Property                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button onClick={() => handleSort("rent")} className="flex items-center gap-0.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors">
                        Rent                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button onClick={() => handleSort("outstanding")} className="flex items-center gap-0.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors">
                        Outstanding                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button onClick={() => handleSort("endDate")} className="flex items-center gap-0.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors">
                        End Date                      </button>
                    </th>
                    <th className="text-left px-4 py-3 pr-6">
                      <button onClick={() => handleSort("daysLeft")} className="flex items-center gap-0.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-[#FF5000] transition-colors">
                        Days Left
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => onSelect(t)}
                      className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-600 text-sm">{t.landlordName}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/${userRole}/kyc-application-detail/${t.tenantId}`); }}
                          className="font-medium text-gray-900 hover:text-[#FF5000] hover:underline transition-colors text-left"
                        >
                          {t.tenantName}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/${userRole}/property-detail/${t.propertyId}`); }}
                          className="text-gray-600 hover:text-[#FF5000] hover:underline transition-colors text-left"
                        >
                          {t.propertyName}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-gray-900 tabular-nums">{fmtCurrency(t.rentAmount)}</td>
                      <td className="px-4 py-4 tabular-nums">
                        {t.outstandingBalance > 0
                          ? <span className="text-red-600 font-medium">{fmtCurrency(t.outstandingBalance)}</span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-4 text-gray-900 whitespace-nowrap">
                        {fmtDate(t.endDate)}
                      </td>
                      <td className="px-4 py-4 pr-6 text-sm whitespace-nowrap">
                        <DaysLeftCell endDate={t.endDate} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="sm:hidden bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
              {sorted.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelect(t)}
                  className="px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{t.tenantName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.propertyName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.landlordName}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  </div>
                  <div className="grid grid-cols-3 gap-x-3 text-xs">
                    <div>
                      <p className="text-gray-400 mb-0.5">Rent</p>
                      <p className="text-gray-900 font-medium">{fmtCurrency(t.rentAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Outstanding</p>
                      <p className={t.outstandingBalance > 0 ? "text-red-600 font-medium" : "text-gray-400"}>
                        {t.outstandingBalance > 0 ? fmtCurrency(t.outstandingBalance) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Days Left</p>
                      <DaysLeftCell endDate={t.endDate} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}

// ── Tenancy Detail ────────────────────────────────────────────────────────────

type DetailTab = "overview";

function TenancyDetailScreen({
  tenancy,
  onBack,
  onOpenSettings,
  isMobile,
}: {
  tenancy: Tenancy;
  onBack: () => void;
  onOpenSettings: (t: Tenancy) => void;
  isMobile?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [msgInput, setMsgInput] = useState("");
  const [editBillingOpen, setEditBillingOpen] = useState(false);
  const [showBillingBreakdown, setShowBillingBreakdown] = useState(false);
  const [showEndTenancyModal, setShowEndTenancyModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const upcomingInvoice = MOCK_INVOICES.find(i => i.status === "upcoming") ?? MOCK_INVOICES[0];
  const [showRenewTenancyModal, setShowRenewTenancyModal] = useState(false);
  const [showEditTenancyModal, setShowEditTenancyModal] = useState(false);
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
                <button
                  onClick={() => router.push(`/${userRole}/kyc-application-detail/${tenancy.tenantId}`)}
                  className="flex items-center gap-1 text-gray-900 font-semibold mb-1.5 underline decoration-[#FF5000] underline-offset-2 hover:decoration-2 transition-all cursor-pointer text-left"
                >
                  <span>{tenancy.tenantName}</span>
                </button>
                <button
                  onClick={() => router.push(`/${userRole}/property-detail/${tenancy.propertyId}`)}
                  className="flex items-center gap-1 text-gray-900 text-sm underline decoration-[#FF5000] underline-offset-2 hover:decoration-2 transition-all cursor-pointer text-left"
                >
                  <span>{tenancy.propertyName}</span>
                </button>
                {tenancy.outstandingBalance > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400">Outstanding Balance</p>
                    <p className="text-base font-bold text-red-500">{fmtCurrency(tenancy.outstandingBalance)}</p>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-4 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Tenancy actions">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200 shadow-lg">
                    <DropdownMenuItem onClick={() => setShowRenewTenancyModal(true)} className="gap-2 cursor-pointer text-gray-700">
                      <RefreshCw className="w-4 h-4 text-gray-400" /> Renew Tenancy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowEditTenancyModal(true)} className="gap-2 cursor-pointer text-gray-700">
                      <Edit className="w-4 h-4 text-gray-400" /> Edit Tenancy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onOpenSettings(tenancy)} className="gap-2 cursor-pointer text-gray-700">
                      <Settings className="w-4 h-4 text-gray-400" /> Tenancy Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowEndTenancyModal(true)} className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                      <AlertCircle className="w-4 h-4" /> End Tenancy
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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

            {/* Next Invoice */}
            <div className="pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xl font-bold text-gray-900">Next Invoice</p>
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
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(upcomingInvoice)}
                  className="font-semibold text-gray-900 underline decoration-[#FF5000] underline-offset-2 hover:decoration-2 transition-all"
                >
                  {fmtCurrency(effectiveRent + (effectiveServiceCharge ?? 0))}
                </button>
                {" "}by {fmtDate(tenancy.endDate)}.
              </p>

              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams({
                    property: tenancy.propertyName,
                    tenant: tenancy.tenantName,
                    tab: "invoices",
                  });
                  router.push(`/landlord/invoices?${params.toString()}`);
                }}
                className="flex items-center gap-1 text-left group cursor-pointer mb-8"
              >
                <span className="text-sm font-medium text-[#FF5000] underline-offset-2 group-hover:underline transition-all">View All Invoices</span>
                <svg className="w-3.5 h-3.5 text-[#FF5000] opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Payment Plans */}
            <div className="pt-8 border-t border-gray-100">
              <p className="text-xl font-bold text-gray-900 mb-3">Payment Plans</p>
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
        )}


      </div>

      {/* Invoice Detail Drawer */}
      {selectedInvoice && (
        <InvoiceDrawer
          invoice={selectedInvoice}
          propertyName={tenancy.propertyName}
          tenantName={tenancy.tenantName}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* End Tenancy Modal */}
      <EndTenancyModal
        isOpen={showEndTenancyModal}
        onClose={() => setShowEndTenancyModal(false)}
        onConfirm={() => { setShowEndTenancyModal(false); toast.success("Tenancy ended."); }}
        tenantName={tenancy.tenantName}
        propertyName={tenancy.propertyName}
      />

      {/* Renew Tenancy Screen */}
      {showRenewTenancyModal && (
        <RenewTenancyScreen
          onClose={() => setShowRenewTenancyModal(false)}
          onConfirm={() => { setShowRenewTenancyModal(false); toast.success("Tenancy renewed successfully."); }}
          tenantName={tenancy.tenantName}
          propertyName={tenancy.propertyName}
          propertyAddress={tenancy.propertyAddress}
          landlordName="Olatunji Oginni"
          currentExpiryDate={tenancy.endDate}
          currentRentAmount={effectiveRent}
          currentPaymentFrequency={effectivePaymentFrequency}
          currentServiceCharge={effectiveServiceCharge}
        />
      )}

      {/* Edit Tenancy Modal (current period) */}
      <EditTenancyModal
        isOpen={showEditTenancyModal}
        onClose={() => setShowEditTenancyModal(false)}
        onConfirm={(data) => {
          setBillingOverride(tenancy.id, {
            rentAmount: data.rentAmount,
            serviceCharge: data.serviceCharge,
            paymentFrequency: data.paymentFrequency,
          });
          setShowEditTenancyModal(false);
          toast.success("Tenancy updated.");
        }}
        mode="current"
        currentRentAmount={effectiveRent}
        currentServiceCharge={effectiveServiceCharge}
        currentPaymentFrequency={effectivePaymentFrequency}
      />

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
  const [settingsTenancy, setSettingsTenancy] = useState<Tenancy | null>(null);

  if (settingsTenancy) {
    return (
      <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSettingsTenancy(null)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-gray-900">Tenancy Settings</p>
            <p className="text-xs text-gray-400 mt-0.5">{settingsTenancy.tenantName} · {settingsTenancy.propertyName}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-5">Rent Reminders</p>
            <TenancyReminderSettings
              propertyName={settingsTenancy.propertyName}
              tenantName={settingsTenancy.tenantName}
            />
          </div>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <TenancyDetailScreen
        tenancy={selected}
        onBack={() => setSelected(null)}
        onOpenSettings={(t) => setSettingsTenancy(t)}
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
