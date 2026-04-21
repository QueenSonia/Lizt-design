/* eslint-disable */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, FileText } from "lucide-react";
import { Badge } from "./ui/badge";

type InvoiceStatus = "upcoming" | "paid" | "overdue";

interface Invoice {
  id: string;
  dueDate: string;
  description: string;
  status: InvoiceStatus;
  total: number | null;
}

const MOCK_INVOICES: Invoice[] = [
  { id: "inv-001", dueDate: "2026-05-17", description: "Rent Invoice",      status: "upcoming", total: null },
  { id: "inv-002", dueDate: "2026-04-17", description: "Rent Invoice",      status: "paid",     total: 1800000 },
  { id: "inv-003", dueDate: "2026-03-17", description: "Service Charge",    status: "paid",     total: 250000 },
  { id: "inv-004", dueDate: "2026-02-17", description: "Diesel Fee",        status: "paid",     total: 20000 },
  { id: "inv-005", dueDate: "2026-01-17", description: "Maintenance Fee",   status: "paid",     total: 10000 },
  { id: "inv-006", dueDate: "2025-12-17", description: "Rent Invoice",      status: "paid",     total: 1800000 },
  { id: "inv-007", dueDate: "2025-11-17", description: "Service Charge",    status: "paid",     total: 250000 },
  { id: "inv-008", dueDate: "2025-10-17", description: "Diesel Fee",        status: "paid",     total: 20000 },
  { id: "inv-009", dueDate: "2025-09-17", description: "Rent Invoice",      status: "paid",     total: 1800000 },
  { id: "inv-010", dueDate: "2025-08-17", description: "Service Charge",    status: "paid",     total: 250000 },
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

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ propertyName, tenantName }: { propertyName: string; tenantName: string }) {
  const [remindersOn, setRemindersOn] = useState(true);
  const [frequency, setFrequency] = useState<"monthly" | "weekly">("monthly");

  const previewText = `Hi ${tenantName || "there"}, this is a reminder that your rent for ${propertyName || "your property"} is due soon. Please ensure payment is made on time. Thank you.`;

  return (
    <div className="space-y-6 py-6">
      {/* Rent Reminder Settings */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Rent Reminder Settings</p>
        </div>

        {/* Toggle */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <p className="text-sm text-gray-700 font-medium">Reminders</p>
            <p className="text-xs text-gray-400 mt-0.5">Send automatic rent reminders to tenant</p>
          </div>
          <button
            type="button"
            onClick={() => setRemindersOn(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${remindersOn ? "bg-[#FF5000]" : "bg-gray-200"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${remindersOn ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {/* Frequency */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <p className="text-sm text-gray-700 font-medium">Reminder Frequency</p>
            <p className="text-xs text-gray-400 mt-0.5">How often to send reminders</p>
          </div>
          <div className="flex gap-2">
            {(["monthly", "weekly"] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                  frequency === f
                    ? "border-[#FF5000] bg-[#FFF3EB] text-[#FF5000]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Message Preview */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-700 font-medium mb-2">Message Preview</p>
          <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
            <p className="text-sm text-gray-800 leading-relaxed">{previewText}</p>
            <p className="text-xs text-gray-400 text-right mt-1">via WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Scheduled Info */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        <div className="px-5 py-3.5 flex items-center justify-between">
          <p className="text-sm text-gray-600">Last reminder sent</p>
          <p className="text-sm font-medium text-gray-900">Apr 10, 2026</p>
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between">
          <p className="text-sm text-gray-600">Next scheduled reminder</p>
          <p className="text-sm font-medium text-gray-900">May 10, 2026</p>
        </div>
      </div>
    </div>
  );
}

// ── Invoices Tab ──────────────────────────────────────────────────────────────

function InvoicesTab() {
  return (
    <div className="py-4">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[180px]">Due Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[120px]">Status</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[160px]">Invoice Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_INVOICES.map(inv => (
              <tr
                key={inv.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {}}
              >
                <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(inv.dueDate)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-900">{inv.description}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${STATUS_STYLES[inv.status]}`}>
                    {inv.status === "upcoming" ? "Upcoming" : inv.status === "paid" ? "Paid" : "Overdue"}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {inv.total !== null ? formatCurrency(inv.total) : "—"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  const defaultTab = (searchParams.get("tab") as "overview" | "invoices") || "invoices";
  const [activeTab, setActiveTab] = useState<"overview" | "invoices">(defaultTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl px-4 sm:px-6 h-14 flex items-center gap-3">
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

      <div className="max-w-4xl px-4 sm:px-6 py-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-2">
          {(["overview", "invoices"] as const).map(tab => (
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
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "invoices" ? (
          <InvoicesTab />
        ) : (
          <OverviewTab propertyName={propertyName} tenantName={tenantName} />
        )}
      </div>
    </div>
  );
}
