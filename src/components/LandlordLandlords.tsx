/* eslint-disable */
"use client";
import { useState, useMemo } from "react";
import {
  Search, ChevronLeft, ChevronRight, Building2, Users, ArrowUpDown,
  ArrowUp, ArrowDown, Plus, X, Phone, Mail, TrendingUp,
  Home, Activity, AlertCircle, CheckCircle, Clock,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type LandlordType = "individual" | "corporate";

interface MockLandlord {
  id: string;
  type: LandlordType;
  name: string;
  contactName?: string; // primary contact for corporate
  email: string;
  phone: string;
  properties: number;
  activeTenancies: number;
  outstandingBalance: number;
  occupancyRate: number;
  propertyList: MockProperty[];
  recentActivity: ActivityItem[];
}

interface MockProperty {
  id: string;
  name: string;
  address: string;
  type: string;
  tenancies: number;
  status: "occupied" | "vacant";
}

interface ActivityItem {
  id: string;
  type: "tenant_onboarded" | "payment_received" | "maintenance" | "renewal";
  description: string;
  date: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_LANDLORDS: MockLandlord[] = [
  {
    id: "ll-001",
    type: "individual",
    name: "Michael Adeyemi",
    email: "michael@email.com",
    phone: "+234 803 100 0001",
    properties: 3,
    activeTenancies: 5,
    outstandingBalance: 120000,
    occupancyRate: 83,
    propertyList: [
      { id: "p-001", name: "Lekki Phase 1 Duplex", address: "14 Admiralty Way, Lekki Phase 1, Lagos", type: "Duplex", tenancies: 2, status: "occupied" },
      { id: "p-002", name: "Ikoyi 2-Bed Apartment", address: "3 Cameron Road, Ikoyi, Lagos", type: "Apartment", tenancies: 2, status: "occupied" },
      { id: "p-003", name: "Victoria Island Studio", address: "22 Ozumba Mbadiwe Ave, VI, Lagos", type: "Studio", tenancies: 1, status: "occupied" },
    ],
    recentActivity: [
      { id: "a-001", type: "payment_received", description: "Rent payment received — Lekki Phase 1 Duplex", date: "2026-06-20" },
      { id: "a-002", type: "tenant_onboarded", description: "New tenant onboarded — Victoria Island Studio", date: "2026-06-15" },
      { id: "a-003", type: "maintenance", description: "Maintenance request submitted — Ikoyi 2-Bed Apartment", date: "2026-06-10" },
    ],
  },
  {
    id: "ll-002",
    type: "individual",
    name: "Sarah Johnson",
    email: "sarah@email.com",
    phone: "+234 803 100 0002",
    properties: 2,
    activeTenancies: 3,
    outstandingBalance: 0,
    occupancyRate: 100,
    propertyList: [
      { id: "p-004", name: "Banana Island Terrace", address: "5 Banana Island Road, Ikoyi, Lagos", type: "Terrace", tenancies: 2, status: "occupied" },
      { id: "p-005", name: "Lekki Conservation Bungalow", address: "7 Lekki Conservation Drive, Lagos", type: "Bungalow", tenancies: 1, status: "occupied" },
    ],
    recentActivity: [
      { id: "a-004", type: "renewal", description: "Tenancy renewed — Banana Island Terrace", date: "2026-06-18" },
      { id: "a-005", type: "payment_received", description: "Rent payment received — Lekki Conservation Bungalow", date: "2026-06-12" },
    ],
  },
  {
    id: "ll-003",
    type: "individual",
    name: "Funke Balogun",
    email: "funke@email.com",
    phone: "+234 803 100 0003",
    properties: 1,
    activeTenancies: 2,
    outstandingBalance: 45000,
    occupancyRate: 100,
    propertyList: [
      { id: "p-006", name: "Surulere Mini Flat", address: "12 Adeniran Ogunsanya St, Surulere, Lagos", type: "Mini Flat", tenancies: 2, status: "occupied" },
    ],
    recentActivity: [
      { id: "a-006", type: "maintenance", description: "Maintenance request submitted — Surulere Mini Flat", date: "2026-06-22" },
    ],
  },
  {
    id: "ll-004",
    type: "corporate",
    name: "Adeyemi Holdings Ltd",
    contactName: "Michael Adeyemi",
    email: "info@adeyemiholdings.com",
    phone: "+234 1 280 0001",
    properties: 12,
    activeTenancies: 18,
    outstandingBalance: 850000,
    occupancyRate: 75,
    propertyList: [
      { id: "p-007", name: "Greenfield Towers", address: "9 Walter Carrington Crescent, Lagos Island", type: "Apartment", tenancies: 6, status: "occupied" },
      { id: "p-008", name: "Marina Commercial Hub", address: "15 Marina St, Lagos Island", type: "Commercial", tenancies: 4, status: "occupied" },
      { id: "p-009", name: "Ajah Estate Block A", address: "1 Abraham Adesanya Estate, Ajah, Lagos", type: "Apartment", tenancies: 8, status: "occupied" },
    ],
    recentActivity: [
      { id: "a-007", type: "tenant_onboarded", description: "New tenant onboarded — Greenfield Towers Unit 3B", date: "2026-06-21" },
      { id: "a-008", type: "payment_received", description: "Rent payment received — Marina Commercial Hub", date: "2026-06-19" },
      { id: "a-009", type: "renewal", description: "Tenancy renewed — Ajah Estate Block A, Unit 4", date: "2026-06-14" },
      { id: "a-010", type: "maintenance", description: "Maintenance request submitted — Greenfield Towers lobby", date: "2026-06-08" },
    ],
  },
  {
    id: "ll-005",
    type: "corporate",
    name: "Prime Estates Limited",
    contactName: "Sarah Johnson",
    email: "contact@primeestates.ng",
    phone: "+234 1 280 0002",
    properties: 7,
    activeTenancies: 11,
    outstandingBalance: 200000,
    occupancyRate: 79,
    propertyList: [
      { id: "p-010", name: "Prime Towers VI", address: "22 Adeola Odeku St, Victoria Island, Lagos", type: "Commercial", tenancies: 5, status: "occupied" },
      { id: "p-011", name: "Prime Gardens Lekki", address: "10 Admiralty Way, Lekki Phase 1, Lagos", type: "Apartment", tenancies: 6, status: "occupied" },
    ],
    recentActivity: [
      { id: "a-011", type: "payment_received", description: "Rent payment received — Prime Towers VI", date: "2026-06-23" },
      { id: "a-012", type: "tenant_onboarded", description: "New tenant onboarded — Prime Gardens Lekki", date: "2026-06-17" },
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

const ACTIVITY_CONFIG: Record<ActivityItem["type"], { icon: React.ReactNode; color: string }> = {
  tenant_onboarded: { icon: <Users className="w-3.5 h-3.5" />, color: "text-blue-600 bg-blue-50" },
  payment_received: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-green-600 bg-green-50" },
  maintenance: { icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-amber-600 bg-amber-50" },
  renewal: { icon: <Clock className="w-3.5 h-3.5" />, color: "text-purple-600 bg-purple-50" },
};

// ── Add Landlord Modal ────────────────────────────────────────────────────────

interface AddLandlordModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: (landlord: MockLandlord) => void;
}

function AddLandlordModal({ open, onClose, onAdded }: AddLandlordModalProps) {
  const [step, setStep] = useState<"type" | "details">("type");
  const [landlordType, setLandlordType] = useState<LandlordType>("individual");
  const [form, setForm] = useState({ name: "", contactName: "", email: "", phone: "" });
  const [errors, setErrors] = useState({ name: "", email: "", phone: "" });

  const reset = () => {
    setStep("type");
    setLandlordType("individual");
    setForm({ name: "", contactName: "", email: "", phone: "" });
    setErrors({ name: "", email: "", phone: "" });
  };

  const handleClose = () => { reset(); onClose(); };

  const validate = () => {
    const e = { name: "", email: "", phone: "" };
    let ok = true;
    if (!form.name.trim()) { e.name = landlordType === "corporate" ? "Corporate name is required" : "Full name is required"; ok = false; }
    if (!form.email.trim()) { e.email = "Email is required"; ok = false; }
    if (!form.phone.trim()) { e.phone = "Phone number is required"; ok = false; }
    setErrors(e);
    return ok;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const newLandlord: MockLandlord = {
      id: `ll-${Date.now()}`,
      type: landlordType,
      name: form.name.trim(),
      contactName: landlordType === "corporate" ? form.contactName.trim() || undefined : undefined,
      email: form.email.trim(),
      phone: form.phone.trim(),
      properties: 0,
      activeTenancies: 0,
      outstandingBalance: 0,
      occupancyRate: 0,
      propertyList: [],
      recentActivity: [],
    };
    onAdded(newLandlord);
    toast.success(`${landlordType === "corporate" ? form.name : form.name} added successfully`);
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add Landlord</h2>
            {step === "details" && (
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{landlordType} landlord</p>
            )}
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step: Type */}
        {step === "type" && (
          <div className="px-6 py-8">
            <p className="text-sm text-slate-600 mb-6">What type of landlord would you like to add?</p>
            <div className="grid grid-cols-2 gap-3">
              {(["individual", "corporate"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLandlordType(t)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                    landlordType === t
                      ? "border-[#FF5000] bg-[#FFF3EB]"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    landlordType === t ? "bg-[#FF5000]/10" : "bg-gray-100"
                  }`}>
                    {t === "individual"
                      ? <Users className={`w-5 h-5 ${landlordType === t ? "text-[#FF5000]" : "text-gray-500"}`} />
                      : <Building2 className={`w-5 h-5 ${landlordType === t ? "text-[#FF5000]" : "text-gray-500"}`} />
                    }
                  </div>
                  <span className={`text-sm font-medium capitalize ${landlordType === t ? "text-[#FF5000]" : "text-gray-700"}`}>
                    {t}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <Button variant="ghost" onClick={handleClose} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 h-11">
                Cancel
              </Button>
              <Button
                onClick={() => setStep("details")}
                className="flex-1 bg-[#FF5000] hover:bg-[#E64800] text-white h-11"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="px-6 py-6 space-y-4">
            {/* Corporate: Primary Contact Name first */}
            {landlordType === "corporate" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Primary Contact Name</label>
                <Input
                  placeholder="e.g. Michael Adeyemi"
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  className="h-10"
                />
              </div>
            )}

            {/* Name field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                {landlordType === "corporate" ? "Corporate / Business Name" : "Full Name"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder={landlordType === "corporate" ? "e.g. Adeyemi Holdings Ltd" : "e.g. Michael Adeyemi"}
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: "" })); }}
                className={`h-10 ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email Address <span className="text-red-500">*</span></label>
              <Input
                type="email"
                placeholder={landlordType === "corporate" ? "info@company.com" : "landlord@email.com"}
                value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setErrors((er) => ({ ...er, email: "" })); }}
                className={`h-10 ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Phone Number <span className="text-red-500">*</span></label>
              <Input
                placeholder="+234 xxx xxx xxxx"
                value={form.phone}
                onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); setErrors((er) => ({ ...er, phone: "" })); }}
                className={`h-10 ${errors.phone ? "border-red-500" : ""}`}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep("type")}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 h-11"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-[#FF5000] hover:bg-[#E64800] text-white h-11"
              >
                Add Landlord
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Landlord List Screen ──────────────────────────────────────────────────────

type SortCol = "name" | "properties" | "tenancies" | null;
type SortDir = "asc" | "desc";

function LandlordListScreen({
  landlords,
  onSelect,
  onMenuClick,
  isMobile,
  onAdd,
}: {
  landlords: MockLandlord[];
  onSelect: (l: MockLandlord) => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
  onAdd: () => void;
}) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 ml-1 text-[#FF5000]" />
      : <ArrowDown className="w-3 h-3 ml-1 text-[#FF5000]" />;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = q
      ? landlords.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            (l.contactName && l.contactName.toLowerCase().includes(q))
        )
      : landlords;

    if (!sortCol) return base;
    return [...base].sort((a, b) => {
      let diff = 0;
      if (sortCol === "name") diff = a.name.localeCompare(b.name);
      if (sortCol === "properties") diff = a.properties - b.properties;
      if (sortCol === "tenancies") diff = a.activeTenancies - b.activeTenancies;
      return sortDir === "asc" ? diff : -diff;
    });
  }, [landlords, search, sortCol, sortDir]);

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">
      {/* Fixed header */}
      <div className="lg:fixed top-0 right-0 left-0 lg:left-72 z-20 bg-white shadow-sm">
        {/* Title row */}
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
            <h1 className="text-lg font-semibold text-slate-900">Landlords</h1>
          </div>
          <Button
            onClick={onAdd}
            className="bg-[#FF5000] hover:bg-[#E64800] text-white h-9 px-4 text-sm gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Landlord</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        <div className="border-t border-gray-200 mx-4 lg:mx-8" />

        {/* Search row */}
        <div className="px-4 lg:px-8 py-4">
          <div className="relative w-72 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by landlord name"
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
      <div className="flex-1 overflow-y-auto lg:pt-[109px]">
        <div className="px-4 sm:px-6 pt-8 pb-5">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 text-sm font-medium mb-1">No landlords found</p>
              <p className="text-gray-400 text-xs">Try adjusting your search or add a new landlord.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3">
                        <button
                          onClick={() => handleSort("name")}
                          className={`text-xs font-semibold uppercase tracking-wide transition-colors ${
                            sortCol === "name" ? "text-[#FF5000]" : "text-gray-500 hover:text-[#FF5000]"
                          }`}
                        >
                          Landlord
                        </button>
                      </th>
                      <th className="text-left px-4 py-3">
                        <button
                          onClick={() => handleSort("properties")}
                          className={`text-xs font-semibold uppercase tracking-wide transition-colors ${
                            sortCol === "properties" ? "text-[#FF5000]" : "text-gray-500 hover:text-[#FF5000]"
                          }`}
                        >
                          Properties
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 pr-6">
                        <button
                          onClick={() => handleSort("tenancies")}
                          className={`text-xs font-semibold uppercase tracking-wide transition-colors ${
                            sortCol === "tenancies" ? "text-[#FF5000]" : "text-gray-500 hover:text-[#FF5000]"
                          }`}
                        >
                          Active Tenancies
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((l) => (
                      <tr
                        key={l.id}
                        onClick={() => onSelect(l)}
                        className="bg-white hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 group-hover:text-[#FF5000] transition-colors">{l.name}</p>
                          {l.type === "corporate" && l.contactName && (
                            <p className="text-xs text-gray-400 mt-0.5">Contact: {l.contactName}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-900 tabular-nums font-medium">{l.properties}</td>
                        <td className="px-4 py-4 pr-6 text-gray-900 tabular-nums font-medium">{l.activeTenancies}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {filtered.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => onSelect(l)}
                    className="px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{l.name}</p>
                        {l.type === "corporate" && l.contactName && (
                          <p className="text-xs text-gray-400 mt-0.5">Contact: {l.contactName}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 text-xs">
                      <div>
                        <p className="text-gray-400 mb-0.5">Properties</p>
                        <p className="text-gray-900 font-medium">{l.properties}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5">Active Tenancies</p>
                        <p className="text-gray-900 font-medium">{l.activeTenancies}</p>
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

// ── Landlord Detail Screen ────────────────────────────────────────────────────

function LandlordDetailScreen({
  landlord,
  onBack,
}: {
  landlord: MockLandlord;
  onBack: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";

  const occupiedCount = landlord.propertyList.filter((p) => p.status === "occupied").length;

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
          <p className="text-sm font-semibold text-gray-900 truncate">{landlord.name}</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">

        {/* Landlord profile card */}
        <div className="bg-white rounded-xl shadow-sm px-5 py-5 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-base font-semibold text-gray-900">{landlord.name}</p>
            {landlord.type === "corporate" && landlord.contactName && (
              <p className="text-xs text-gray-400 mt-0.5">Contact: {landlord.contactName}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">{landlord.email}</p>
            <p className="text-sm text-gray-500 mt-1">{landlord.phone}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-gray-900">{landlord.properties} {landlord.properties === 1 ? "Property" : "Properties"}</p>
            <p className="text-sm text-gray-500 mt-1">{landlord.activeTenancies} Active {landlord.activeTenancies === 1 ? "Tenancy" : "Tenancies"}</p>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/60">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Portfolio Summary</p>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{landlord.properties}</p>
              <p className="text-xs text-gray-500 mt-1">Total Properties</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{landlord.activeTenancies}</p>
              <p className="text-xs text-gray-500 mt-1">Active Tenancies</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{landlord.occupancyRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Occupancy Rate</p>
            </div>
            <div className={`text-center p-3 rounded-lg ${landlord.outstandingBalance > 0 ? "bg-red-50" : "bg-green-50"}`}>
              <p className={`text-lg font-bold ${landlord.outstandingBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                {landlord.outstandingBalance > 0 ? fmtCurrency(landlord.outstandingBalance) : "₦0"}
              </p>
              <p className={`text-xs mt-1 ${landlord.outstandingBalance > 0 ? "text-red-400" : "text-green-500"}`}>
                Outstanding
              </p>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/60 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Properties</p>
            <span className="text-xs text-gray-400">{landlord.properties} total</span>
          </div>

          {landlord.propertyList.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Home className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No properties yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {landlord.propertyList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/${userRole}/property-detail/${p.id}`)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <Home className="w-4.5 h-4.5 text-[#FF5000]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-[#FF5000] transition-colors truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{p.address}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-gray-700">{p.tenancies} {p.tenancies === 1 ? "tenancy" : "tenancies"}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      p.status === "occupied" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {p.status === "occupied" ? "Occupied" : "Vacant"}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FF5000] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/60">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Activity</p>
          </div>

          {landlord.recentActivity.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="px-5 py-3 divide-y divide-gray-50">
              {landlord.recentActivity.map((item) => {
                const cfg = ACTIVITY_CONFIG[item.type];
                return (
                  <div key={item.id} className="flex items-start gap-3 py-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{item.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(item.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

interface LandlordLandlordsProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordLandlords({ onMenuClick, isMobile }: LandlordLandlordsProps) {
  const [landlords, setLandlords] = useState<MockLandlord[]>(MOCK_LANDLORDS);
  const [selected, setSelected] = useState<MockLandlord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAdd = (newLandlord: MockLandlord) => {
    setLandlords((prev) => [newLandlord, ...prev]);
  };

  if (selected) {
    return (
      <LandlordDetailScreen
        landlord={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <>
      <LandlordListScreen
        landlords={landlords}
        onSelect={setSelected}
        onMenuClick={onMenuClick}
        isMobile={isMobile}
        onAdd={() => setShowAddModal(true)}
      />
      <AddLandlordModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={handleAdd}
      />
    </>
  );
}
