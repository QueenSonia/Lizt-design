"use client";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import LandlordMaintenanceRequestDetail from "@/components/LandlordMaintenanceRequestDetail";
import { MOCK_RESIDENTS, MOCK_RESIDENT_SERVICE_REQUESTS } from "@/lib/residentMockData";
import { useAuth } from "@/contexts/AuthContext";

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#FF5000] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ResidentMaintenanceRequestPage() {
  const { id: residentId, requestId, role } = useParams();
  const { user } = useAuth();
  const userRole = user?.role ?? (typeof role === "string" ? role : "landlord");
  const residentIdStr = Array.isArray(residentId) ? residentId[0] : (residentId ?? "");
  const requestIdStr = Array.isArray(requestId) ? requestId[0] : (requestId ?? "");
  const resident = MOCK_RESIDENTS.find((r) => r.id === residentIdStr);
  const req = MOCK_RESIDENT_SERVICE_REQUESTS[requestIdStr];
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LandlordMaintenanceRequestDetail
        requestOverride={req}
        backTo={`/${userRole}/residents/${residentIdStr}`}
        backLabel={resident?.name ?? "Resident"}
      />
    </Suspense>
  );
}
