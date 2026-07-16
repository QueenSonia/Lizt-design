"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import LandlordAgentDetail from "@/components/LandlordAgentDetail";
import { LoadingFallback } from "@/components/LoadingFallback";

function AgentDetailContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();

  const agentId = Array.isArray(id) ? id[0] : id;
  const tab = searchParams.get("tab") === "tenants" ? "tenants" : "applicants";

  if (!agentId) return null;

  return <LandlordAgentDetail agentId={decodeURIComponent(agentId)} initialTab={tab} />;
}

export default function AgentDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AgentDetailContent />
    </Suspense>
  );
}
