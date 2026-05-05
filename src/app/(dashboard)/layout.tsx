"use client";
import { Suspense } from "react";
import { LandlordSidebar } from "@/components/LandlordSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { useMobile } from "@/contexts/MobileContext";
import { LoadingFallback } from "@/components/LoadingFallback";
import { SidebarSkeleton } from "@/components/SidebarSkeleton";
import { usePathname, useRouter } from "next/navigation";
import { FacilityManagerProvider } from "@/components/facility-manager/FacilityManagerProvider";
import { FacilityManagerSidebar } from "@/components/facility-manager/FacilityManagerSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const {
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useNavigation();
  const { isMobile } = useMobile();
  const router = useRouter();
  const pathname = usePathname();
  const currentScreen = pathname.split("/").pop() || "dashboard";

  const localHandleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:z-20">
          <SidebarSkeleton />
        </div>
        <div className="flex-1 lg:pl-72">
          <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100" />
        </div>
      </div>
    );
  }

  if (user?.role === "facility-manager") {
    return (
      <FacilityManagerProvider>
        <div
          className="fm-root"
          style={{
            display: "flex",
            height: "100vh",
            overflow: "hidden",
            background: "#F5F4F1",
          }}
        >
          <FacilityManagerSidebar />
          <main
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
          </main>
        </div>
      </FacilityManagerProvider>
    );
  }

  return (
    <div className="flex bg-gradient-to-br from-slate-50 to-slate-100">
      {isMobile && isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden pointer-events-none">
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        </div>
      )}

      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:z-20">
        <Suspense fallback={<LoadingFallback />}>
          <LandlordSidebar
            currentScreen={currentScreen}
            onLogout={localHandleLogout}
            onLogoClick={() => router.push("/")}
            isMobile={false}
          />
        </Suspense>
      </div>

      {isMobile && isMobileSidebarOpen && (
        <div
          className={`
            fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out
            ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            bg-white border-r border-slate-200 shadow-xl lg:hidden
          `}
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <LandlordSidebar
              currentScreen={currentScreen}
              onLogout={localHandleLogout}
              onLogoClick={() => router.push("/")}
              isMobile={isMobile}
              onClose={() => setIsMobileSidebarOpen(false)}
            />
          </Suspense>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-72">
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="min-h-full transition-all duration-300 ease-in-out">
            <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
