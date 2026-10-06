"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Wrench,
  Plus,
  X,
  Download,
  Clock,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import {
  MOCK_RESIDENTS,
  MOCK_RESIDENT_REQUESTS,
  MOCK_RESIDENT_INVOICES,
  MOCK_RESIDENT_CHATS,
  MOCK_RESIDENT_OTHER_DOCS,
  Resident,
  ResidentInvoice,
} from "@/lib/residentMockData";
import { TenantChatHistory } from "./TenantChatHistory";
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

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtMonthYear(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

const INVOICE_STATUS_STYLE: Record<string, string> = {
  Paid: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Overdue: "bg-red-50 text-red-700",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type TabKey = "overview" | "maintenance" | "whatsapp" | "history" | "docs";
type HistoryCategory = "all" | "invoices" | "maintenance" | "messages";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "maintenance", label: "Maintenance" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "history", label: "History" },
  { key: "docs", label: "Docs" },
];

interface ResidentHistoryEvent {
  id: string;
  title: string;
  context?: string;
  date: Date;
  category: "invoices" | "maintenance" | "messages";
}

interface ResidentDoc {
  id: string;
  type: "Invoice" | "Receipt" | "Other";
  name: string;
  date: string;
}

// ── Content (only renders when resident is found) ─────────────────────────────

interface ContentProps {
  resident: Resident;
  residentId: string;
  onBack: () => void;
}

function ResidentDetailContent({ resident, residentId, onBack }: ContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";
  const seedRequests = MOCK_RESIDENT_REQUESTS[residentId] ?? [];
  const pendingRequests = seedRequests.filter((r) => r.status !== "Resolved");

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [invoices, setInvoices] = useState<ResidentInvoice[]>(
    MOCK_RESIDENT_INVOICES[residentId] ?? []
  );
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [invoiceStep, setInvoiceStep] = useState<"form" | "preview">("form");
  const [invoiceForm, setInvoiceForm] = useState<{
    items: { feeName: string; amount: string }[];
    dueDate: Date | undefined;
    frequency: "one_time" | "weekly" | "monthly" | "quarterly" | "annually";
  }>({ items: [{ feeName: "", amount: "" }], dueDate: undefined, frequency: "one_time" });
  const [invoiceItemErrors, setInvoiceItemErrors] = useState<{ feeName: string; amount: string }[]>([{ feeName: "", amount: "" }]);
  const [invoiceDueDateError, setInvoiceDueDateError] = useState("");
  const [historyFilter, setHistoryFilter] = useState<HistoryCategory>("all");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // ── Invoice modal helpers ──────────────────────────────────────────────────
  const resetInvoiceModal = () => {
    setInvoiceStep("form");
    setInvoiceForm({ items: [{ feeName: "", amount: "" }], dueDate: undefined, frequency: "one_time" });
    setInvoiceItemErrors([{ feeName: "", amount: "" }]);
    setInvoiceDueDateError("");
  };

  const openInvModal = () => {
    resetInvoiceModal();
    setShowGenerateInvoiceModal(true);
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
      if (!item.amount.trim()) { e.amount = "Amount is required"; valid = false; }
      else if (isNaN(n) || n <= 0) { e.amount = "Enter a valid amount"; valid = false; }
      return e;
    });
    setInvoiceItemErrors(errs);
    if (!invoiceForm.dueDate) { setInvoiceDueDateError("Due date is required"); valid = false; }
    else setInvoiceDueDateError("");
    return valid;
  };

  const pendingInvoices = useMemo(
    () => invoices.filter((i) => i.status !== "Paid"),
    [invoices]
  );
  const outstanding = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);

  const sortedPendingInvoices = useMemo(() => {
    return [...pendingInvoices].sort((a, b) => {
      if (a.status !== b.status) return a.status === "Overdue" ? -1 : 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [pendingInvoices]);

  const initials = resident.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ── History events ─────────────────────────────────────────────────────────
  const historyEvents = useMemo<ResidentHistoryEvent[]>(() => {
    const events: ResidentHistoryEvent[] = [];

    // From invoices
    invoices.forEach((inv) => {
      events.push({
        id: `hist-inv-gen-${inv.id}`,
        title: "Invoice generated",
        context: `${inv.category} · ${fmtCurrency(inv.amount)}`,
        date: new Date(`${inv.dateGenerated}T09:00:00`),
        category: "invoices",
      });
      if (inv.status === "Paid") {
        events.push({
          id: `hist-inv-paid-${inv.id}`,
          title: "Payment received",
          context: `${inv.category} · ${fmtCurrency(inv.amount)}`,
          date: new Date(`${inv.dueDate}T14:30:00`),
          category: "invoices",
        });
      }
    });

    // From maintenance requests
    seedRequests.forEach((r) => {
      events.push({
        id: `hist-req-raised-${r.id}`,
        title: "Maintenance request raised",
        context: r.title,
        date: new Date(`${r.date}T10:00:00`),
        category: "maintenance",
      });
      if (r.status === "Resolved") {
        const resolvedDate = new Date(`${r.date}T10:00:00`);
        resolvedDate.setDate(resolvedDate.getDate() + 3);
        events.push({
          id: `hist-req-resolved-${r.id}`,
          title: "Maintenance request resolved",
          context: r.title,
          date: resolvedDate,
          category: "maintenance",
        });
      }
    });

    // From chat messages (first 3 messages)
    const chats = MOCK_RESIDENT_CHATS[residentId] ?? [];
    chats.slice(0, 3).forEach((msg) => {
      const preview =
        msg.content.length > 55
          ? msg.content.slice(0, 55) + "…"
          : msg.content;
      events.push({
        id: `hist-msg-${msg.id}`,
        title: msg.direction === "INBOUND" ? "Message received" : "Message sent",
        context: preview,
        date: new Date(msg.created_at),
        category: "messages",
      });
    });

    // Sort newest-first
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [invoices, seedRequests, residentId]);

  const filteredHistoryEvents = useMemo(() => {
    if (historyFilter === "all") return historyEvents;
    return historyEvents.filter((e) => e.category === historyFilter);
  }, [historyEvents, historyFilter]);

  // Group by month label
  const historyGroups = useMemo(() => {
    const groups: { month: string; events: ResidentHistoryEvent[] }[] = [];
    const seen = new Map<string, ResidentHistoryEvent[]>();
    filteredHistoryEvents.forEach((e) => {
      const label = e.date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      if (!seen.has(label)) {
        seen.set(label, []);
        groups.push({ month: label, events: seen.get(label)! });
      }
      seen.get(label)!.push(e);
    });
    return groups;
  }, [filteredHistoryEvents]);

  // ── Docs ───────────────────────────────────────────────────────────────────
  const allDocs = useMemo<ResidentDoc[]>(() => {
    const docs: ResidentDoc[] = [];

    invoices.forEach((inv) => {
      docs.push({
        id: `doc-inv-${inv.id}`,
        type: "Invoice",
        name: `${inv.category} Invoice, ${fmtMonthYear(inv.dateGenerated)}`,
        date: inv.dateGenerated,
      });
      if (inv.status === "Paid") {
        docs.push({
          id: `doc-rec-${inv.id}`,
          type: "Receipt",
          name: `${inv.category} Receipt, ${fmtMonthYear(inv.dueDate)}`,
          date: inv.dueDate,
        });
      }
    });

    const otherDocs = MOCK_RESIDENT_OTHER_DOCS[residentId] ?? [];
    otherDocs.forEach((od) => {
      docs.push({
        id: `doc-other-${od.id}`,
        type: "Other",
        name: od.name,
        date: od.date,
      });
    });

    // Sort newest-first by date
    return docs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [invoices, residentId]);


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
          <div className="min-w-0 flex-1">
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
          <button
            onClick={openInvModal}
            className="sm:hidden shrink-0 w-9 h-9 rounded-lg bg-[#FF5000] hover:bg-[#e04600] text-white flex items-center justify-center transition-colors"
            aria-label="Generate Invoice"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tab nav */}
        <div className="border-t border-gray-100 flex items-center">
          <div className="px-6 sm:px-8 flex-1 flex gap-6 sm:gap-8 overflow-x-auto scrollbar-hide min-w-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-[#FF5000] text-[#FF5000]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center pr-8 shrink-0 pl-4">
            <button
              onClick={openInvModal}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold bg-[#FF5000] hover:bg-[#e04600] text-white rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate Invoice
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div>

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">

            {/* Pending Maintenance Requests */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Pending Maintenance Requests</h2>
                {pendingRequests.length > 0 && (
                  <span className="text-xs tabular-nums text-gray-400">{pendingRequests.length}</span>
                )}
              </div>
              <div className="h-px bg-gray-100" />
              <div className="px-6 py-5">
                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-gray-400">No pending maintenance requests.</p>
                ) : (
                  <ul className="space-y-2">
                    {pendingRequests.map((r) => (
                      <li
                        key={r.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/${userRole}/residents/${residentId}/maintenance/${r.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(`/${userRole}/residents/${residentId}/maintenance/${r.id}`);
                          }
                        }}
                        className="flex items-start gap-2.5 px-3 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF5000] focus:ring-offset-1"
                      >
                        <Wrench className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900 leading-snug">{r.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {fmtDateTime(r.raisedAt ?? `${r.date}T10:00:00`)}
                          </p>
                          {r.assignedTo && (
                            <p className="text-xs mt-1">
                              <span className="text-gray-400">Assigned to </span>
                              <span className="text-gray-600">{r.assignedTo}</span>
                            </p>
                          )}
                        </div>
                        {r.images && r.images.length > 0 && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setLightboxSrc(r.images![0]); }}
                            className="shrink-0 relative w-10 h-10 rounded-md overflow-hidden bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF5000]"
                            aria-label="View image"
                          >
                            <img
                              src={r.images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {r.images.length > 1 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white text-[10px] font-semibold leading-none">
                                  +{r.images.length - 1}
                                </span>
                              </div>
                            )}
                          </button>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="px-6 py-3 border-t border-gray-100">
                <button
                  onClick={() => setActiveTab("maintenance")}
                  className="text-xs text-gray-400 hover:text-[#FF5000] transition-colors"
                >
                  View all
                </button>
              </div>
            </div>

            {/* Pending Payments */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Card header — outstanding amount is the headline */}
              <div className="px-6 py-5 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-400 mb-2">Pending Payments</p>
                {outstanding > 0 ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">{fmtCurrency(outstanding)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Outstanding</p>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-gray-900">All paid up</p>
                )}
              </div>

              {sortedPendingInvoices.length === 0 ? (
                <div className="px-6 py-5">
                  <p className="text-sm text-gray-400">No pending payments.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sortedPendingInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/${userRole}/residents/${residentId}/invoices/${inv.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/${userRole}/residents/${residentId}/invoices/${inv.id}`);
                        }
                      }}
                      className="px-6 py-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-inset focus:ring-2 focus:ring-[#FF5000] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{inv.category}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Due {fmtDate(inv.dueDate)}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <p className="text-sm font-bold text-gray-900 tabular-nums">{fmtCurrency(inv.amount)}</p>
                        <span
                          className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            INVOICE_STATUS_STYLE[inv.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              <div className="px-6 py-3 border-t border-gray-100">
                <button
                  onClick={() => setActiveTab("docs")}
                  className="text-xs text-gray-500 hover:text-gray-800 hover:underline transition-colors"
                >
                  View all
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ── Maintenance Requests ── */}
        {activeTab === "maintenance" && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Maintenance Requests</h2>
              {seedRequests.length > 0 && (
                <span className="text-xs tabular-nums text-gray-400">{seedRequests.length}</span>
              )}
            </div>

            {seedRequests.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-gray-400">No maintenance requests.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {[...seedRequests]
                  .sort((a, b) => new Date(b.raisedAt ?? b.date).getTime() - new Date(a.raisedAt ?? a.date).getTime())
                  .map((r) => (
                    <li
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/${userRole}/residents/${residentId}/maintenance/${r.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/${userRole}/residents/${residentId}/maintenance/${r.id}`);
                        }
                      }}
                      className="px-6 py-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-inset focus:ring-2 focus:ring-[#FF5000] transition-colors"
                    >
                      <Wrench className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900 leading-snug">{r.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {r.location} · {fmtDate(r.date)}
                        </p>
                        {r.assignedTo && (
                          <p className="text-xs mt-1">
                            <span className="text-gray-400">Assigned to </span>
                            <span className="text-gray-600">{r.assignedTo}</span>
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          r.status === "Open"
                            ? "bg-yellow-50 text-yellow-700"
                            : r.status === "In Progress"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {r.status}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}

        {/* ── WhatsApp ── */}
        {activeTab === "whatsapp" && (
          <div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">WhatsApp</h2>
                <p className="text-xs text-gray-400 mt-0.5">{resident.phone}</p>
              </div>
              <div className="p-4">
                <TenantChatHistory logs={MOCK_RESIDENT_CHATS[residentId] ?? []} />
              </div>
            </div>
          </div>
        )}

        {/* ── History ── */}
        {activeTab === "history" && (
          <div className="max-w-3xl">
            {/* Filter row */}
            <div className="flex items-center gap-3 mb-4">
              <Select
                value={historyFilter}
                onValueChange={(v) => setHistoryFilter(v as HistoryCategory)}
              >
                <SelectTrigger className="w-48 h-8 text-sm">
                  <SelectValue placeholder="Filter activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity</SelectItem>
                  <SelectItem value="invoices">Invoices &amp; Payments</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="messages">Messages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timeline card */}
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              {historyGroups.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Clock className="w-8 h-8 text-gray-300" />
                  <p className="text-sm text-gray-400">No activity recorded yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {historyGroups.map((group) => (
                    <div key={group.month}>
                      {/* Month header */}
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {group.month}
                      </p>
                      <div className="border-t border-gray-200 mt-2" />

                      {/* Events */}
                      <div className="relative pl-8 mt-4">
                        {group.events.length > 1 && (
                          <div className="absolute left-[7px] top-[20px] bottom-[20px] w-[1px] bg-neutral-200" />
                        )}
                        {group.events.map((event) => (
                          <div key={event.id} className="relative pb-6 last:pb-0">
                            <div className="absolute left-[-24px] top-[16px] w-[6px] h-[6px] rounded-full bg-neutral-400" />
                            <div className="relative inline-flex items-start gap-1.5 max-w-xl text-left group cursor-default hover:bg-neutral-50 rounded-lg p-3 -m-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {event.title}
                                  {event.context && (
                                    <span className="text-gray-500 font-normal">
                                      {" "}— {event.context}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {event.date.toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Docs ── */}
        {activeTab === "docs" && (
          <div className="max-w-3xl">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Documents</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {allDocs.length} file{allDocs.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Document rows */}
              {allDocs.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-gray-400">No documents yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {allDocs.map((doc) => {
                    const isInvoice = doc.type === "Invoice";
                    const invoiceId = isInvoice ? doc.id.slice("doc-inv-".length) : null;
                    return (
                      <div
                        key={doc.id}
                        role={invoiceId ? "button" : undefined}
                        tabIndex={invoiceId ? 0 : undefined}
                        onClick={
                          invoiceId
                            ? () => router.push(`/${userRole}/residents/${residentId}/invoices/${invoiceId}`)
                            : undefined
                        }
                        onKeyDown={
                          invoiceId
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  router.push(`/${userRole}/residents/${residentId}/invoices/${invoiceId}`);
                                }
                              }
                            : undefined
                        }
                        className={`px-6 py-4 flex items-center gap-3 ${invoiceId ? "cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-inset focus:ring-2 focus:ring-[#FF5000]" : ""} transition-colors`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(doc.date)}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            if (invoiceId) e.stopPropagation();
                            toast.info("Download not yet connected to a backend.");
                          }}
                          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Image Lightbox ── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxSrc}
              alt=""
              className="max-w-[90vw] max-h-[80vh] rounded-lg object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxSrc(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-500 hover:text-gray-900 transition-colors"
              aria-label="Close image preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Generate Invoice Modal ── */}
      <Dialog
        open={showGenerateInvoiceModal}
        onOpenChange={(open) => { if (!open) { setShowGenerateInvoiceModal(false); resetInvoiceModal(); } }}
      >
        <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto">
          {invoiceStep === "form" ? (
            <>
              <DialogHeader>
                <DialogTitle>Generate Invoice</DialogTitle>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Resident (read-only) */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Resident</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
                    {resident.name || "—"}
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
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>

                  {/* Total */}
                  <div className="mt-4 flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-md border border-gray-200">
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₦{invoiceTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <DatePickerInput
                    value={invoiceForm.dueDate}
                    onChange={(date) => {
                      setInvoiceForm((f) => ({ ...f, dueDate: date }));
                      setInvoiceDueDateError("");
                    }}
                    placeholder="Select due date"
                    className={invoiceDueDateError ? "border-red-500" : ""}
                  />
                  {invoiceDueDateError && (
                    <p className="text-xs text-red-500 mt-1">{invoiceDueDateError}</p>
                  )}
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Frequency</label>
                  <Select
                    value={invoiceForm.frequency}
                    onValueChange={(v) => setInvoiceForm((f) => ({ ...f, frequency: v as typeof f.frequency }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                <Button
                  variant="outline"
                  onClick={() => { setShowGenerateInvoiceModal(false); resetInvoiceModal(); }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#FF5000] hover:bg-[#E64500] text-white"
                  onClick={() => { if (validateInvoiceForm()) setInvoiceStep("preview"); }}
                >
                  Continue
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Invoice Preview</DialogTitle>
              </DialogHeader>

              <div className="py-2">
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Invoice header */}
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

                  {/* Billed to / Due date row */}
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Billed To</p>
                      <p className="text-sm font-semibold text-gray-900">{resident.name}</p>
                      {resident.phone && <p className="text-xs text-gray-500 mt-0.5">{resident.phone}</p>}
                    </div>
                    <div className="sm:text-right">
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Due Date</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {invoiceForm.dueDate
                            ? invoiceForm.dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Frequency</p>
                        <p className="text-sm text-gray-900 capitalize">{invoiceForm.frequency.replace("_", " ")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Line items */}
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
                            <td className="py-3 text-right text-gray-900">
                              ₦{(parseFloat(item.amount.replace(/,/g, "")) || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total row */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Total Due</span>
                    <span className="text-lg font-bold text-[#FF5000]">₦{invoiceTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setInvoiceStep("form")}
                >
                  Back / Edit
                </Button>
                <Button
                  className="bg-[#FF5000] hover:bg-[#E64500] text-white"
                  onClick={() => {
                    setShowGenerateInvoiceModal(false);
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
