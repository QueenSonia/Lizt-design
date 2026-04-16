"use client";
import { useRouter } from "next/navigation";
import { ForgotPassword } from "@/components/ForgotPassword";
import { useAuth } from "@/contexts/AuthContext";

export default function ForgotPasswordPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    router.push("/");
    return null;
  }

  return (
    <ForgotPassword
      onBack={() => router.push("/signin")}
      onLogoClick={() => router.push("/")}
      isLoading={isLoading}
    />
  );
}
