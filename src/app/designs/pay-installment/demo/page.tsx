import type { Metadata } from "next";
import PayInstallmentDemo from "@/components/designs/PayInstallmentDemo";

export const metadata: Metadata = {
  title: "Pay Installment",
};

export default function Page() {
  return <PayInstallmentDemo />;
}
