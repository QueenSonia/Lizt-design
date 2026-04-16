"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Legacy redirect: /offer-letters/[token]/invoice → /offer-letters/invoice/[token]
 * Keeps old links working while the canonical route is now /offer-letters/invoice/[token]
 */
export default function LegacyInvoiceRedirect() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  useEffect(() => {
    router.replace(`/offer-letters/invoice/${token}`);
  }, [router, token]);

  return null;
}
