import { useEffect, useState } from "react";
import Image from "next/image";
import { isValidImageSrc } from "@/lib/utils";

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

  // Tenant details
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;

  // Property details
  propertyName: string;
  propertyAddress?: string;

  // Invoice reference
  invoiceNumber?: string;

  // Payment details
  amountPaid: number;
  paymentMethod?: string;

  // Notes
  notes?: string;

  // Branding (optional - if not provided, will try localStorage, then defaults)
  branding?: BrandingInfo;
}

interface ReceiptDocumentProps {
  data: ReceiptData;
}

const DEFAULT_LOGO = "/lizt.svg";

export function ReceiptDocument({ data }: ReceiptDocumentProps) {
  const [brandingData, setBrandingData] = useState<BrandingInfo | null>(null);

  // Load branding data from props, localStorage, or use defaults
  useEffect(() => {
    console.log("ReceiptDocument - data.branding:", data.branding);

    // Priority 1: Use branding from props (from API receipt data)
    if (data.branding) {
      console.log(
        "ReceiptDocument - Using branding from props:",
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
          "ReceiptDocument - Using branding from localStorage:",
          parsed,
        );
        setBrandingData(parsed);
      } catch (e) {
        console.error("Failed to parse branding data:", e);
      }
    } else {
      console.log("ReceiptDocument - No branding data found, using defaults");
    }
  }, [data.branding]);

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
    <div
      className="w-full bg-white"
      style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
    >
      {/* Full-width document with proper padding */}
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
                <span className="font-medium text-gray-800">Receipt No:</span>{" "}
                {data.receiptNumber}
              </p>
              <p>
                <span className="font-medium text-gray-800">Issue Date:</span>{" "}
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
              <span className="text-sm text-gray-600">Invoice Reference</span>
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
                  <p className="text-sm text-gray-900">{data.tenantPhone}</p>
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
                <p className="text-xs text-gray-500 mb-0.5">Property Name</p>
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
  );
}
