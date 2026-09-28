"use client";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Universal sign-out page — accessible regardless of current auth state.
// Clears the session and redirects to /signin.
export default function SignOutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return null;
}
