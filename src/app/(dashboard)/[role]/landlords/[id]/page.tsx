"use client";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import LandlordDetailTabs from "@/components/landlord/LandlordDetailTabs";
import { LoadingFallback } from "@/components/LoadingFallback";

export default function LandlordDetailPage() {
  const { id } = useParams();
  const landlordId = Array.isArray(id) ? id[0] : id;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <LandlordDetailTabs landlordId={landlordId || ""} />
    </Suspense>
  );
}
