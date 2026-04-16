"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Download } from "lucide-react";
import { toast } from "sonner";
import type { RenewalInvoiceResponse } from "@/services/renewal-invoice/api";
import axiosInstance from "@/services/axios-instance";
import Image from "next/image";
import { isValidImageSrc } from "@/lib/utils";

interface RenewalInvoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RenewalInvoiceResponse | null;
}

export function RenewalInvoiceViewModal({
  isOpen,
  onClose,
  data,
}: RenewalInvoiceViewModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
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

  const formatCurrency = useCallback((amount: number | undefined) => {
    if (!amount) return "\u20A60";
    return `\u20A6${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const handleDownload = useCallback(async () => {
    if (!data) return;
    try {
      const response = await axiosInstance.get(
        `/tenancies/renewal-invoice/${data.token}/download`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const propertyName = data.propertyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const dateStr = new Date().toISOString().split("T")[0];
      link.setAttribute(
        "download",
        `renewal-invoice-${propertyName}-${dateStr}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded successfully");
    } catch {
      toast.error("Failed to download invoice. Please try again.");
    }
  }, [data]);

  if (!isOpen || !data) return null;

  const isPaid = data.paymentStatus === "paid";

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header buttons */}
        <div className="absolute top-6 right-4 z-10 flex gap-2">
          {isPaid && (
            <button
              onClick={handleDownload}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Download PDF"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[90vh]">
          <div className="bg-gray-50 min-h-0">
            <div className="flex justify-center px-4 py-8">
              <div className="bg-white shadow-sm max-w-[850px] w-full px-8 sm:px-12 py-8 sm:py-12">
                {/* Landlord logo */}
                {isValidImageSrc(data.landlordLogoUrl) && (
                  <div className="flex justify-end mb-8">
                    <Image
                      alt={data.landlordBranding?.businessName || "Landlord"}
                      className="h-[50px] w-auto object-contain"
                      src={data.landlordLogoUrl}
                      width={100}
                      height={50}
                    />
                  </div>
                )}

                {/* Title */}
                <h1 className="text-[16px] leading-[22px] font-bold text-[#1a1b23] mb-8 uppercase text-center">
                  Tenancy Renewal Invoice
                </h1>

                {/* Paid badge */}
                {isPaid && (
                  <div className="flex justify-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      Paid
                    </div>
                  </div>
                )}

                {/* Property and Tenant Information */}
                <div className="mb-8 space-y-4">
                  <div>
                    <p className="text-[11px] leading-[15px] text-gray-500 mb-1">
                      Property Name
                    </p>
                    <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                      {data.propertyName}
                    </p>
                    <p className="text-[11px] leading-[15px] text-[#1a1b23]">
                      {data.propertyAddress}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] leading-[15px] text-gray-500 mb-1">
                      Tenant Name
                    </p>
                    <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                      {data.tenantName}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] leading-[15px] text-gray-500 mb-1">
                      Renewal Period
                    </p>
                    <p className="text-[11px] leading-[15px] text-[#1a1b23]">
                      {data.renewalPeriod?.startDate
                        ? formatDate(data.renewalPeriod.startDate)
                        : "Not available"}{" "}
                      to{" "}
                      {data.renewalPeriod?.endDate
                        ? formatDate(data.renewalPeriod.endDate)
                        : "Not available"}
                    </p>
                  </div>
                </div>

                {/* Gradient separator */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />

                {/* Breakdown of Charges */}
                <div className="mb-8">
                  <h2 className="text-[12px] leading-[16px] font-bold text-[#1a1b23] mb-6 uppercase">
                    Breakdown of Charges
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                        Rent
                      </span>
                      <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                        {formatCurrency(data.charges?.rentAmount)}
                      </span>
                    </div>

                    {(data.charges?.serviceCharge ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                          Service Charge
                        </span>
                        <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                          {formatCurrency(data.charges.serviceCharge)}
                        </span>
                      </div>
                    )}

                    {(data.charges?.legalFee ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                          Legal Fee
                        </span>
                        <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                          {formatCurrency(data.charges.legalFee)}
                        </span>
                      </div>
                    )}

                    {(data.charges?.otherCharges ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                          Other Charges
                        </span>
                        <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                          {formatCurrency(data.charges.otherCharges)}
                        </span>
                      </div>
                    )}

                    {/* Wallet credit applied */}
                    {(data.walletBalance ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-[11px] leading-[15px] text-emerald-600">
                          Wallet Credit Applied
                        </span>
                        <span className="text-[11px] leading-[15px] text-emerald-600 font-bold">
                          -{formatCurrency(data.walletBalance)}
                        </span>
                      </div>
                    )}

                    {/* Previous outstanding added */}
                    {(data.walletBalance ?? 0) < 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                          Previous Outstanding Balance
                        </span>
                        <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                          +{formatCurrency(Math.abs(data.walletBalance!))}
                        </span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-gray-900">
                      <span className="text-[14px] leading-[18px] text-[#1a1b23] font-bold uppercase">
                        Total Amount Payable
                      </span>
                      <span className="text-[18px] leading-[24px] text-[#1a1b23] font-bold">
                        {formatCurrency(data.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Information (if paid) */}
                {isPaid && data.paidAt && (
                  <>
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />
                    <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="text-[12px] leading-[16px] font-bold text-green-900 mb-2 uppercase">
                        Payment Confirmed
                      </h3>
                      <div className="space-y-1 text-[11px] leading-[15px] text-green-800">
                        <p>
                          <span className="font-bold">Payment Date:</span>{" "}
                          {formatDate(data.paidAt)}
                        </p>
                        {data.paymentReference && (
                          <p>
                            <span className="font-bold">Reference:</span>{" "}
                            {data.paymentReference}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Gradient separator */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
