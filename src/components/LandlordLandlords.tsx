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
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
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
  tenancyList: MockTenancy[];
  tenantList: MockTenant[];
  recentActivity: ActivityItem[];
}

interface MockTenancy {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  tenantName: string | null;
  tenantId: string | null;
  tenantPhone: string | null;
  tenancyType: string | null;
  rentAmount: number | null;
  nextRentDue: string | null;
  outstandingBalance: number;
  isMarketingReady?: boolean;
}

interface MockTenant {
  id: string;
  kycId: string;
  name: string;
  propertyName: string | null;
  phone: string;
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
    tenancyList: [
      { id: "tn-001", propertyId: "p-001", propertyName: "Lekki Phase 1 Duplex", propertyAddress: "14 Admiralty Way, Lekki Phase 1, Lagos", tenantName: "James Okafor", tenantId: "t-001", tenantPhone: "+234 803 214 5678", tenancyType: "Annual", rentAmount: 1800000, nextRentDue: "2026-12-31", outstandingBalance: 120000 },
      { id: "tn-002", propertyId: "p-002", propertyName: "Ikoyi 2-Bed Apartment", propertyAddress: "3 Cameron Road, Ikoyi, Lagos", tenantName: "Adaeze Nwosu", tenantId: "t-002", tenantPhone: "+234 806 332 9910", tenancyType: "Annual", rentAmount: 2400000, nextRentDue: "2027-03-14", outstandingBalance: 0 },
      { id: "tn-003", propertyId: "p-003", propertyName: "Victoria Island Studio", propertyAddress: "22 Ozumba Mbadiwe Ave, VI, Lagos", tenantName: null, tenantId: null, tenantPhone: null, tenancyType: null, rentAmount: null, nextRentDue: null, outstandingBalance: 0, isMarketingReady: true },
    ],
    tenantList: [
      { id: "t-001", kycId: "kyc-001", name: "James Okafor", propertyName: "Lekki Phase 1 Duplex", phone: "+234 803 214 5678" },
      { id: "t-002", kycId: "kyc-002", name: "Adaeze Nwosu", propertyName: "Ikoyi 2-Bed Apartment", phone: "+234 806 332 9910" },
      { id: "t-013", kycId: "kyc-013", name: "Mary Johnson", propertyName: null, phone: "+234 802 123 4567" },
    ],
    recentActivity: [],
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
    tenancyList: [
      { id: "tn-004", propertyId: "p-004", propertyName: "Banana Island Terrace", propertyAddress: "5 Banana Island Road, Ikoyi, Lagos", tenantName: "Chidi Okafor", tenantId: "t-003", tenantPhone: "+234 708 991 2244", tenancyType: "Annual", rentAmount: 3200000, nextRentDue: "2027-01-15", outstandingBalance: 0 },
      { id: "tn-005", propertyId: "p-004", propertyName: "Banana Island Terrace", propertyAddress: "5 Banana Island Road, Ikoyi, Lagos", tenantName: "Amina Bello", tenantId: "t-004", tenantPhone: "+234 802 987 6543", tenancyType: "Bi-Annual", rentAmount: 1600000, nextRentDue: "2026-09-01", outstandingBalance: 0 },
      { id: "tn-006", propertyId: "p-005", propertyName: "Lekki Conservation Bungalow", propertyAddress: "7 Lekki Conservation Drive, Lagos", tenantName: "Emmanuel Etim", tenantId: "t-005", tenantPhone: "+234 812 554 7723", tenancyType: "Annual", rentAmount: 950000, nextRentDue: "2026-08-30", outstandingBalance: 0 },
    ],
    tenantList: [
      { id: "t-003", kycId: "kyc-003", name: "Chidi Okafor", propertyName: "Banana Island Terrace", phone: "+234 708 991 2244" },
      { id: "t-004", kycId: "kyc-004", name: "Amina Bello", propertyName: "Banana Island Terrace", phone: "+234 802 987 6543" },
      { id: "t-005", kycId: "kyc-005", name: "Emmanuel Etim", propertyName: "Lekki Conservation Bungalow", phone: "+234 812 554 7723" },
    ],
    recentActivity: [],
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
    tenancyList: [
      { id: "tn-007", propertyId: "p-006", propertyName: "Surulere Mini Flat", propertyAddress: "12 Adeniran Ogunsanya St, Surulere, Lagos", tenantName: "Ngozi Eze", tenantId: "t-006", tenantPhone: "+234 815 443 2211", tenancyType: "Quarterly", rentAmount: 300000, nextRentDue: "2026-10-01", outstandingBalance: 45000 },
      { id: "tn-008", propertyId: "p-006", propertyName: "Surulere Mini Flat", propertyAddress: "12 Adeniran Ogunsanya St, Surulere, Lagos", tenantName: "Tunde Adebayo", tenantId: "t-007", tenantPhone: "+234 803 567 8901", tenancyType: "Monthly", rentAmount: 120000, nextRentDue: "2026-11-15", outstandingBalance: 0 },
    ],
    tenantList: [
      { id: "t-006", kycId: "kyc-006", name: "Ngozi Eze", propertyName: "Surulere Mini Flat", phone: "+234 815 443 2211" },
      { id: "t-007", kycId: "kyc-007", name: "Tunde Adebayo", propertyName: "Surulere Mini Flat", phone: "+234 803 567 8901" },
    ],
    recentActivity: [],
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
    tenancyList: [
      { id: "tn-009", propertyId: "p-007", propertyName: "Greenfield Towers", propertyAddress: "9 Walter Carrington Crescent, Lagos Island", tenantName: "Bola Fashola", tenantId: "t-008", tenantPhone: "+234 803 111 2222", tenancyType: "Annual", rentAmount: 2800000, nextRentDue: "2027-02-01", outstandingBalance: 200000 },
      { id: "tn-010", propertyId: "p-008", propertyName: "Marina Commercial Hub", propertyAddress: "15 Marina St, Lagos Island", tenantName: "Kemi Adesanya", tenantId: "t-009", tenantPhone: "+234 706 334 5566", tenancyType: "Annual", rentAmount: 5500000, nextRentDue: "2026-12-01", outstandingBalance: 650000 },
      { id: "tn-011", propertyId: "p-009", propertyName: "Ajah Estate Block A", propertyAddress: "1 Abraham Adesanya Estate, Ajah, Lagos", tenantName: "Seun Williams", tenantId: "t-010", tenantPhone: "+234 812 778 9900", tenancyType: "Bi-Annual", rentAmount: 1200000, nextRentDue: "2026-10-15", outstandingBalance: 0 },
    ],
    tenantList: [
      { id: "t-008", kycId: "kyc-008", name: "Bola Fashola", propertyName: "Greenfield Towers", phone: "+234 803 111 2222" },
      { id: "t-009", kycId: "kyc-009", name: "Kemi Adesanya", propertyName: "Marina Commercial Hub", phone: "+234 706 334 5566" },
      { id: "t-010", kycId: "kyc-010", name: "Seun Williams", propertyName: "Ajah Estate Block A", phone: "+234 812 778 9900" },
    ],
    recentActivity: [],
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
    tenancyList: [
      { id: "tn-012", propertyId: "p-010", propertyName: "Prime Towers VI", propertyAddress: "22 Adeola Odeku St, Victoria Island, Lagos", tenantName: "Akin Martins", tenantId: "t-011", tenantPhone: "+234 905 221 3344", tenancyType: "Annual", rentAmount: 6000000, nextRentDue: "2027-01-01", outstandingBalance: 200000 },
      { id: "tn-013", propertyId: "p-011", propertyName: "Prime Gardens Lekki", propertyAddress: "10 Admiralty Way, Lekki Phase 1, Lagos", tenantName: "Ifeanyi Dike", tenantId: "t-012", tenantPhone: "+234 803 445 6677", tenancyType: "Annual", rentAmount: 1800000, nextRentDue: "2026-11-30", outstandingBalance: 0 },
      { id: "tn-014", propertyId: "p-011", propertyName: "Prime Gardens Lekki", propertyAddress: "10 Admiralty Way, Lekki Phase 1, Lagos", tenantName: null, tenantId: null, tenantPhone: null, tenancyType: null, rentAmount: null, nextRentDue: null, outstandingBalance: 0, isMarketingReady: false },
    ],
    tenantList: [
      { id: "t-011", kycId: "kyc-011", name: "Akin Martins", propertyName: "Prime Towers VI", phone: "+234 905 221 3344" },
      { id: "t-012", kycId: "kyc-012", name: "Ifeanyi Dike", propertyName: "Prime Gardens Lekki", phone: "+234 803 445 6677" },
    ],
    recentActivity: [],
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
      tenancyList: [],
      tenantList: [],
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

// ── Tenancy Card ─────────────────────────────────────────────────────────────

function TenancyCard({
  tenancy: t,
  userRole,
  router,
}: {
  tenancy: MockTenancy;
  userRole: string;
  router: ReturnType<typeof import("next/navigation").useRouter>;
}) {
  const [marketingReady, setMarketingReady] = useState(t.isMarketingReady ?? false);
  const isVacant = !t.tenantName;

  return (
    <div className="group">
      {/* Clickable top section */}
      <button
        onClick={() => router.push(`/${userRole}/property-detail/${t.propertyId}`)}
        className="w-full px-5 py-5 hover:bg-gray-50 transition-colors text-left group"
      >
        {/* Property header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 group-hover:text-[#FF5000] transition-colors truncate">{t.propertyName}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{t.propertyAddress}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FF5000] transition-colors shrink-0 mt-0.5" />
        </div>

        {/* Tenancy details — two-column grid or vacant */}
        {!isVacant ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Tenant</p>
              <p className="text-xs font-medium text-gray-800">{t.tenantName}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Rent</p>
              <p className="text-xs font-medium text-gray-800">{t.rentAmount !== null ? fmtCurrency(t.rentAmount) : "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Tenancy Type</p>
              <p className="text-xs font-medium text-gray-800">{t.tenancyType ?? "—"}</p>
            </div>
            {t.nextRentDue && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Next Rent Due</p>
                <p className="text-xs font-medium text-gray-800">{fmtDate(t.nextRentDue)}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No Active Tenancy</p>
        )}
      </button>

      {/* Ready for Marketing toggle — vacant properties only */}
      {isVacant && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="px-5 pb-4 pt-2 border-t border-gray-100"
        >
          <div className="flex items-center gap-2">
            <Switch
              id={`marketing-${t.id}`}
              checked={marketingReady}
              onCheckedChange={(checked) => {
                setMarketingReady(checked);
                toast.success(checked ? "Property marked as ready for marketing" : "Property removed from marketing");
              }}
              className="data-[state=checked]:bg-[#FF5000] cursor-pointer"
            />
            <Label
              htmlFor={`marketing-${t.id}`}
              className="text-sm text-gray-600 cursor-pointer"
            >
              Ready for Marketing
            </Label>
          </div>
        </div>
      )}
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
          <p className="text-sm font-semibold text-gray-900">Landlord Details</p>
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
            <p className="text-sm text-gray-500 mt-1">{landlord.tenantList.length} {landlord.tenantList.length === 1 ? "Tenant" : "Tenants"}</p>
          </div>
        </div>



        {/* Tenancies */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/60">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenancies</p>
          </div>

          {landlord.tenancyList.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Home className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No tenancies yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {landlord.tenancyList.map((t) => (
                <TenancyCard
                  key={t.id}
                  tenancy={t}
                  userRole={userRole}
                  router={router}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tenants */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/60">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenants</p>
          </div>

          {landlord.tenantList.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No tenants yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {landlord.tenantList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => router.push(`/${userRole}/kyc-application-detail/${t.kycId}`)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-[#FF5000] transition-colors">{t.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.propertyName ?? "No Property Assigned"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.phone}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FF5000] transition-colors shrink-0" />
                </button>
              ))}
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
