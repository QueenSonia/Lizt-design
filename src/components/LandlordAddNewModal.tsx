/* eslint-disable */
import { useState, memo, useCallback, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Building2, UserPlus, Users, Plus } from "lucide-react";
import { Button } from "./ui/button";

interface LandlordAddNewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProperty: () => void;
  onAddTenant: () => void;
  onAddFacilityManager: () => void;
  children?: React.ReactNode;
}

export const LandlordAddNewModal = memo(function LandlordAddNewModal({
  open,
  onOpenChange,
  onAddProperty,
  onAddTenant,
  onAddFacilityManager,
  children,
}: LandlordAddNewModalProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  const handleOptionClick = useCallback(
    (action: () => void) => {
      action();
      onOpenChange(false);
      // Return focus to trigger button after closing
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 100);
    },
    [onOpenChange]
  );

  // Focus first button when popover opens
  useEffect(() => {
    if (open && firstButtonRef.current) {
      setTimeout(() => {
        firstButtonRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
        setTimeout(() => {
          triggerRef.current?.focus();
        }, 100);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onOpenChange]);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {children && (
        <PopoverTrigger asChild>
          <div ref={triggerRef as any}>{children}</div>
        </PopoverTrigger>
      )}
      <PopoverContent
        className="w-56 p-2 bg-white rounded-xl shadow-lg border border-slate-200 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
        align="end"
        sideOffset={8}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          firstButtonRef.current?.focus();
        }}
      >
        <div className="space-y-1" role="menu" aria-label="Add new options">
          {/* Add Property */}
          <button
            ref={firstButtonRef}
            onClick={() => handleOptionClick(onAddProperty)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF1E8] transition-all duration-150 group text-left"
            role="menuitem"
            tabIndex={0}
          >
            <p className="text-sm text-slate-900">Add Property</p>
          </button>

          {/* Add Tenant */}
          <button
            onClick={() => handleOptionClick(onAddTenant)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FFF1E8] transition-all duration-150 group text-left"
            role="menuitem"
            tabIndex={0}
          >
            <p className="text-sm text-slate-900">Add Tenant</p>
          </button>

          {/* Add Facility Manager */}
          {/* <button
            onClick={() => handleOptionClick(onAddFacilityManager)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-[#FF5000] hover:bg-orange-50 transition-all duration-200 group"
            role="menuitem"
            tabIndex={0}
          >
            <div className="text-left flex-1">
              <p className="font-semibold text-sm text-slate-900">
                Add Facility Manager
              </p>
            </div>
          </button> */}
        </div>
      </PopoverContent>
    </Popover>
  );
});

export default LandlordAddNewModal;
