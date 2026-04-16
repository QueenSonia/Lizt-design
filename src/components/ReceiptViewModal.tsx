"use client";

import { useEffect, useState } from "react";
import { X, Download, Share2 } from "lucide-react";
import Image from "next/image";
import { isValidImageSrc } from "@/lib/utils";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { receiptsApi } from "@/services/receipts/api";

interface BrandingInfo {
  logo?: string;
  letterhead?: string;
  companyName?: string;
  businessName?: string;
  address?: string;
  businessAddress?: string;
  email?: string;
  contactEmail?: string;
}

export interface ReceiptData {
  receiptNumber: string;
  receiptDate: string;
  paymentReference: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  propertyName: string;
  propertyAddress?: string;
  invoiceNumber?: string;
  amountPaid: number;
  paymentMethod?: string;
  notes?: string;
  // Branding (optional - if not provided, will try localStorage, then defaults)
  branding?: BrandingInfo;
}

interface ReceiptViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData;
  receiptId?: string;
  receiptToken?: string;
}

const DEFAULT_LOGO = "/lizt.svg";

export function ReceiptViewModal({
  isOpen,
  onClose,
  data,
  receiptId,
  receiptToken,
}: ReceiptViewModalProps) {
  const [brandingData, setBrandingData] = useState<BrandingInfo | null>(null);

  // Load branding data from props, localStorage, or use defaults
  useEffect(() => {
    console.log("ReceiptViewModal - data.branding:", data.branding);

    // Priority 1: Use branding from props (from API receipt data)
    if (data.branding) {
      console.log(
        "ReceiptViewModal - Using branding from props:",
        data.branding,
      );
      setBrandingData(data.branding);
      return;
    }

    // Priority 2: Try localStorage (for standalone receipt pages)
    const savedBranding = localStorage.getItem("offerLetterBranding");
    if (savedBranding) {
      try {
        const parsed = JSON.parse(savedBranding);
        console.log(
          "ReceiptViewModal - Using branding from localStorage:",
          parsed,
        );
        setBrandingData(parsed);
      } catch (e) {
        console.error("Failed to parse branding data:", e);
      }
    } else {
      console.log("ReceiptViewModal - No branding data found, using defaults");
    }
  }, [data.branding]);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG")}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    // Parse DD/MM/YYYY format
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const date = new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0]),
      );
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    // Fallback for other formats
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Get company name from branding
  const companyName = brandingData?.businessName || "-";

  // Get company address from branding
  const companyAddress = brandingData?.businessAddress;

  // Get company email from branding
  const companyEmail = brandingData?.contactEmail;

  // Get logo from branding (check letterhead field)
  const rawLogo = brandingData?.letterhead;
  const companyLogo = isValidImageSrc(rawLogo) ? rawLogo : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 receipt-modal-container">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto receipt-modal">
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            Payment Receipt
          </h2>
          <div className="flex items-center gap-2">
            {receiptId && (
              <Button
                onClick={() => {
                  const url = receiptsApi.getDownloadUrl(receiptId);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `receipt-${data.receiptNumber}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  toast.success("Downloading receipt PDF...");
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            )}
            {receiptToken && (
              <Button
                onClick={() => {
                  const link = `${window.location.origin}/receipt/${receiptToken}`;
                  navigator.clipboard.writeText(link).then(
                    () => toast.success("Receipt link copied to clipboard"),
                    () => toast.error("Failed to copy link"),
                  );
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Receipt Content - Matching ReceiptDocument Design */}
        <div
          className="w-full bg-white"
          style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
        >
          <div className="max-w-[800px] mx-auto px-12 py-16">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-12 pb-8 border-b border-gray-200">
              {/* Company Info - Left */}
              <div className="flex-1">
                {companyLogo ? (
                  <Image
                    src={companyLogo}
                    alt="Company Logo"
                    width={150}
                    height={48}
                    className="h-12 mb-6 object-contain"
                    unoptimized
                  />
                ) : (
                  <Image
                    src={DEFAULT_LOGO}
                    alt="Property Kraft Logo"
                    width={150}
                    height={48}
                    className="h-12 mb-6 object-contain"
                  />
                )}
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {companyName}
                </p>
                {companyAddress ? (
                  <p className="text-xs text-gray-600 leading-relaxed max-w-xs">
                    {companyAddress}
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 leading-relaxed">-</p>
                )}
                {companyEmail ? (
                  <p className="text-xs text-gray-600 mt-1">{companyEmail}</p>
                ) : (
                  <p className="text-xs text-gray-600 mt-1">-</p>
                )}
              </div>

              {/* Receipt Title - Right */}
              <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-3">
                  RECEIPT
                </h1>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p>
                    <span className="font-medium text-gray-800">
                      Receipt No:
                    </span>{" "}
                    {data.receiptNumber}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">
                      Issue Date:
                    </span>{" "}
                    {formatDate(data.receiptDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Receipt Summary Block - Premium Feel */}
            <div className="mb-10 border border-gray-200 p-8 bg-gray-50">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {formatCurrency(data.amountPaid)}
                </p>
                <p className="text-lg font-medium text-gray-700 mb-3">
                  Payment Received
                </p>
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">Status: </span>
                    <span className="font-medium text-green-700">PAID</span>
                  </div>
                  {data.paymentMethod && (
                    <>
                      <span className="text-gray-300">|</span>
                      <div>
                        <span className="text-gray-500">Method: </span>
                        <span className="font-medium text-gray-900">
                          {data.paymentMethod}
                        </span>
                      </div>
                    </>
                  )}
                  <span className="text-gray-300">|</span>
                  <div>
                    <span className="text-gray-500">Ref: </span>
                    <span className="font-medium text-gray-900">
                      {data.paymentReference}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Breakdown Section */}
            <div className="mb-10">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b border-gray-200">
                Payment Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">
                    Invoice Reference
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {data.invoiceNumber || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Amount Paid</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(data.amountPaid)}
                  </span>
                </div>
                {data.notes && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Notes</span>
                    <span className="text-sm text-gray-900 text-right max-w-md">
                      {data.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-200 my-8"></div>

            {/* Tenant & Property Details */}
            <div className="grid grid-cols-2 gap-8 mb-10">
              {/* Tenant Information */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Tenant Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {data.tenantName}
                    </p>
                  </div>
                  {data.tenantPhone && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                      <p className="text-sm text-gray-900">
                        {data.tenantPhone}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Email</p>
                    <p className="text-sm text-gray-900">{data.tenantEmail}</p>
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Property Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Property Name
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {data.propertyName}
                    </p>
                  </div>
                  {data.propertyAddress && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Address</p>
                      <p className="text-sm text-gray-900">
                        {data.propertyAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-200 my-8"></div>

            {/* Footer Confirmation */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-700">
                This receipt confirms payment received for the above tenancy
                invoice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
