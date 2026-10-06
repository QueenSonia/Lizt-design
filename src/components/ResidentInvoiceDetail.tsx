"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { InvoiceDocument, InvoiceData } from "@/components/InvoiceDocument";
import { ResidentInvoice, Resident, MOCK_BUILDINGS } from "@/lib/residentMockData";

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

  const building = MOCK_BUILDINGS.find((b) => b.name === resident.building);

  const invoiceData: InvoiceData = {
    invoiceNumber,
    invoiceDate: invoice.dateGenerated,
    status: invoice.status,
    tenantName: resident.name,
    tenantEmail: "",
    tenantPhone: resident.phone,
    propertyName: resident.building,
    propertyAddress: building?.address ?? "",
    lineItems: [{ description: `${invoice.category}, ${billingPeriod}`, amount: invoice.amount }],
    subtotal: invoice.amount,
    total: invoice.amount,
    amountPaid: invoice.status === "Paid" ? invoice.amount : 0,
    amountDue: invoice.status === "Paid" ? 0 : invoice.amount,
    paidDate: invoice.status === "Paid" ? invoice.dueDate : undefined,
  };

  return (
    <div className="page-container">
      {/* Flush back-nav bar — same pattern as other detail pages */}
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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-4xl mx-auto">
        <InvoiceDocument data={invoiceData} />
      </div>
    </div>
  );
}
