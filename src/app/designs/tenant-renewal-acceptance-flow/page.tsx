import type { Metadata } from "next";
import TenantRenewalAcceptanceFlow from "@/components/designs/TenantRenewalAcceptanceFlow";

export const metadata: Metadata = {
  title: "Tenant Renewal Acceptance Flow",
};

export default function Page() {
  return <TenantRenewalAcceptanceFlow />;
}
