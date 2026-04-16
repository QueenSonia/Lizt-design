import React from "react";
import { ArrowLeft } from "lucide-react";
import Original5 from "@/imports/Original5";

interface BrandBannerProps {
  onBack?: () => void;
  showBackButton?: boolean;
}

export function BrandBanner({
  onBack,
  showBackButton = !!onBack,
}: BrandBannerProps) {
  return (
    <div
      className="w-full py-2 px-4 mt-2 sm:py-4 sm:px-6 sm:mt-4 lg:px-8"
      style={{ backgroundColor: "#1f2937" }}
    >
      <div className="max-w-7xl mx-auto relative">
        {/* Back Arrow - Only visible when showBackButton is true */}
        {showBackButton && (
          <button
            onClick={onBack}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Mobile Layout - Stacked */}
        <div className="flex sm:hidden flex-col items-center gap-2">
          <div className="h-8" style={{ maxWidth: "160px" }}>
            <div className="h-full flex items-center justify-center">
              <Original5 />
            </div>
          </div>
        </div>

        {/* Desktop Layout - Horizontal */}
        <div className="hidden sm:flex items-center justify-between relative">
          {/* Spacer for balance - Left (desktop only) */}
          <div className="w-48 hidden lg:block"></div>

          {/* Logo - Centered via absolute positioning on desktop */}
          <div
            className="absolute left-1/2 transform -translate-x-1/2 h-8"
            style={{ maxWidth: "160px" }}
          >
            <div className="h-full flex items-center justify-center">
              <Original5 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
