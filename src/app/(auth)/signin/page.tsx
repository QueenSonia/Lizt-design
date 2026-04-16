"use client";
import { useRouter } from "next/navigation";
import { SignIn } from "@/components/SignIn";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/types/user";

export default function SignInPage() {
  const { isLoading, login } = useAuth();
  const router = useRouter();

  const onSignInSuccess = (user: User) => {
    // Check for return URL from multiple sources
    // 1. sessionStorage (set by axios interceptor or page-level redirect)
    const sessionReturnUrl = sessionStorage.getItem("returnUrl");

    // 2. URL query parameter (set by middleware)
    const urlParams = new URLSearchParams(window.location.search);
    const queryRedirect = urlParams.get("redirect");

    const returnUrl = sessionReturnUrl || queryRedirect;

    console.log("SignIn Success - Return URL check:", {
      sessionReturnUrl,
      queryRedirect,
      finalReturnUrl: returnUrl,
      currentHref: window.location.href,
    });

    // Instead of going to home page, redirect directly to dashboard
    const initialScreen = user.role === "admin" ? "reports" : "dashboard";
    const dashboardUrl = `/${user.role}/${initialScreen}`;

    // Check if returnUrl is just root or sign-in page, if so ignore it
    const isRootOrAuth =
      returnUrl === "/" ||
      returnUrl?.includes("/signin") ||
      returnUrl?.includes("/signup");

    // Clear the stored URL regardless of whether we use it (we've already captured it)
    sessionStorage.removeItem("returnUrl");

    if (returnUrl && !isRootOrAuth && returnUrl !== window.location.href) {
      // Validate the return URL to prevent open redirect attacks
      try {
        const url = new URL(returnUrl, window.location.origin);
        if (url.origin === window.location.origin) {
          // Check if it's effectively the root page or auth page again
          const isRootPath = url.pathname === "/" || url.pathname === "";
          const isAuthPath =
            url.pathname.startsWith("/signin") ||
            url.pathname.startsWith("/signup");

          if (!isRootPath && !isAuthPath) {
            console.log("Redirecting to return URL:", returnUrl);
            // Use window.location.href for immediate redirect to prevent race conditions
            window.location.href = returnUrl;
            return;
          } else {
            console.log(
              "Return URL is root/auth, ignoring and going to dashboard."
            );
          }
        }
      } catch (error) {
        console.warn("Invalid return URL:", returnUrl, error);
      }
    }

    console.log("No return URL, redirecting to dashboard:", dashboardUrl);

    // Update the auth context manually to avoid race conditions with useAuth's auto-check
    login(user);

    router.push(dashboardUrl);
  };

  return (
    <SignIn
      onSignInSuccess={onSignInSuccess}
      onForgotPassword={() => router.push("/forgot-password")}
      onLogoClick={() => router.push("/")}
      isLoading={isLoading}
    />
  );
}
