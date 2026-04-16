import { User, UserRole } from "@/types/user";

interface BackendUser {
  id: string;
  email: string;
  role: string;
  profile_name?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  last_login?: string;
}

/**
 * Transform backend user format to frontend User type
 */
export function transformBackendUser(backendUser: BackendUser): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    role: backendUser.role as UserRole,
    name:
      backendUser.profile_name ||
      `${backendUser.first_name || ""} ${backendUser.last_name || ""}`.trim(),
    createdAt: new Date(backendUser.created_at),
    lastLogin: backendUser.last_login
      ? new Date(backendUser.last_login)
      : new Date(),
  };
}

/**
 * Check if user session is still valid
 * Returns true if authenticated, false otherwise
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Clear all client-side auth data
 * Note: HTTP-only cookies are cleared server-side via /api/auth/logout
 */
export function clearAuthData(): void {
  // Clear any legacy sessionStorage items
  sessionStorage.removeItem("propertyKraftAuth");
  sessionStorage.removeItem("propertyKraftUserRole");
  sessionStorage.removeItem("propertyKraftUserId");
  sessionStorage.removeItem("propertyKraftUser");
  sessionStorage.removeItem("returnUrl");
}
