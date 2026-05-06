"use client";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  Wrench,
  ShieldCheck,
  CreditCard,
  Headphones,
  FileBarChart2,
  Bell,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LogoutConfirmationModal } from "@/components/modals/LogoutConfirmationModal";

type IconType = typeof LayoutDashboard;

interface NavItem {
  id: string;
  label: string;
  icon: IconType;
  badge?: number;
}

export const ADMIN_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "landlords", label: "Landlords", icon: Users },
  { id: "tenants", label: "Tenants", icon: UserCheck },
  { id: "facility-managers", label: "Facility Managers", icon: Wrench },
  { id: "kyc-applications", label: "KYC Applications", icon: ShieldCheck, badge: 47 },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "service-requests", label: "Service Requests", icon: Headphones, badge: 132 },
  { id: "reports", label: "Reports", icon: FileBarChart2 },
  { id: "notifications", label: "Notifications", icon: Bell, badge: 4 },
  { id: "activity-logs", label: "Activity Logs", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const currentScreen = pathname.split("/").pop() || "dashboard";

  const initials = (user?.name || "SA")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col h-screen bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-200 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-2 min-w-0"
          >
            <div className="size-8 rounded-md bg-[#FF5000] flex items-center justify-center shrink-0">
              <ShieldCheck className="size-4 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">Lizt Admin</div>
                <div className="text-[10px] text-slate-400 truncate">Platform Console</div>
              </div>
            )}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-0.5">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const active = currentScreen === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => router.push(`/admin/${item.id}`)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-[#FF5000] text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-slate-700 text-slate-200"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="size-9 rounded-full bg-gradient-to-br from-[#FF5000] to-[#FF8A3D] flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">
                  {user?.name || "Super Admin"}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setLogoutOpen(true)}
            className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="size-[18px] shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>

        <div className="px-4 pb-3">
          <Image
            src="/lizt-white.svg"
            alt="Lizt"
            width={56}
            height={20}
            className={`opacity-50 ${collapsed ? "hidden" : "block"}`}
          />
        </div>
      </aside>

      <LogoutConfirmationModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={logout}
      />
    </>
  );
}
