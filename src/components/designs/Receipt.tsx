"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface RenewalData {
  renewalId: string;
  tenantName: string;
  tenantPhone: string;
  propertyName: string;
  propertyAddress: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  landlordAddress: string;
  rentAmount: number;
  serviceCharge: number;
  legalFee: number;
  outstandingBalance: number;
  otherCharges: number;
  renewalDate: string;
  newLeaseStartDate: string;
  newLeaseEndDate: string;
  transactionId?: string;
  paymentDate?: string;
  modeOfPayment?: string;
}

const MOCK_RENEWAL: RenewalData = {
  renewalId: "ren123",
  tenantName: "Benjamin Udeogaranya",
  tenantPhone: "+234 901 234 5678",
  propertyName: "Three Bedroom Apartment (Ground Floor-Front)",
  propertyAddress: "3 Taye Olowu Street, Lekki Phase 1, Lagos",
  landlordName: "Property Kraft Limited",
  landlordPhone: "+234 803 456 7890",
  landlordEmail: "hello@propertykraft.com",
  landlordAddress: "21 Ibiyinka Salvador, Lekki",
  rentAmount: 15000000,
  serviceCharge: 1500000,
  legalFee: 1500000,
  outstandingBalance: 1000000,
  otherCharges: 0,
  renewalDate: "March 5, 2026",
  newLeaseStartDate: "January 1, 2027",
  newLeaseEndDate: "December 31, 2027",
  modeOfPayment: "Bank Transfer",
  transactionId: "TXN-REN-2026-001234",
};

function ReceiptScreen({
  renewalData,
  amountPaid,
}: {
  renewalData: RenewalData;
  amountPaid: number;
}) {
  const formatCurrency = (amount: number) =>
    `₦${(amount ?? 0).toLocaleString("en-NG")}`;
  const totalAmount =
    (renewalData.outstandingBalance ?? 0) +
    (renewalData.rentAmount ?? 0) +
    (renewalData.serviceCharge ?? 0) +
    (renewalData.otherCharges ?? 0);
  const remainingBalance = totalAmount - (amountPaid ?? 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-4">
        <Image
          alt="Lizt"
          src="/designs/receipt/lizt.png"
          width={120}
          height={40}
          className="h-[40px] w-auto"
        />
      </div>

      <div className="flex justify-center px-4 pb-8 sm:pb-12">
        <div className="bg-white max-w-[800px] w-full px-6 sm:px-8 md:px-12 lg:px-16 py-10 sm:py-12 md:py-16">
          {/* Mobile header */}
          <div className="sm:hidden mb-10">
            <div className="flex justify-between items-start mb-6">
              <Image
                alt="Property Kraft"
                src="/designs/receipt/property-kraft.png"
                width={120}
                height={40}
                className="h-[40px] w-auto"
              />
              <div className="text-right">
                <h1 className="text-base font-bold text-gray-900 mb-1.5 tracking-tight">
                  PAYMENT RECEIPT
                </h1>
                <p className="text-[10px] text-gray-600">
                  Receipt #{renewalData.transactionId}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop header */}
          <div className="hidden sm:flex justify-between items-start mb-16 md:mb-20">
            <Image
              alt="Property Kraft"
              src="/designs/receipt/property-kraft.png"
              width={150}
              height={50}
              className="h-[50px] w-auto"
            />
            <div className="text-right">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                PAYMENT RECEIPT
              </h1>
              <p className="text-xs text-gray-600">
                Receipt #{renewalData.transactionId}
              </p>
            </div>
          </div>

          {/* Info section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 mb-10 sm:mb-14 md:mb-16">
            <div className="space-y-5 sm:space-y-6">
              <div>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mb-2">Tenant</p>
                <p className="text-[13px] sm:text-sm font-medium text-gray-900">
                  {renewalData.tenantName}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mb-2">Phone</p>
                <p className="text-[13px] sm:text-sm text-gray-900">
                  {renewalData.tenantPhone}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mb-2">Property</p>
                <p className="text-[13px] sm:text-sm text-gray-900 leading-relaxed">
                  {renewalData.propertyName}
                </p>
              </div>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <div>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mb-2">Date</p>
                <p className="text-[13px] sm:text-sm text-gray-900">
                  {renewalData.paymentDate}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mb-2">Mode of Payment</p>
                <p className="text-[13px] sm:text-sm text-gray-900">
                  {renewalData.modeOfPayment}
                </p>
              </div>
            </div>
          </div>

          {/* Payment breakdown table */}
          <div className="mb-10 sm:mb-14 md:mb-16">
            <div className="bg-gray-900 text-white px-4 sm:px-5 py-3.5 sm:py-4 flex justify-between items-center mb-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide">
                Description
              </span>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide">
                Amount
              </span>
            </div>

            <div>
              <div className="px-4 sm:px-5 py-4 sm:py-5 flex justify-between items-start gap-3 sm:gap-4 bg-gray-50">
                <span className="text-[13px] sm:text-sm text-gray-700 flex-1 leading-relaxed">
                  Outstanding Balance
                </span>
                <span className="text-[13px] sm:text-sm font-medium text-gray-900 tabular-nums whitespace-nowrap">
                  {formatCurrency(renewalData.outstandingBalance)}
                </span>
              </div>

              <div className="px-4 sm:px-5 py-4 sm:py-5 flex justify-between items-start gap-3 sm:gap-4">
                <span className="text-[13px] sm:text-sm text-gray-700 flex-1 leading-relaxed">
                  Rent
                </span>
                <span className="text-[13px] sm:text-sm font-medium text-gray-900 tabular-nums whitespace-nowrap">
                  {formatCurrency(renewalData.rentAmount)}
                </span>
              </div>

              <div className="px-4 sm:px-5 py-4 sm:py-5 flex justify-between items-start gap-3 sm:gap-4 bg-gray-50">
                <span className="text-[13px] sm:text-sm text-gray-700 flex-1 leading-relaxed">
                  Service Charge
                </span>
                <span className="text-[13px] sm:text-sm font-medium text-gray-900 tabular-nums whitespace-nowrap">
                  {formatCurrency(renewalData.serviceCharge)}
                </span>
              </div>

              {renewalData.otherCharges > 0 && (
                <div className="px-4 sm:px-5 py-4 sm:py-5 flex justify-between items-start gap-3 sm:gap-4">
                  <span className="text-[13px] sm:text-sm text-gray-700 flex-1 leading-relaxed">
                    Other Charges
                  </span>
                  <span className="text-[13px] sm:text-sm font-medium text-gray-900 tabular-nums whitespace-nowrap">
                    {formatCurrency(renewalData.otherCharges)}
                  </span>
                </div>
              )}

              <div className="border-t-2 border-gray-300 mt-2 pt-3 px-4 sm:px-5 py-2 sm:py-3 flex justify-between items-start gap-3 sm:gap-4">
                <span className="text-[13px] sm:text-sm font-bold text-gray-900 flex-1">
                  Total
                </span>
                <span className="text-[13px] sm:text-sm font-bold text-gray-900 tabular-nums whitespace-nowrap">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment summary */}
          <div className="space-y-1">
            <div className="flex justify-between items-start gap-3 sm:gap-4 px-4 sm:px-5 py-1.5 sm:py-2">
              <span className="text-[13px] sm:text-base font-bold text-green-700 flex-1">
                Amount Paid
              </span>
              <span className="text-[15px] sm:text-lg font-bold text-green-700 tabular-nums whitespace-nowrap">
                {formatCurrency(amountPaid)}
              </span>
            </div>

            <div className="flex justify-between items-start gap-3 sm:gap-4 px-4 sm:px-5 py-1.5 sm:py-2">
              <span className="text-[13px] sm:text-base font-bold text-gray-900 flex-1">
                Remaining Balance
              </span>
              <span
                className={`text-[15px] sm:text-lg font-bold tabular-nums whitespace-nowrap ${
                  remainingBalance > 0 ? "text-orange-600" : "text-gray-900"
                }`}
              >
                {formatCurrency(remainingBalance)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 sm:mt-16 md:mt-20 pt-8 sm:pt-10 border-t border-gray-200">
            <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed mb-10 sm:mb-12">
              Thank you for your payment. This receipt confirms your transaction for the period specified above.
            </p>

            <div className="text-center space-y-1">
              <p className="text-[10px] sm:text-[11px] text-gray-500">
                {renewalData.landlordPhone}
              </p>
              <p className="text-[10px] sm:text-[11px] text-gray-500">
                {renewalData.landlordEmail}
              </p>
              <p className="text-[10px] sm:text-[11px] text-gray-500">
                {renewalData.landlordAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Receipt() {
  const [paymentDate, setPaymentDate] = useState<string>("");

  useEffect(() => {
    setPaymentDate(
      new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);

  const renewalData: RenewalData = {
    ...MOCK_RENEWAL,
    paymentDate: paymentDate || "March 5, 2026",
  };

  return <ReceiptScreen renewalData={renewalData} amountPaid={16500000} />;
}
