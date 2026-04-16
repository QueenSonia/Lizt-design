"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { isValidImageSrc } from "@/lib/utils";

const DEFAULT_LOGO = "/lizt.svg";

interface BrandingInfo {
  logo?: string;
  letterhead?: string;
  companyName?: string;
  businessName?: string;
  address?: string;
  businessAddress?: string;
  email?: string;
  contactEmail?: string;
  phone?: string;
  contactPhone?: string;
  footerText?: string;
  footerColor?: string;
  headingFont?: string;
  bodyFont?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  status: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyName: string;
  propertyAddress: string;
  lineItems: Array<{ description: string; amount: number }>;
  subtotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  /** Backend invoice ID — when present, PDF download uses the backend endpoint */
  backendInvoiceId?: string;
  /** Payment completion date (for fully paid invoices) */
  paidDate?: string;
  /** Branding (optional - if not provided, will use defaults) */
  branding?: BrandingInfo;
}

interface InvoiceDocumentProps {
  data: InvoiceData;
}

export function InvoiceDocument({ data }: InvoiceDocumentProps) {
  const [brandingData, setBrandingData] = useState<BrandingInfo | null>(null);

  // Load branding data from props or use defaults
  useEffect(() => {
    console.log("InvoiceDocument - data.branding:", data.branding);

    // Priority 1: Use branding from props (from profile data)
    if (data.branding) {
      console.log(
        "InvoiceDocument - Using branding from props:",
        data.branding,
      );
      setBrandingData(data.branding);
      return;
    }

    console.log("InvoiceDocument - No branding data found, using defaults");
  }, [data.branding]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG")}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Format date for stamp (short format)
  const formatStampDate = (dateString: string) => {
    // Handle DD/MM/YYYY format (e.g., '14/01/2024')
    if (dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        // Create ISO format: YYYY-MM-DD
        const isoDate = `${year}-${month}-${day}`;
        const date = new Date(isoDate);
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }
    // Handle ISO format or other standard formats
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Check if invoice is fully paid
  const normalizedStatus = (data.status || "").toLowerCase();
  const isFullyPaid =
    normalizedStatus === "paid" &&
    (data.amountDue === 0 || data.amountDue === undefined);

  // Get company name from branding (support both field names)
  const companyName =
    brandingData?.companyName || brandingData?.businessName || "Property Kraft";

  // Get company address from branding (support both field names)
  const companyAddress = brandingData?.address || brandingData?.businessAddress;

  // Get company email from branding (support both field names)
  const companyEmail = brandingData?.email || brandingData?.contactEmail;

  // Get company phone from branding (support both field names)
  const companyPhone = brandingData?.phone || brandingData?.contactPhone;

  // Get logo from branding (check both logo and letterhead)
  const rawLogo = brandingData?.logo || brandingData?.letterhead;
  const companyLogo = isValidImageSrc(rawLogo) ? rawLogo : undefined;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-8 md:p-12 pt-16 md:pt-32 relative">
      {/* Header Section - Logo on left, Invoice details on right */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-200 mt-2 md:mt-20">
        {/* Logo and Company Info */}
        <div>
          {companyLogo ? (
            <Image
              src={companyLogo}
              alt="Company Logo"
              width={200}
              height={64}
              className="h-10 sm:h-16 mb-4 object-contain"
              unoptimized
            />
          ) : (
            <Image
              src={DEFAULT_LOGO}
              alt="Property Kraft Logo"
              width={200}
              height={64}
              className="h-10 sm:h-16 mb-4 object-contain"
            />
          )}
          <h3 className="font-semibold text-gray-900 mb-1">{companyName}</h3>
          {companyAddress && (
            <p className="text-sm text-gray-600">{companyAddress}</p>
          )}
          {companyPhone && (
            <p className="text-sm text-gray-600">{companyPhone}</p>
          )}
          {companyEmail && (
            <p className="text-sm text-gray-600">{companyEmail}</p>
          )}
        </div>

        {/* Invoice Title and Number */}
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Invoice #:</span> {data.invoiceNumber}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Date:</span>{" "}
            {formatDate(data.invoiceDate)}
          </p>
        </div>
      </div>

      {/* Bill To and Property Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Tenant Details */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Bill To
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-900 mb-1">
              {data.tenantName}
            </p>
            <p className="text-sm text-gray-600 mb-0.5">{data.tenantEmail}</p>
            {data.tenantPhone && (
              <p className="text-sm text-gray-600">{data.tenantPhone}</p>
            )}
          </div>
        </div>

        {/* Property Details */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Property
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-900 mb-1">
              {data.propertyName}
            </p>
            {data.propertyAddress && (
              <p className="text-sm text-gray-600">{data.propertyAddress}</p>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table - Description and Amount */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Description
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-900">{item.description}</td>
                <td className="py-4 px-4 text-right text-gray-900 font-medium">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-8">
        <div className="w-full md:w-1/2">
          <div className="space-y-2">
            <div className="flex justify-between py-2 text-gray-700">
              <span>Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(data.subtotal)}
              </span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-200 text-lg font-bold text-gray-900">
              <span>Total:</span>
              <span>{formatCurrency(data.total)}</span>
            </div>
            {/* Show payment status if partially paid */}
            {normalizedStatus === "partially paid" &&
              data.amountPaid &&
              data.amountDue && (
                <>
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Amount Paid:</span>
                    <span className="font-medium">
                      {formatCurrency(data.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-red-600 font-semibold">
                    <span>Amount Due:</span>
                    <span>{formatCurrency(data.amountDue)}</span>
                  </div>
                </>
              )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center">
        {brandingData?.footerText && (
          <p className="text-xs text-gray-400 mt-2">
            {brandingData.footerText}
          </p>
        )}
      </div>

      {/* PAID Distressed Rubber Stamp - Only show for fully paid invoices - Bottom left corner */}
      {isFullyPaid && (
        <div className="mt-12 mb-12 relative">
          <div
            className="absolute inset-0 flex items-center justify-start pointer-events-none z-10"
            style={{
              transform: "rotate(-22deg) translateY(-150px)",
              paddingLeft: "2rem",
            }}
          >
            {/* SVG filter for grunge/distressed effect */}
            <svg width="0" height="0" style={{ position: "absolute" }}>
              <defs>
                <filter id="distressed-stamp-paid">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.8"
                    numOctaves="4"
                    result="noise"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale="3"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                  <feGaussianBlur stdDeviation="0.3" />
                </filter>
              </defs>
            </svg>

            {/* Main stamp container */}
            <div
              className="relative px-8 py-4"
              style={{
                border: "7px solid rgba(34, 139, 34, 0.5)",
                backgroundColor: "transparent",
                filter: "url(#distressed-stamp-paid)",
              }}
            >
              {/* Inner border for depth */}
              <div
                style={{
                  position: "absolute",
                  inset: "4px",
                  border: "2px solid rgba(34, 139, 34, 0.4)",
                  pointerEvents: "none",
                }}
              />

              {/* Stamp text container */}
              <div className="flex flex-col items-center gap-1">
                {/* Main PAID text */}
                <div
                  className="text-6xl font-black tracking-wider relative"
                  style={{
                    color: "rgba(34, 139, 34, 0.5)",
                    letterSpacing: "0.3em",
                    fontFamily:
                      'Impact, "Arial Black", "Franklin Gothic Bold", sans-serif',
                    fontWeight: 900,
                    textShadow: `2px 2px 0px rgba(34, 139, 34, 0.25), -1px -1px 0px rgba(34, 139, 34, 0.2), 1px 0px 2px rgba(34, 139, 34, 0.15)`,
                    WebkitTextStroke: "1px rgba(34, 139, 34, 0.3)",
                  }}
                >
                  PAID
                </div>

                {/* Date text */}
                <div
                  className="text-lg font-bold tracking-wide relative"
                  style={{
                    color: "rgba(34, 139, 34, 0.5)",
                    letterSpacing: "0.15em",
                    fontFamily:
                      'Impact, "Arial Black", "Franklin Gothic Bold", sans-serif',
                    fontWeight: 700,
                    textShadow: `1px 1px 0px rgba(34, 139, 34, 0.25), -0.5px -0.5px 0px rgba(34, 139, 34, 0.2)`,
                    WebkitTextStroke: "0.5px rgba(34, 139, 34, 0.3)",
                  }}
                >
                  {data.paidDate
                    ? formatStampDate(data.paidDate)
                    : formatStampDate(new Date().toISOString())}
                </div>
              </div>

              {/* Grunge overlay spots - simulating ink imperfections */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(circle at 20% 30%, transparent 0%, transparent 40%, rgba(34, 139, 34, 0.08) 50%, transparent 60%), radial-gradient(circle at 80% 70%, transparent 0%, transparent 35%, rgba(34, 139, 34, 0.09) 45%, transparent 55%), radial-gradient(circle at 50% 90%, transparent 0%, transparent 30%, rgba(34, 139, 34, 0.07) 40%, transparent 50%), radial-gradient(circle at 10% 80%, transparent 0%, transparent 25%, rgba(34, 139, 34, 0.08) 35%, transparent 45%)`,
                  pointerEvents: "none",
                  mixBlendMode: "multiply",
                }}
              />

              {/* Edge wear effect - top and bottom */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(34, 139, 34, 0.2) 10%, transparent 25%, rgba(34, 139, 34, 0.15) 40%, transparent 60%, rgba(34, 139, 34, 0.18) 80%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(34, 139, 34, 0.15) 15%, transparent 35%, rgba(34, 139, 34, 0.2) 55%, transparent 70%, rgba(34, 139, 34, 0.18) 90%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
