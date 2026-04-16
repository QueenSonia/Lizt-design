"use client";

import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the current URL for redirect after signin
      sessionStorage.setItem("returnUrl", window.location.href);
      router.replace("/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (isAuthenticated && user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  } else {
    // You can redirect to an unauthorized page or show a message
    return <div>You are not authorized to view this page.</div>;
  }
};

export default ProtectedRoute;
