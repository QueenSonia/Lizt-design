"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// This route has been removed. Redirect to the tenant's KYC profile instead.
export default function TenantDetailRedirectPage() {
  const { id, role } = useParams();
  const router = useRouter();

  useEffect(() => {
    const tenantId = Array.isArray(id) ? id[0] : id ?? "";
    const kycId = tenantId.replace(/^app-/, "");
    router.replace(`/${role}/kyc-application-detail/${kycId}`);
  }, [id, role, router]);

  return null;
}
