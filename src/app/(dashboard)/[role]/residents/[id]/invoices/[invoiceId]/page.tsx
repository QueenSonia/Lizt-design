"use client";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import ResidentInvoiceDetail from "@/components/ResidentInvoiceDetail";
import { MOCK_RESIDENTS, MOCK_RESIDENT_INVOICES } from "@/lib/residentMockData";
import { useAuth } from "@/contexts/AuthContext";

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#FF5000] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ResidentInvoicePage() {
  const { id: residentId, invoiceId, role } = useParams();
  const { user } = useAuth();
  const userRole = user?.role ?? (typeof role === "string" ? role : "landlord");
  const residentIdStr = Array.isArray(residentId) ? residentId[0] : (residentId ?? "");
  const invoiceIdStr = Array.isArray(invoiceId) ? invoiceId[0] : (invoiceId ?? "");
  const resident = MOCK_RESIDENTS.find((r) => r.id === residentIdStr);
  const invoice = (MOCK_RESIDENT_INVOICES[residentIdStr] ?? []).find((i) => i.id === invoiceIdStr);

  if (!invoice || !resident) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-500">Invoice not found.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResidentInvoiceDetail
        invoice={invoice}
        resident={resident}
        backTo={`/${userRole}/residents/${residentIdStr}`}
        backLabel={resident.name}
      />
    </Suspense>
  );
}
