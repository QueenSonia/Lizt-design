"use client";

// DESIGN SANDBOX — redirect straight to admin dashboard on load.
// Change the path below to jump to any role/screen you're designing.
//
// Examples:
//   /admin/reports
//   /admin/properties
//   /landlord/dashboard
//   /facility-manager/dashboard

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingFallback } from "@/components/LoadingFallback";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/landlord/dashboard");
  }, [router]);

  return <LoadingFallback />;
}
