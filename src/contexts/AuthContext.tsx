"use client";

// ============================================================
// DESIGN SANDBOX — MOCK AUTH CONTEXT
// No backend. Three pre-configured accounts demonstrate single-role
// and multi-role sign-in flows. State persists via localStorage so
// refreshes keep the user signed in for the duration of a demo.
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole } from "@/types/user";

export interface MockAccount {
  email: string;
  password: string;
  roles: UserRole[];
  name: string;
  id: string;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: "landlord-1",
    email: "landlord@lizt.co",
    password: "password123",
    roles: ["landlord"],
    name: "Babajide Sanwo-Olu",
  },
  {
    id: "fm-1",
    email: "fm@lizt.co",
    password: "password123",
    roles: ["facility-manager"],
    name: "Jide Akinola",
  },
  {
    id: "owner-1",
    email: "owner@lizt.co",
    password: "password123",
    roles: ["landlord", "facility-manager"],
    name: "Adunni Coker",
  },
];

export function authenticate(
  identifier: string,
  password: string
): MockAccount | null {
  const normalized = identifier.trim().toLowerCase();
  const match = MOCK_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === normalized && a.password === password
  );
  return match ?? null;
}

export function buildUser(account: MockAccount, activeRole: UserRole): User {
  return {
    id: account.id,
    email: account.email,
    role: activeRole,
    roles: account.roles,
    name: account.name,
    createdAt: new Date("2024-01-01"),
    lastLogin: new Date(),
  };
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = "lizt-design-user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as User;
        setUser({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          lastLogin: parsed.lastLogin ? new Date(parsed.lastLogin) : undefined,
        });
      }
    } catch {
      // Ignore corrupt storage; treat as logged out.
    }
    setIsLoading(false);
  }, []);

  const persist = (next: User | null) => {
    if (typeof window === "undefined") return;
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    persist(userData);
  };

  const logout = () => {
    // Clear storage and force a full reload before touching React state.
    // Updating user state in-place causes the dashboard layout to swap from
    // the FM tree to the landlord tree mid-render, unmounting the
    // FacilityManagerProvider while FM screens are still alive — which throws.
    if (typeof window === "undefined") {
      setUser(null);
      return;
    }
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.href = "/signin";
  };

  const switchRole = (role: UserRole) => {
    setUser((prev) => {
      if (!prev || !prev.roles.includes(role)) return prev;
      const next = { ...prev, role };
      persist(next);
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        switchRole,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
