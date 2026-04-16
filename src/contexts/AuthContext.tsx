"use client";

// ============================================================
// DESIGN SANDBOX — MOCK AUTH CONTEXT
// No API calls. Returns a mock landlord user immediately.
// ============================================================

import { createContext, useContext, useState } from "react";
import { User, UserRole } from "@/types/user";

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  handleSignIn: (role: UserRole) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const MOCK_LANDLORD: User = {
  id: "landlord-1",
  email: "babajide@propmanager.ng",
  role: "landlord",
  name: "Babajide Sanwo-Olu",
  createdAt: new Date("2023-01-01"),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(MOCK_LANDLORD);

  const login = (userData: User) => setUser(userData);

  const logout = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/signin";
    }
  };

  const handleSignIn = (_role: UserRole) => {
    setUser(MOCK_LANDLORD);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        handleSignIn,
        isAuthenticated: true,
        isLoading: false,
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
