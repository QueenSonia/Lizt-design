import type { Metadata } from "next";
import KycForm from "@/components/designs/KycForm";

export const metadata: Metadata = {
  title: "KYC Form",
};

export default function Page() {
  return <KycForm />;
}
