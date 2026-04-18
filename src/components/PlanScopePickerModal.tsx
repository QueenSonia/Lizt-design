/* eslint-disable */
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";

export type PlanScope = "tenancy" | "charge";

interface Props {
  open: boolean;
  onSelect: (scope: PlanScope) => void;
  onClose: () => void;
}

const OPTIONS: { value: PlanScope; label: string; description: string }[] = [
  {
    value: "tenancy",
    label: "Entire Tenancy",
    description: "Plan covers all charges combined",
  },
  {
    value: "charge",
    label: "Specific Charge",
    description: "Plan covers one selected charge",
  },
];

export function PlanScopePickerModal({ open, onSelect, onClose }: Props) {
  const [selected, setSelected] = useState<PlanScope | null>(null);

  function handleClose() {
    setSelected(null);
    onClose();
  }

  function handleContinue() {
    if (!selected) return;
    setSelected(null);
    onSelect(selected);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Create Payment Plan</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            What would you like to create a plan for?
          </p>
        </DialogHeader>

        <div className="space-y-2 py-1">
          {OPTIONS.map(({ value, label, description }) => (
            <label
              key={value}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                selected === value
                  ? "border-[#FF5000] bg-[#FFF3EB]"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="planScope"
                value={value}
                checked={selected === value}
                onChange={() => setSelected(value)}
                className="mt-0.5 accent-[#FF5000] shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
            </label>
          ))}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={handleContinue}
            className="bg-[#FF5000] hover:bg-[#e04600] text-white"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
