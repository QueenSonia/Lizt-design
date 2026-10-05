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
  Upload,
} from "lucide-react";
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

type TabKey = "overview" | "whatsapp" | "history" | "docs";
type HistoryCategory = "all" | "invoices" | "maintenance" | "messages";
type DocFilter = "all" | "Invoice" | "Receipt" | "Other";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
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
  const seedRequests = MOCK_RESIDENT_REQUESTS[residentId] ?? [];
  const pendingRequests = seedRequests.filter((r) => r.status !== "Resolved");

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [invoices, setInvoices] = useState<ResidentInvoice[]>(
    MOCK_RESIDENT_INVOICES[residentId] ?? []
  );
  const [invOpen, setInvOpen] = useState(false);
  const [invForm, setInvForm] = useState({ category: "", amount: "", dueDate: "" });
  const [invErrors, setInvErrors] = useState({ category: "", amount: "", dueDate: "" });
  const [docFilter, setDocFilter] = useState<DocFilter>("all");
  const [historyFilter, setHistoryFilter] = useState<HistoryCategory>("all");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // ── Invoice modal helpers ──────────────────────────────────────────────────
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

  const pendingInvoices = useMemo(
    () => invoices.filter((i) => i.status !== "Paid"),
    [invoices]
  );
  const outstanding = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);

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

  const filteredDocs = useMemo(() => {
    if (docFilter === "all") return allDocs;
    return allDocs.filter((d) => d.type === docFilter);
  }, [allDocs, docFilter]);

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
      <div className="max-w-6xl">

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6 items-start">

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
                        className="flex items-start gap-2.5 px-3 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 transition-colors cursor-default"
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
                  onClick={() => setActiveTab("history")}
                  className="text-xs text-gray-400 hover:text-[#FF5000] transition-colors"
                >
                  View all
                </button>
              </div>
            </div>

            {/* Pending Payments */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-5">
                <h2 className="text-sm font-semibold text-gray-900">Pending Payments</h2>
                {outstanding > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">{fmtCurrency(outstanding)} outstanding</p>
                )}
              </div>
              <div className="h-px bg-gray-100" />

              {pendingInvoices.length === 0 ? (
                <div className="px-6 py-5">
                  <p className="text-sm text-gray-400">No pending payments.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pendingInvoices.map((inv) => (
                    <div key={inv.id} className="px-6 py-4 flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{inv.category}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Generated {fmtDate(inv.dateGenerated)}&ensp;&middot;&ensp;Due {fmtDate(inv.dueDate)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
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
                    </div>
                  ))}
                </div>
              )}

              <div className="px-6 py-3 border-t border-gray-100">
                <button
                  onClick={() => setActiveTab("docs")}
                  className="text-xs text-gray-400 hover:text-[#FF5000] transition-colors"
                >
                  View all
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ── WhatsApp ── */}
        {activeTab === "whatsapp" && (
          <div className="max-w-2xl">
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
              <div className="px-6 py-5 flex items-center gap-4 border-b border-gray-100">
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-gray-900">Documents</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {filteredDocs.length} file{filteredDocs.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {/* Pill filter buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["all", "Invoice", "Receipt", "Other"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDocFilter(f)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        docFilter === f
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f === "all"
                        ? "All"
                        : f === "Invoice"
                        ? "Invoices"
                        : f === "Receipt"
                        ? "Receipts"
                        : "Other"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => toast.info("Upload not yet connected to a backend.")}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
              </div>

              {/* Document rows */}
              {filteredDocs.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-gray-400">No documents match this filter.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredDocs.map((doc) => (
                    <div key={doc.id} className="px-6 py-4 flex items-center gap-3">
                      <span
                        className={`shrink-0 inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          doc.type === "Invoice"
                            ? "bg-blue-50 text-blue-700"
                            : doc.type === "Receipt"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {doc.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(doc.date)}</p>
                      </div>
                      <button
                        onClick={() => toast.info("Download not yet connected to a backend.")}
                        className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
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
