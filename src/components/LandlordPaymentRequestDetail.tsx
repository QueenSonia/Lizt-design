"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, Banknote } from "lucide-react";
import { Button } from "./ui/button";

export default function LandlordPaymentRequestDetail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role || "landlord";

  const paymentId = searchParams.get("id") ?? "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push(`/${userRole}/facility`)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-semibold text-gray-900">Payment Request Detail</p>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
          <Banknote className="w-8 h-8 text-[#FF5000]" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">
          Payment Request Detail — Coming Soon
        </h1>
        <p className="text-sm text-gray-500 max-w-md mb-1">
          A full review screen for this payment request is on the way.
        </p>
        {paymentId && (
          <p className="text-xs text-gray-400 mb-6">Request ID: {paymentId}</p>
        )}
        <Button variant="outline" onClick={() => router.push(`/${userRole}/facility`)}>
          Back to Facility
        </Button>
      </div>
    </div>
  );
}
