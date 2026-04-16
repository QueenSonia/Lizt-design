import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { toast } from "sonner";

interface EndTenancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: EndTenancyData) => void;
  tenantName?: string;
  propertyName?: string;
}

interface EndTenancyData {
  reason: string;
  notes: string;
  effectiveDate: string;
}

const endTenancyReasons = [
  "Rent expired",
  "Tenant requested",
  "Eviction",
  "Other",
];

export function EndTenancyModal({
  isOpen,
  onClose,
  onConfirm,
  tenantName = "Unknown Tenant",
  propertyName = "Unknown Property",
}: EndTenancyModalProps) {
  const [formData, setFormData] = useState<EndTenancyData>({
    reason: "",
    notes: "",
    effectiveDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData({
        reason: "",
        notes: "",
        effectiveDate: "",
      });
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleInputChange = (field: keyof EndTenancyData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.reason) {
      toast.error("Please select a reason for ending the tenancy");
      return false;
    }
    return true;
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Add today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];
      const dataWithDate = {
        ...formData,
        effectiveDate: today,
      };

      onConfirm(dataWithDate);
      toast.success("Tenancy ended successfully.");
      handleOpenChange(false);
    } catch {
      toast.error("Failed to end tenancy. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg bg-white rounded-xl shadow-xl border border-slate-200">
        <DialogHeader className="space-y-4 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div>
              <DialogTitle className="text-xl text-slate-900">
                End Tenancy
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-1">
                {tenantName} • {propertyName}
              </DialogDescription>
            </div>
          </div>
          <DialogDescription className="text-slate-600 leading-relaxed">
            Are you sure you want to end this tenancy? This action will end the
            tenancy immediately.
          </DialogDescription>
        </DialogHeader>

        {/* Form Section */}
        <div className="space-y-6 py-6">
          {/* Reason Dropdown */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Reason for ending tenancy <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => handleInputChange("reason", value)}
            >
              <SelectTrigger className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {endTenancyReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Confirm End Tenancy"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
