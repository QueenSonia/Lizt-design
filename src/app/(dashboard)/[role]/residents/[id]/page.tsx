"use client";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import LandlordResidentDetail from "@/components/LandlordResidentDetail";
import { LoadingFallback } from "@/components/LoadingFallback";

export default function ResidentDetailPage() {
  const { id } = useParams();

  const residentId = Array.isArray(id) ? id[0] : id;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <LandlordResidentDetail residentId={residentId || ""} />
    </Suspense>
  );
}
