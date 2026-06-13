/* eslint-disable */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, FileText, X, Download, Plus, Trash2, Edit2, Bell, Send } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ReceiptViewModal, ReceiptData } from "./ReceiptViewModal";
import { toast } from "sonner";

type InvoiceStatus = "upcoming" | "paid" | "overdue";

interface InvoiceLine {
  name: string;
  amount: number;
}

interface Invoice {
  id: string;
  dueDate: string;
  description: string;
  status: InvoiceStatus;
  total: number | null;
  lines: InvoiceLine[];
  periodEnd: string;
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-001", dueDate: "2026-05-17", description: "Rent Invoice", status: "upcoming", total: null,
    lines: [{ name: "Rent", amount: 1800000 }, { name: "Service Charge", amount: 250000 }],
    periodEnd: "May 17, 2026",
  },
  {
    id: "inv-002", dueDate: "2026-04-17", description: "Rent Invoice", status: "paid", total: 1800000,
    lines: [{ name: "Rent", amount: 1800000 }],
    periodEnd: "Apr 17, 2026",
  },
  {
    id: "inv-003", dueDate: "2026-03-17", description: "Service Charge", status: "paid", total: 250000,
    lines: [{ name: "Service Charge", amount: 250000 }],
    periodEnd: "Mar 17, 2026",
  },
  {
    id: "inv-004", dueDate: "2026-02-17", description: "Diesel Fee", status: "paid", total: 20000,
    lines: [{ name: "Diesel Fee", amount: 20000 }],
    periodEnd: "Feb 17, 2026",
  },
  {
    id: "inv-005", dueDate: "2026-01-17", description: "Maintenance Fee", status: "paid", total: 10000,
    lines: [{ name: "Maintenance Fee", amount: 10000 }],
    periodEnd: "Jan 17, 2026",
  },
  {
    id: "inv-006", dueDate: "2025-12-17", description: "Rent Invoice", status: "paid", total: 1800000,
    lines: [{ name: "Rent", amount: 1800000 }],
    periodEnd: "Dec 17, 2025",
  },
  {
    id: "inv-007", dueDate: "2025-11-17", description: "Service Charge", status: "paid", total: 250000,
    lines: [{ name: "Service Charge", amount: 250000 }],
    periodEnd: "Nov 17, 2025",
  },
  {
    id: "inv-008", dueDate: "2025-10-17", description: "Diesel Fee", status: "paid", total: 20000,
    lines: [{ name: "Diesel Fee", amount: 20000 }],
    periodEnd: "Oct 17, 2025",
  },
  {
    id: "inv-009", dueDate: "2025-09-17", description: "Rent Invoice", status: "paid", total: 1800000,
    lines: [{ name: "Rent", amount: 1800000 }, { name: "Service Charge", amount: 250000 }, { name: "Diesel Fee", amount: 20000 }],
    periodEnd: "Sep 17, 2025",
  },
  {
    id: "inv-010", dueDate: "2025-08-17", description: "Service Charge", status: "paid", total: 250000,
    lines: [{ name: "Service Charge", amount: 250000 }],
    periodEnd: "Aug 17, 2025",
  },
];

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  upcoming: "bg-amber-50 text-amber-600 border border-amber-200",
  paid:     "bg-green-50 text-green-700 border border-green-200",
  overdue:  "bg-red-50 text-red-600 border border-red-200",
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatCurrency(n: number) {
  return `₦${n.toLocaleString()}`;
}

// ── Invoice Preview Modal ─────────────────────────────────────────────────────

function InvoicePreviewModal({
  invoice,
  propertyName,
  tenantName,
  onClose,
}: {
  invoice: Invoice;
  propertyName: string;
  tenantName: string;
  onClose: () => void;
}) {
  const lineTotal = invoice.lines.reduce((s, l) => s + l.amount, 0);
  const displayTotal = invoice.total ?? lineTotal;
  const invoiceNumber = `INV-${invoice.id.replace("inv-", "").padStart(4, "0")}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Invoice Preview</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice document */}
        <div className="overflow-y-auto flex-1 px-8 py-8 space-y-8">
          {/* Invoice header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">Invoice</p>
              <p className="text-sm text-gray-400 mt-1">{invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Issue Date</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">From</p>
              <p className="text-sm font-medium text-gray-900">Landlord</p>
              <p className="text-sm text-gray-500 mt-0.5">{propertyName || "Property Management"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Billed To</p>
              <p className="text-sm font-medium text-gray-900">{tenantName || "Tenant"}</p>
              <p className="text-sm text-gray-500 mt-0.5">{propertyName}</p>
            </div>
          </div>

          {/* Due date */}
          <div className="flex items-center justify-between py-3 border-t border-b border-gray-100">
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
          </div>

          {/* Line items */}
          <div>
            <div className="grid grid-cols-[1fr_auto] gap-4 pb-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</p>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Amount</p>
            </div>
            <div className="divide-y divide-gray-100">
              {invoice.lines.map((line, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-4 py-3">
                  <p className="text-sm text-gray-700">{line.name}</p>
                  <p className="text-sm text-gray-900 text-right">{formatCurrency(line.amount)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
            <p className="text-base font-bold text-gray-900">Total Amount</p>
            <p className="text-base font-bold text-gray-900">{formatCurrency(displayTotal)}</p>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-400 text-center pb-2">
            This invoice covers charges for the period ending {invoice.periodEnd}.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Invoice Drawer ────────────────────────────────────────────────────────────

function InvoiceDrawer({
  invoice,
  propertyName,
  tenantName,
  onClose,
}: {
  invoice: Invoice;
  propertyName: string;
  tenantName: string;
  onClose: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const lineTotal = invoice.lines.reduce((s, l) => s + l.amount, 0);
  const displayTotal = invoice.total ?? lineTotal;

  const receiptData: ReceiptData = {
    receiptNumber: `RCPT-${invoice.id.replace("inv-", "").padStart(4, "0")}`,
    receiptDate: formatDate(invoice.dueDate),
    paymentReference: `REF-${invoice.id.toUpperCase()}`,
    tenantName,
    tenantEmail: "",
    propertyName,
    invoiceNumber: invoice.id.toUpperCase(),
    amountPaid: displayTotal,
    paymentMethod: "Bank Transfer",
    notes: "Thank you for your payment.",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{invoice.description}</p>
                  <Badge className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[invoice.status]}`}>
                    {invoice.status === "upcoming" ? "Upcoming" : invoice.status === "paid" ? "Paid" : "Overdue"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Invoice issued on {formatDate(invoice.dueDate)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Due Date + Status */}
          <div className="grid grid-cols-2 gap-4 px-6 py-5 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-1">Due date</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{invoice.status}</p>
            </div>
          </div>

          {/* Charges breakdown */}
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 mb-1">Charges Covered</p>
            <p className="text-xs text-gray-400 mb-4">
              This invoice covers charges for the period ending {invoice.periodEnd}.
            </p>
            <div className="space-y-3">
              {invoice.lines.map((line, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{line.name}</span>
                  <span className="text-sm text-gray-900">{formatCurrency(line.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Total Amount</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(displayTotal)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-5 space-y-2">
            <Button
              variant="outline"
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={() => setShowPreview(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Invoice
            </Button>
            {invoice.status === "paid" && (
              <Button
                variant="outline"
                className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowReceipt(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                View Receipt
              </Button>
            )}
            {invoice.status !== "paid" && (
              <Button className="w-full bg-[#FF5000] hover:bg-[#e04600] text-white">
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </div>

      {showPreview && (
        <InvoicePreviewModal
          invoice={invoice}
          propertyName={propertyName}
          tenantName={tenantName}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showReceipt && (
        <ReceiptViewModal
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          data={receiptData}
        />
      )}
    </>
  );
}

// ── Invoices Tab ──────────────────────────────────────────────────────────────

function InvoicesTab({ propertyName, tenantName }: { propertyName: string; tenantName: string }) {
  const [selected, setSelected] = useState<Invoice | null>(null);

  return (
    <div className="py-4">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full border-collapse" style={{ tableLayout: "auto" }}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-10 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[200px]">Due Date</th>
              <th className="text-left px-10 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[260px]">Description</th>
              <th className="text-left px-10 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[160px]">Status</th>
              <th className="text-left px-10 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[180px]">Invoice Total</th>
              <th className="w-10 pr-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_INVOICES.map(inv => (
              <tr
                key={inv.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelected(inv)}
              >
                <td className="px-10 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(inv.dueDate)}</td>
                <td className="px-10 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-900">{inv.description}</span>
                  </div>
                </td>
                <td className="px-10 py-4">
                  <Badge className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${STATUS_STYLES[inv.status]}`}>
                    {inv.status === "upcoming" ? "Upcoming" : inv.status === "paid" ? "Paid" : "Overdue"}
                  </Badge>
                </td>
                <td className="px-10 py-4 text-sm font-medium text-gray-900">
                  {inv.total !== null ? formatCurrency(inv.total) : "—"}
                </td>
                <td className="pr-4 text-right w-10">
                  <ChevronRight className="w-4 h-4 text-gray-400 inline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <InvoiceDrawer
          invoice={selected}
          propertyName={propertyName}
          tenantName={tenantName}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── Reminder rule types ───────────────────────────────────────────────────────

type OffsetDir = "before" | "after" | "on";

interface ReminderRule {
  id: string;
  days: number;
  dir: OffsetDir;
  time: string; // "HH:MM"
}

function offsetLabel(rule: ReminderRule): string {
  if (rule.dir === "on") return "On due date";
  return `${rule.days} day${rule.days !== 1 ? "s" : ""} ${rule.dir} due date`;
}

function scheduleDate(rule: ReminderRule, dueDateIso: string): Date {
  const d = new Date(dueDateIso + "T00:00:00");
  const [h, m] = rule.time.split(":").map(Number);
  if (rule.dir === "before") d.setDate(d.getDate() - rule.days);
  if (rule.dir === "after") d.setDate(d.getDate() + rule.days);
  d.setHours(h, m, 0, 0);
  return d;
}

function fmtScheduleDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " — " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// ── Rule editor row ───────────────────────────────────────────────────────────

function RuleRow({
  rule,
  onEdit,
  onDelete,
}: {
  rule: ReminderRule;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm text-gray-900 font-medium">{offsetLabel(rule)}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date("2000-01-01T" + rule.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onEdit} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Rule editor form ──────────────────────────────────────────────────────────

function RuleEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ReminderRule;
  onSave: (r: Omit<ReminderRule, "id">) => void;
  onCancel: () => void;
}) {
  const [days, setDays] = useState(String(initial?.dir === "on" ? 0 : (initial?.days ?? 7)));
  const [dir, setDir] = useState<OffsetDir>(initial?.dir ?? "before");
  const [time, setTime] = useState(initial?.time ?? "09:00");

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
      <div className="flex gap-2 items-end flex-wrap">
        {dir !== "on" && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Days</label>
            <input
              type="number"
              min={1}
              value={days}
              onChange={e => setDays(e.target.value)}
              className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF5000]"
            />
          </div>
        )}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">When</label>
          <select
            value={dir}
            onChange={e => setDir(e.target.value as OffsetDir)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF5000]"
          >
            <option value="before">days before due date</option>
            <option value="on">on due date</option>
            <option value="after">days after due date</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Time</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF5000]"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
        <button
          onClick={() => onSave({ days: dir === "on" ? 0 : Math.max(1, parseInt(days) || 1), dir, time })}
          className="px-3 py-1.5 text-xs font-medium text-white bg-[#FF5000] rounded-lg hover:bg-[#e04600] transition-colors"
        >
          Save Rule
        </button>
      </div>
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ propertyName, tenantName }: { propertyName: string; tenantName: string }) {
  const RENT_DUE = "2026-12-31";

  const [remindersOn, setRemindersOn] = useState(true);
  const [rules, setRules] = useState<ReminderRule[]>([
    { id: "r1", days: 30, dir: "before", time: "09:00" },
    { id: "r2", days: 7, dir: "before", time: "09:00" },
    { id: "r3", days: 0, dir: "on", time: "09:00" },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [previewRuleId, setPreviewRuleId] = useState<string>("r2");

  const previewRule = rules.find(r => r.id === previewRuleId) ?? rules[0];

  const previewText = previewRule
    ? previewRule.dir === "on"
      ? `Hi ${tenantName || "there"}, your rent for ${propertyName || "your property"} is due today. Please ensure payment is made. Thank you.`
      : previewRule.dir === "before"
      ? `Hi ${tenantName || "there"}, this is a reminder that your rent for ${propertyName || "your property"} is due in ${previewRule.days} day${previewRule.days !== 1 ? "s" : ""}. Please ensure payment is made on time. Thank you.`
      : `Hi ${tenantName || "there"}, your rent for ${propertyName || "your property"} was due ${previewRule.days} day${previewRule.days !== 1 ? "s" : ""} ago. Please make payment as soon as possible.`
    : "";

  const upcomingReminders = rules
    .map(r => ({ rule: r, date: scheduleDate(r, RENT_DUE) }))
    .filter(({ date }) => date > new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  function addRule(data: Omit<ReminderRule, "id">) {
    setRules(prev => [...prev, { ...data, id: `r-${Date.now()}` }]);
    setAddingNew(false);
  }

  function updateRule(id: string, data: Omit<ReminderRule, "id">) {
    setRules(prev => prev.map(r => r.id === id ? { ...data, id } : r));
    setEditingId(null);
  }

  function deleteRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id));
    if (previewRuleId === id) setPreviewRuleId(rules[0]?.id ?? "");
  }

  return (
    <div className="space-y-6 py-6 max-w-2xl">

      <p className="text-xs text-gray-400 -mt-2 mb-2">Applies to rent payments only</p>

      {/* Header card — toggle + send now */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Toggle */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <p className="text-sm text-gray-700 font-medium">Automatic Rent Reminders</p>
            <p className="text-xs text-gray-400 mt-0.5">Send scheduled reminders to tenant automatically</p>
          </div>
          <button
            type="button"
            onClick={() => setRemindersOn(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${remindersOn ? "bg-[#FF5000]" : "bg-gray-200"}`}
            aria-label="Toggle automatic reminders"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${remindersOn ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {/* Send Reminder Now */}
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-700 font-medium">Send Reminder Now</p>
              <p className="text-xs text-gray-400 mt-0.5">Send a one-time WhatsApp reminder immediately</p>
            </div>
            <button
              type="button"
              onClick={() => toast.success(`Rent reminder sent to ${tenantName || "tenant"} via WhatsApp.`)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Send Now
            </button>
          </div>
        </div>
      </div>

      {/* Reminder Rules */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Reminder Schedule</p>
            <p className="text-xs text-gray-400 mt-0.5">Custom rules for when reminders are sent</p>
          </div>
          {!addingNew && (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="flex items-center gap-1 text-xs font-medium text-[#FF5000] hover:underline transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          )}
        </div>

        <div className="px-5 py-2">
          {rules.length === 0 && !addingNew && (
            <p className="text-sm text-gray-400 py-4 text-center">No reminder rules. Add one above.</p>
          )}
          {rules.map(rule => (
            editingId === rule.id ? (
              <div key={rule.id} className="py-3 border-b border-gray-100 last:border-0">
                <RuleEditor
                  initial={rule}
                  onSave={data => updateRule(rule.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <RuleRow
                key={rule.id}
                rule={rule}
                onEdit={() => { setEditingId(rule.id); setAddingNew(false); }}
                onDelete={() => deleteRule(rule.id)}
              />
            )
          ))}
          {addingNew && (
            <div className="py-3">
              <RuleEditor
                onSave={addRule}
                onCancel={() => setAddingNew(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Message Preview */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Message Preview</p>
          {rules.length > 0 && (
            <select
              value={previewRuleId}
              onChange={e => setPreviewRuleId(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#FF5000] text-gray-600"
            >
              {rules.map(r => <option key={r.id} value={r.id}>{offsetLabel(r)}</option>)}
            </select>
          )}
        </div>
        <div className="px-5 py-4">
          <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
            <p className="text-sm text-gray-800 leading-relaxed">{previewText}</p>
            <p className="text-xs text-gray-400 text-right mt-1">via WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Upcoming Reminders */}
      {remindersOn && upcomingReminders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Upcoming Reminders</p>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingReminders.map(({ rule, date }) => {
              const msg = rule.dir === "on"
                ? `Hi ${tenantName || "there"}, your rent for ${propertyName || "your property"} is due today.`
                : rule.dir === "before"
                ? `Hi ${tenantName || "there"}, this is a reminder that your rent for ${propertyName || "your property"} is due in ${rule.days} day${rule.days !== 1 ? "s" : ""}.`
                : `Hi ${tenantName || "there"}, your rent for ${propertyName || "your property"} was due ${rule.days} day${rule.days !== 1 ? "s" : ""} ago. Please settle as soon as possible.`;
              return (
                <div key={rule.id} className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">{fmtScheduleDate(date)}</p>
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-sm inline-block">
                    <p className="text-sm text-gray-800 leading-relaxed">{msg}</p>
                    <p className="text-xs text-gray-400 text-right mt-1">via WhatsApp</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reminder Activity */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        <div className="px-5 py-3.5 flex items-center justify-between">
          <p className="text-sm text-gray-600">Last Reminder Sent</p>
          <p className="text-sm font-medium text-gray-900">May 10, 2026 — 9:00 AM</p>
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between">
          <p className="text-sm text-gray-600">Next Scheduled Reminder</p>
          <p className="text-sm font-medium text-gray-900">
            {remindersOn && upcomingReminders.length > 0
              ? fmtScheduleDate(upcomingReminders[0].date)
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyName = searchParams.get("property") || "";
  const tenantName = searchParams.get("tenant") || "";
  const defaultTab = (searchParams.get("tab") as "reminders" | "invoices") || "invoices";
  const [activeTab, setActiveTab] = useState<"reminders" | "invoices">(defaultTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 -ml-1 rounded"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Billing</h1>
            {propertyName && <p className="text-xs text-gray-400 leading-none mt-0.5">{propertyName}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl px-4 sm:px-6 py-4">
        <div className="flex gap-1 border-b border-gray-200 mb-2">
          {(["reminders", "invoices"] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "reminders" ? "Rent Reminder Settings" : "Invoices"}
            </button>
          ))}
        </div>

        {activeTab === "invoices" ? (
          <InvoicesTab propertyName={propertyName} tenantName={tenantName} />
        ) : (
          <OverviewTab propertyName={propertyName} tenantName={tenantName} />
        )}
      </div>
    </div>
  );
}
