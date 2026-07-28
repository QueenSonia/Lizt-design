"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MOCK_LANDLORDS, type MockLandlord } from "@/components/LandlordLandlords";
import KycFormBuilder from "@/components/landlord/KycFormBuilder";

interface LandlordDetailTabsProps {
  landlordId: string;
}

export default function LandlordDetailTabs({
  landlordId,
}: LandlordDetailTabsProps) {
  const router = useRouter();
  const landlord: MockLandlord | undefined = MOCK_LANDLORDS.find(
    (l) => l.id === landlordId,
  );

  if (!landlord) {
    return (
      <div className="flex flex-col h-full bg-[#F8F7F4] items-center justify-center px-4 text-center">
        <p className="text-sm font-semibold text-gray-900 mb-1">
          Landlord not found
        </p>
        <p className="text-sm text-gray-500 mb-4">
          This landlord may have been removed.
        </p>
        <button
          onClick={() => router.back()}
          className="text-sm text-[#FF5722] hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{landlord.name}</p>
          <p className="text-xs text-gray-500">{landlord.email}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <Tabs defaultValue="overview">
          <TabsList className="w-full max-w-md grid grid-cols-2 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="kyc-form">KYC Form</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="bg-white rounded-xl shadow-sm px-5 py-5 flex items-start justify-between gap-6 max-w-2xl">
              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-900">
                  {landlord.name}
                </p>
                {landlord.type === "corporate" && landlord.contactName && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Contact: {landlord.contactName}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">{landlord.email}</p>
                <p className="text-sm text-gray-500 mt-1">{landlord.phone}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  {landlord.properties}{" "}
                  {landlord.properties === 1 ? "Property" : "Properties"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {landlord.tenantList.length}{" "}
                  {landlord.tenantList.length === 1 ? "Tenant" : "Tenants"}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="kyc-form">
            <div className="bg-white rounded-xl shadow-sm px-5 py-5 max-w-3xl">
              <KycFormBuilder landlordId={landlord.id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
