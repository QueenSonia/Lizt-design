"use client";
/* eslint-disable */
import { useState } from "react";
import {
  Building2,
  LogOut,
  MessageSquare,
  Settings,
  ChevronDown,
  Wrench,
  FileCheck,
  KeyRound,
  Megaphone,
  Users,
  ClipboardList,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/services/users/api";
import { LogoutConfirmationModal } from "./modals/LogoutConfirmationModal";

interface LandlordSidebarProps {
  currentScreen: string;
  onLogout: () => void;
  onLogoClick: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export function LandlordSidebar({
  currentScreen,
  onLogout,
  onLogoClick,
  isMobile = false,
  onClose,
}: LandlordSidebarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role;

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });

  const menuGroups = [
    {
      title: "Main",
      items: [
        { id: "dashboard", label: "Live Feed", icon: MessageSquare },
        { id: "tenancies", label: "Tenancies", icon: KeyRound },
        { id: "landlords", label: "Landlords", icon: Building2 },
        { id: "kyc", label: "Tenant Applicants", icon: FileCheck },
        { id: "agents", label: "Agents", icon: Users },
        { id: "onboarding", label: "Onboarding", icon: ClipboardList },
        { id: "communications", label: "Communications", icon: Megaphone },
        { id: "facility", label: "Facility", icon: Wrench },
      ],
    },
  ];

  const handleSettingsClick = () => {
    router.push(`/${userRole}/settings`);
    setIsUserMenuOpen(false);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const onNavigate = (screen: string) => {
    router.push(`/${userRole}/${screen}`);
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="px-6 py-6 border-b border-slate-100 flex justify-start">
        <button
          onClick={onLogoClick}
          className="transition-opacity duration-200 hover:opacity-75"
        >
          <Image
            src={"/lizt.svg"}
            alt="Lizt by Property Kraft"
            width={80}
            height={60}
            className="h-10 w-auto object-contain"
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <nav className="space-y-8 py-4">
          {menuGroups.map((group, groupIndex) => (
            <div key={group.title}>
              <div className="px-3 mb-3"></div>

              <div className="space-y-1">
                {group.items.map((item: any) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;

                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => {
                        onNavigate(item.id);
                        if (isMobile && onClose) {
                          onClose();
                        }
                      }}
                      className={`
                        w-full justify-start h-10 px-3 relative group
                        transition-all duration-200 ease-out
                        ${
                          isActive
                            ? "bg-slate-50 text-slate-900 hover:bg-slate-100"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                        active:translate-x-2 active:duration-100
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-linear-to-b from-orange-500 to-orange-600 rounded-full" />
                      )}

                      <Icon
                        className={`w-5 h-5 mr-3 transition-colors duration-200 ${
                          isActive
                            ? "text-orange-600"
                            : "text-slate-500 group-hover:text-slate-700"
                        }`}
                      />

                      <span className="font-medium text-sm truncate">
                        {item.label}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {groupIndex < menuGroups.length - 1 && (
                <div className="mt-6 px-3">
                  <div className="h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-100 p-4">
        <DropdownMenu
          open={isUserMenuOpen}
          onOpenChange={setIsUserMenuOpen}
          modal={false}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between h-auto p-3 hover:bg-slate-50 transition-all duration-200 group"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-left">
                <div className="font-semibold text-sm text-slate-900">Tunji Oginni</div>
                <div className="text-xs text-slate-500">Property Manager</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors duration-200 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 border-slate-200 shadow-lg bg-white/95 backdrop-blur-sm z-[100]"
            sideOffset={8}
          >
            <DropdownMenuItem
              onClick={handleSettingsClick}
              className="text-slate-700 hover:bg-slate-50 cursor-pointer py-2.5 transition-colors duration-200"
            >
              <Settings className="w-4 h-4 mr-3 text-slate-500" />
              Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-200" />
            <DropdownMenuItem
              onClick={handleLogoutClick}
              className="text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer py-2.5 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
