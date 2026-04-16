"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { usePathname } from "next/navigation";

interface NavigationContextType {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  canGoBack: boolean;
  navigationHistory: string[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const pathname = usePathname();

  // Track navigation history
  useEffect(() => {
    setNavigationHistory((prev) => {
      // Don't add the same path twice in a row
      if (prev[prev.length - 1] === pathname) return prev;

      // Keep only the last 10 entries to prevent memory issues
      const newHistory = [...prev, pathname].slice(-10);
      return newHistory;
    });
  }, [pathname]);

  // Determine if we can go back (more than just the current page in history)
  const canGoBack = navigationHistory.length > 1;

  return (
    <NavigationContext.Provider
      value={{
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        searchTerm,
        setSearchTerm,
        canGoBack,
        navigationHistory,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
