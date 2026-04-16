import { ArrowLeft, Menu, X, Plus } from "lucide-react";
import { Button } from "./ui/button";
// import LandlordAddNewModal from "@/components/LandlordAddNewModal";
import { memo } from "react";

interface LandlordTopNavProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onAddNew?: () => void;
  showAddNew?: boolean;
  showAddButton?: boolean;
  onAddProperty?: () => void;
  onAddTenant?: () => void;
  onAddFacilityManager?: () => void;
  onGenerateKYC?: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
  isMenuOpen?: boolean;
  buttonText?: string;
}

export const LandlordTopNav = memo(function LandlordTopNav({
  title,
  subtitle,
  onBack,
  onAddProperty,
  onAddTenant,
  onAddFacilityManager,
  onGenerateKYC,
  onMenuClick,
  onAddNew,
  showAddButton = true,
  isMobile = false,
  isMenuOpen = false,
  buttonText = "Add Property",
}: LandlordTopNavProps) {
  return (
    <div className="lg:fixed top-0 right-0 left-0 lg:left-72 z-20 bg-white border-b border-slate-200 shadow-sm transition-none">
      <div className="px-4 lg:px-8 py-4 lg:py-5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Menu/Back Button + Title */}
          <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1">
            {/* Back Button - Show when onBack is provided */}
            {onBack && (
              <Button
                variant="outline"
                size="icon"
                onClick={onBack}
                className="hover:bg-[#FFF3EB] active:bg-[#FF5000] active:border-[#FF5000] transition-colors shrink-0 h-9 w-9 lg:h-10 lg:w-10 group"
              >
                <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6 text-[#222222] group-active:text-white transition-colors" />
              </Button>
            )}

            {/* Mobile Menu Button - Show when no back button and on mobile */}
            {isMobile && !onBack && onMenuClick && (
              <Button
                variant="outline"
                size="icon"
                onClick={onMenuClick}
                className="hover:bg-slate-100 shrink-0 h-9 w-9 lg:hidden"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-slate-900" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-900" />
                )}
              </Button>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-lg text-slate-900 font-semibold truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs lg:text-sm text-slate-600">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Action Buttons - Only show one at a time based on priority */}
          {showAddButton && (
            <>
              {/* Generate KYC Link Button - Highest priority for KYC page */}
              {onGenerateKYC && (
                <Button
                  onClick={onGenerateKYC}
                  className="bg-[#FF5000] hover:bg-[#E64800] text-white shrink-0 h-9 lg:h-10 px-3 lg:px-4 rounded-lg"
                >
                  <span>Generate KYC</span>
                </Button>
              )}

              {/* Add Manager Button - Second priority */}
              {!onGenerateKYC && onAddFacilityManager && (
                <Button
                  onClick={onAddFacilityManager}
                  className="bg-[#FF5000] hover:bg-[#E64800] text-white shrink-0 h-9 lg:h-10 px-3 lg:px-4 rounded-lg"
                >
                  <span>Add Facility Manager</span>
                </Button>
              )}

              {/* Add Property Button - Third priority */}
              {!onGenerateKYC && !onAddFacilityManager && onAddProperty && (
                <Button
                  onClick={onAddProperty}
                  className="bg-[#FF5000] hover:bg-[#E64800] text-white shrink-0 h-9 lg:h-10 px-3 lg:px-4 rounded-lg"
                >
                  <span>Add Property</span>
                </Button>
              )}

              {/* Add Tenant Button - Fourth priority */}
              {!onGenerateKYC &&
                !onAddFacilityManager &&
                !onAddProperty &&
                onAddTenant && (
                  <Button
                    onClick={onAddTenant}
                    className="bg-[#FF5000] hover:bg-[#E64800] text-white shrink-0 h-9 lg:h-10 px-3 lg:px-4 rounded-lg"
                  >
                    <span>Add Tenant</span>
                  </Button>
                )}

              {/* Fallback to simple button if only onAddNew is provided */}
              {!onGenerateKYC &&
                !onAddFacilityManager &&
                !onAddProperty &&
                !onAddTenant &&
                onAddNew && (
                  <Button
                    onClick={onAddNew}
                    className="bg-[#FF5000] hover:bg-[#E64800] text-white shrink-0 h-9 lg:h-10 px-3 lg:px-4 rounded-lg"
                  >
                    <Plus className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                    <span>{buttonText || "Add"}</span>
                  </Button>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default LandlordTopNav;
