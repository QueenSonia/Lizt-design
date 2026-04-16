"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingFallback } from "@/components/LoadingFallback";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is finished before checking authentication
    if (!isLoading && isAuthenticated) {
      const role = user?.role;
      const initialScreen = role === "admin" ? "reports" : "dashboard";
      router.push(role ? `/${role}/${initialScreen}` : "/");
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show a loading indicator while the auth status is being determined
  if (isLoading) {
    return <LoadingFallback />;
  }

  // If the user is authenticated, the useEffect will trigger a redirect.
  // Returning null here prevents a flash of the login page.
  if (isAuthenticated) {
    return null;
  }

  // If not loading and not authenticated, show the children (login/signup page)
  return <>{children}</>;
}
