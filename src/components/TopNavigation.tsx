/* eslint-disable */
import {
  ArrowLeft,
  Plus,
  Filter,
  ArrowUpDown,
  Download,
  Menu,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface TopNavigationProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;

  showAddNew?: boolean;
  onAddNewTenant?: () => void;
  onAddNewProperty?: () => void;
  onAddNewLandlord?: () => void;
  onAddNewFacilityManager?: () => void;
  onUploadDocument?: () => void;
  onCreateRequest?: () => void;
  showActionButtons?: boolean;
  onFilter?: () => void;
  onSort?: () => void;
  onExport?: () => void;
  customActions?: React.ReactNode;
  variant?: "default" | "form";

  // Mobile responsive props
  isMobile?: boolean;
  showSidebarToggle?: boolean;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function TopNavigation({
  title,
  subtitle,
  showBackButton = false,
  onBack,

  showAddNew = true,
  onAddNewTenant,
  onAddNewProperty,
  onAddNewLandlord,
  onAddNewFacilityManager,
  onUploadDocument,
  onCreateRequest, // Add this missing parameter
  showActionButtons = false,
  onFilter,
  onSort,
  onExport,
  customActions,
  variant = "default",

  // Mobile responsive props
  isMobile = false,
  showSidebarToggle = false,
  onToggleSidebar,
  isSidebarOpen = false,
}: TopNavigationProps) {
  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-6 lg:px-8 py-4 lg:py-5 shadow-sm transition-none">
      <div className="flex items-center justify-between">
        {/* Left Side - Sidebar Toggle (Mobile), Back Button and Title */}
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          {/* Mobile Sidebar Toggle */}
          {showSidebarToggle && onToggleSidebar && (
            <>
              <Button
                variant="ghost"
                onClick={onToggleSidebar}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-2 lg:hidden relative z-50 pointer-events-auto touch-manipulation"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
              {!showBackButton && !onBack && (
                <div className="h-6 w-px bg-slate-300 lg:hidden" />
              )}
            </>
          )}

          {/* Back Button - Always show if onBack is provided */}
          {onBack && (
            <>
              <div className="h-6 w-px bg-slate-300 hidden sm:block" />
            </>
          )}

          {/* Hide title/subtitle container for dashboard screens */}
          {!(
            title === "Facility Manager Dashboard" ||
            title === "Live Feed" ||
            title === "Reports & Analytics"
          ) && (
            <div className="min-w-0 flex-1">
              {subtitle && (
                <p className="text-sm text-slate-500 truncate mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {/* Custom Actions */}
          {customActions}

          {/* Facility Manager New Request Button */}
          {onCreateRequest && (
            <Button
              size={isMobile ? "sm" : "default"}
              className="bg-[#FF5000] hover:bg-[#FF5000]/90 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 px-3 sm:px-6"
              onClick={onCreateRequest}
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New Request</span>
            </Button>
          )}

          {/* Standard Action Buttons for List Views */}
          {showActionButtons && (
            <div className="flex items-center space-x-1 sm:space-x-2">
              {onFilter && (
                <Button
                  variant="outline"
                  size={isMobile ? "sm" : "default"}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  onClick={onFilter}
                >
                  <Filter className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              )}

              {onSort && (
                <Button
                  variant="outline"
                  size={isMobile ? "sm" : "default"}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  onClick={onSort}
                >
                  <ArrowUpDown className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sort</span>
                </Button>
              )}

              {showActionButtons && showAddNew && (
                <div className="h-4 w-px bg-slate-300 mx-1 sm:mx-2 hidden sm:block" />
              )}
            </div>
          )}

          {/* Add New Dropdown */}
          {showAddNew &&
            (onAddNewTenant ||
              onAddNewProperty ||
              onAddNewLandlord ||
              onAddNewFacilityManager ||
              onUploadDocument) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size={isMobile ? "sm" : "default"}
                    className="gradient-primary cursor-pointer text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 px-3 sm:px-6 "
                  >
                    <Plus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Add New</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 sm:w-56 border-slate-200 shadow-xl bg-white/95 backdrop-blur-sm"
                >
                  {onAddNewTenant && (
                    <DropdownMenuItem
                      onClick={onAddNewTenant}
                      className="text-slate-700 hover:bg-slate-50"
                    >
                      Add New Tenant
                    </DropdownMenuItem>
                  )}
                  {onAddNewProperty && (
                    <DropdownMenuItem
                      onClick={onAddNewProperty}
                      className="text-slate-700 hover:bg-slate-50"
                    >
                      Add New Property
                    </DropdownMenuItem>
                  )}
                  {onAddNewFacilityManager && (
                    <DropdownMenuItem
                      onClick={onAddNewFacilityManager}
                      className="text-slate-700 hover:bg-slate-50"
                    >
                      Add New Facility Manager
                    </DropdownMenuItem>
                  )}
                  {onUploadDocument && (
                    <DropdownMenuItem
                      onClick={onUploadDocument}
                      className="text-slate-700 hover:bg-slate-50"
                    >
                      Upload Document
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
      </div>
    </div>
  );
}
