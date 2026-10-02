"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Wrench,
  Plus,
  X,
  Download,
} from "lucide-react";
import {
  MOCK_RESIDENTS,
  MOCK_RESIDENT_REQUESTS,
  MOCK_RESIDENT_INVOICES,
  Resident,
  ResidentInvoice,
} from "@/lib/residentMockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtCurrency(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

const REQUEST_STATUS_STYLE: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};

const INVOICE_STATUS_STYLE: Record<string, string> = {
  Paid: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Overdue: "bg-red-50 text-red-700",
};

// ── Content (only renders when resident is found) ─────────────────────────────

interface ContentProps {
  resident: Resident;
  residentId: string;
  onBack: () => void;
}

function ResidentDetailContent({ resident, residentId, onBack }: ContentProps) {
  const seedRequests = MOCK_RESIDENT_REQUESTS[residentId] ?? [];
  const [invoices, setInvoices] = useState<ResidentInvoice[]>(
    MOCK_RESIDENT_INVOICES[residentId] ?? []
  );
  const [invOpen, setInvOpen] = useState(false);
  const [invForm, setInvForm] = useState({ category: "", amount: "", dueDate: "" });
  const [invErrors, setInvErrors] = useState({ category: "", amount: "", dueDate: "" });

  const openInvModal = () => {
    setInvForm({ category: "", amount: "", dueDate: "" });
    setInvErrors({ category: "", amount: "", dueDate: "" });
    setInvOpen(true);
  };

  const validateInv = () => {
    const e = { category: "", amount: "", dueDate: "" };
    let ok = true;
    if (!invForm.category) { e.category = "Select a category"; ok = false; }
    const parsed = parseFloat(invForm.amount.replace(/,/g, ""));
    if (!invForm.amount || isNaN(parsed) || parsed <= 0) { e.amount = "Enter a valid amount"; ok = false; }
    if (!invForm.dueDate) { e.dueDate = "Due date is required"; ok = false; }
    setInvErrors(e);
    return ok;
  };

  const handleGenerateInvoice = () => {
    if (!validateInv()) return;
    const newInvoice: ResidentInvoice = {
      id: `inv-new-${Date.now()}`,
      dateGenerated: new Date().toISOString().split("T")[0],
      dueDate: invForm.dueDate,
      category: invForm.category as "Diesel" | "Service Charge",
      amount: parseFloat(invForm.amount.replace(/,/g, "")),
      status: "Pending",
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    setInvOpen(false);
    toast.success("Invoice generated successfully.");
  };

  const outstanding = invoices
    .filter((i) => i.status !== "Paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const initials = resident.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="page-container">

      {/* ── Header ── */}
      <div className="bg-white shadow-sm mb-6 overflow-hidden -mt-4 -mx-4 sm:-mt-6 sm:-mx-6 lg:-mt-8 lg:-mx-8">
        <div className="px-6 sm:px-8 py-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Residents
          </button>
        </div>
        <div className="border-t border-gray-100" />
        <div className="px-6 sm:px-8 py-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <span className="text-[#FF5000] font-semibold text-sm">{initials}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 leading-snug">{resident.name}</h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1">
              <span className="text-sm text-slate-500">{resident.phone}</span>
              <span className="text-gray-300 hidden sm:inline">&middot;</span>
              <span className="text-sm text-slate-500">{resident.building}</span>
              <span className="text-gray-300 hidden sm:inline">&middot;</span>
              <span className="text-sm text-slate-500">{resident.unit}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Added {fmtDate(resident.dateAdded)}</p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6 items-start">

          {/* ── Maintenance Requests ── */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Maintenance Requests</h2>
              {seedRequests.length > 0 && (
                <span className="text-xs tabular-nums text-gray-400">{seedRequests.length}</span>
              )}
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-6 py-5">
              {seedRequests.length === 0 ? (
                <p className="text-sm text-gray-400">No maintenance requests logged.</p>
              ) : (
                <ul className="space-y-2">
                  {seedRequests.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-start gap-2.5 px-3 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 transition-colors cursor-default"
                    >
                      <Wrench className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900 leading-snug">{r.title}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-1.5">
                          <span className="text-xs text-gray-500">{r.location}</span>
                          <span className="text-gray-300">·</span>
                          <span
                            className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              REQUEST_STATUS_STYLE[r.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Invoices ── */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-5 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900">Invoices</h2>
                {outstanding > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">{fmtCurrency(outstanding)} outstanding</p>
                )}
              </div>
              <button
                onClick={openInvModal}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold bg-[#FF5000] hover:bg-[#e04600] text-white rounded-lg transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Generate Invoice
              </button>
            </div>
            <div className="h-px bg-gray-100" />

            {invoices.length === 0 ? (
              <div className="px-6 py-5">
                <p className="text-sm text-gray-400">No invoices generated yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <div key={inv.id} className="px-6 py-4 flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{inv.category}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Generated {fmtDate(inv.dateGenerated)}&ensp;&middot;&ensp;Due {fmtDate(inv.dueDate)}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 tabular-nums">
                          {fmtCurrency(inv.amount)}
                        </p>
                        <span
                          className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                            INVOICE_STATUS_STYLE[inv.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      {inv.status === "Paid" ? (
                        <button
                          onClick={() => toast.info("Download not yet connected to a backend.")}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Download invoice"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="w-7 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Generate Invoice Modal ── */}
      {invOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
          onClick={() => setInvOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-semibold text-gray-900">Generate Invoice</h2>
              <button
                onClick={() => setInvOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <Select
                  value={invForm.category}
                  onValueChange={(v) => {
                    setInvForm((f) => ({ ...f, category: v }));
                    setInvErrors((e) => ({ ...e, category: "" }));
                  }}
                >
                  <SelectTrigger className={`h-10 ${invErrors.category ? "border-red-400" : ""}`}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Service Charge">Service Charge</SelectItem>
                  </SelectContent>
                </Select>
                {invErrors.category && (
                  <p className="text-xs text-red-500">{invErrors.category}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                    ₦
                  </span>
                  <Input
                    value={invForm.amount}
                    onChange={(e) => {
                      setInvForm((f) => ({ ...f, amount: e.target.value }));
                      setInvErrors((err) => ({ ...err, amount: "" }));
                    }}
                    placeholder="0"
                    inputMode="numeric"
                    className={`pl-7 ${invErrors.amount ? "border-red-400 focus-visible:ring-red-200" : ""}`}
                  />
                </div>
                {invErrors.amount && (
                  <p className="text-xs text-red-500">{invErrors.amount}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={invForm.dueDate}
                  onChange={(e) => {
                    setInvForm((f) => ({ ...f, dueDate: e.target.value }));
                    setInvErrors((err) => ({ ...err, dueDate: "" }));
                  }}
                  className={invErrors.dueDate ? "border-red-400 focus-visible:ring-red-200" : ""}
                />
                {invErrors.dueDate && (
                  <p className="text-xs text-red-500">{invErrors.dueDate}</p>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button
                onClick={() => setInvOpen(false)}
                className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateInvoice}
                className="flex-1 h-10 rounded-lg bg-[#FF5000] hover:bg-[#e04600] text-white text-sm font-semibold transition-colors"
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Guard / Shell ─────────────────────────────────────────────────────────────

interface Props {
  residentId: string;
}

export default function LandlordResidentDetail({ residentId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";

  const resident = MOCK_RESIDENTS.find((r) => r.id === residentId);

  if (!resident) {
    return (
      <div className="page-container">
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center max-w-md mx-auto mt-12">
          <p className="text-sm font-medium text-gray-700 mb-1">Resident not found</p>
          <p className="text-xs text-gray-400 mb-5">No resident matched ID &ldquo;{residentId}&rdquo;.</p>
          <button
            onClick={() => router.push(`/${userRole}/residents`)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#FF5000] hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Residents
          </button>
        </div>
      </div>
    );
  }

  return (
    <ResidentDetailContent
      resident={resident}
      residentId={residentId}
      onBack={() => router.push(`/${userRole}/residents`)}
    />
  );
}
