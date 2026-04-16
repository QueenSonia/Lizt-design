"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download } from "lucide-react";
import { InvoiceDocument, InvoiceData } from "./InvoiceDocument";
import { invoiceApi } from "@/services/invoices/api";

export type { InvoiceData };

// Print styles for invoice modal
const printStyles = `
  @media print {
    html, body {
      height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    body > *:not(.invoice-modal-portal) {
      display: none !important;
    }

    .invoice-modal-portal > * {
      position: static !important;
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
      display: block !important;
      height: auFebruary 2026

Payment Received — Claude den — ₦800,000

Feb 23, 2026, 5:14 PM


Receipt Sent — Claude den

Feb 23, 2026, 4:30 PM


Receipt Issued — Claude den

Feb 23, 2026, 4:30 PM


Tenant moved in — Claude den

Feb 23, 2026, 4:30 PMto !important;
      overflow: visible !important;
    }

    .invoice-modal-portal .invoice-modal-box {
      position: static !important;
      background: white !important;
      padding: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      max-width: 100% !important;
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
    }

    .invoice-modal-portal .invoice-scroll-area {
      overflow: visible !important;
      max-height: none !important;
      height: auto !important;
    }

    .invoice-print-root {
      page-break-inside: avoid;
      height: auto !important;
      overflow: visible !important;
    }

    .print\\:hidden {
      display: none !important;
    }
  }
`;

// Inject print styles once
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = printStyles;
  document.head.appendChild(styleEl);
}

interface InvoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData | null;
  isPaid?: boolean;
  paymentDate?: string;
}

export function InvoiceViewModal({
  isOpen,
  onClose,
  data,
}: InvoiceViewModalProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  // Handle download as PDF
  const handleDownload = () => {
    // If backend invoice exists, download the generated PDF
    if (data.backendInvoiceId) {
      const pdfUrl = invoiceApi.getInvoicePdfUrl(data.backendInvoiceId);
      window.open(pdfUrl, "_blank");
      return;
    }

    // Fallback to browser print dialog
    const tenantName = data.tenantName.replace(/\s+/g, "-");
    const invoiceNumber = data.invoiceNumber.replace(/\s+/g, "-");
    const filename = `Invoice-${invoiceNumber}-${tenantName}`;

    const originalTitle = document.title;
    document.title = filename;

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  const modalContent = (
    <div
      className="invoice-modal-portal fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="invoice-modal-box relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close and Download buttons */}
        <div className="absolute top-6 right-4 z-10 flex gap-2 print:hidden">
          <button
            onClick={handleDownload}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Download PDF"
          >
            <Download className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="invoice-scroll-area overflow-y-auto max-h-[90vh]">
          {/* Use canonical component in VIEW mode */}
          <div className="relative bg-white invoice-print-root">
            <InvoiceDocument data={data} />
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
}
