import type { Metadata } from "next";
import Receipt from "@/components/designs/Receipt";

export const metadata: Metadata = {
  title: "Receipt",
};

export default function Page() {
  return <Receipt />;
}
