"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { ResidentInvoice, Resident } from "@/lib/residentMockData";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtCurrency(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

const STATUS_STYLE: Record<string, string> = {
  Paid: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Overdue: "bg-red-50 text-red-700",
};

interface Props {
  invoice: ResidentInvoice;
  resident: Resident;
  backTo: string;
  backLabel: string;
}

export default function ResidentInvoiceDetail({ invoice, resident, backTo, backLabel }: Props) {
  const router = useRouter();
  const invoiceNumber = `INV-${invoice.id.replace(/^inv-/, "").toUpperCase()}`;
  const billingPeriod = new Date(invoice.dateGenerated + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="page-container">
      {/* Flush back-nav bar — same pattern as maintenance detail */}
      <div className="bg-white shadow-sm mb-6 overflow-hidden -mt-4 -mx-4 sm:-mt-6 sm:-mx-6 lg:-mt-8 lg:-mx-8">
        <div className="px-6 sm:px-8 py-4">
          <button
            type="button"
            onClick={() => router.push(backTo)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {backLabel}
          </button>
        </div>
      </div>

      {/* Invoice document */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

          {/* ── Amount + status ── */}
          <div className="px-6 sm:px-8 pt-7 pb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">{fmtCurrency(invoice.amount)}</p>
              <p className="text-sm text-gray-500 mt-1">{invoice.category}</p>
            </div>
            <span
              className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 mt-1 ${STATUS_STYLE[invoice.status] ?? "bg-gray-100 text-gray-600"}`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="h-px bg-gray-100" />

          {/* ── Invoice meta ── */}
          <div className="px-6 sm:px-8 py-5">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-xs text-gray-400">Invoice No.</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{invoiceNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Issue Date</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{fmtDate(invoice.dateGenerated)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Due Date</dt>
                <dd className={`text-sm font-medium mt-0.5 ${invoice.status === "Overdue" ? "text-red-600" : "text-gray-900"}`}>
                  {fmtDate(invoice.dueDate)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="h-px bg-gray-100" />

          {/* ── Billed to ── */}
          <div className="px-6 sm:px-8 py-5">
            <p className="text-xs text-gray-400 mb-2">Billed to</p>
            <p className="text-sm font-medium text-gray-900">{resident.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{resident.building} · {resident.unit}</p>
          </div>

          <div className="h-px bg-gray-100" />

          {/* ── Line items ── */}
          <div className="px-6 sm:px-8 py-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Description</p>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Amount</p>
            </div>
            <div className="flex items-start justify-between pt-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{invoice.category}</p>
                <p className="text-xs text-gray-400 mt-0.5">{billingPeriod}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 tabular-nums">{fmtCurrency(invoice.amount)}</p>
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* ── Total ── */}
          <div className="px-6 sm:px-8 py-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Total</p>
            <p className="text-lg font-bold text-gray-900 tabular-nums">{fmtCurrency(invoice.amount)}</p>
          </div>

          <div className="h-px bg-gray-100" />

          {/* ── Download ── */}
          <div className="px-6 sm:px-8 py-5">
            <button
              onClick={() => toast.info("Download not yet connected to a backend.")}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Invoice
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
