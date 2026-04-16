import { useEffect, useRef, useCallback } from "react";

// Global refresh state to prevent multiple intervals
let globalRefreshInterval: NodeJS.Timeout | null = null;
let isGlobalRefreshActive = false;

/**
 * Hook to automatically refresh access token before it expires
 * Refreshes every 14 minutes (1 minute before 15-minute expiration)
 * Uses a singleton pattern to ensure only one refresh interval is active
 */
export function useTokenRefresh() {
  const isInitialized = useRef(false);

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Token refresh failed:", response.statusText);

        // Clear server-side cookies to prevent redirection loops
        if (typeof window !== "undefined") {
          try {
            await fetch("/api/auth/logout-silent", {
              method: "POST",
              credentials: "include",
            });
          } catch (e) {
            console.error("Failed to clear cookies silently:", e);
          }
        }

        return false;
      }

      console.log("Token refreshed successfully");
      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Only initialize once globally
    if (!isGlobalRefreshActive && !isInitialized.current) {
      isInitialized.current = true;
      isGlobalRefreshActive = true;

      // Start automatic token refresh
      // Refresh every 14 minutes (1 minute before expiration)
      globalRefreshInterval = setInterval(
        () => {
          refreshToken();
        },
        14 * 60 * 1000,
      ); // 14 minutes

      console.log("Token refresh interval started");
    }

    // Cleanup on unmount - only clear if this is the last instance
    return () => {
      // Don't clear the interval on component unmount
      // It should persist across the app lifecycle
    };
  }, [refreshToken]);

  // Provide a manual cleanup function if needed
  const stopRefresh = useCallback(() => {
    if (globalRefreshInterval) {
      clearInterval(globalRefreshInterval);
      globalRefreshInterval = null;
      isGlobalRefreshActive = false;
      console.log("Token refresh interval stopped");
    }
  }, []);

  return { refreshToken, stopRefresh };
}
