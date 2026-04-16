"use client";
import { useParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import LandlordPropertyDetail from "@/components/LandlordPropertyDetail";
import { LoadingFallback } from "@/components/LoadingFallback";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const propertyId = Array.isArray(id) ? id[0] : id;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <LandlordPropertyDetail
        propertyId={propertyId || null}
        onBack={handleBack}
      />
    </Suspense>
  );
}
