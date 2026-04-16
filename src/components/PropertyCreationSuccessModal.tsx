import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface PropertyCreationSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasTenant: boolean;
  propertyName: string;
  isExistingTenant?: boolean;
  kycStatus?: string;
}

export function PropertyCreationSuccessModal({
  open,
  onOpenChange,
  hasTenant,
  propertyName,
  isExistingTenant = false,
  kycStatus,
}: PropertyCreationSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white/95 backdrop-blur-lg shadow-2xl border border-slate-200/50">
        <DialogHeader className="space-y-4">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <DialogTitle className="text-2xl text-center text-slate-900">
            Property Created Successfully!
          </DialogTitle>

          {/* Conditional Description */}
          <DialogDescription className="text-center text-slate-600 space-y-3">
            {hasTenant ? (
              <>
                <div>
                  <strong>{propertyName}</strong> has been created and your
                  tenant has been attached.
                </div>
                <div>
                  {isExistingTenant
                    ? // Show different messages based on KYC status for existing tenants
                      kycStatus === "approved"
                      ? "The existing tenant with approved KYC has been successfully attached to this new property."
                      : kycStatus === "pending"
                      ? "The existing tenant has been attached to this new property. Their KYC is currently awaiting approval."
                      : kycStatus === "rejected"
                      ? "The existing tenant has been attached to this new property. A KYC resubmission link has been sent as their previous KYC was rejected."
                      : kycStatus === "pending_completion"
                      ? "The existing tenant has been attached to this new property. A KYC completion link has been sent to complete their application."
                      : "The existing tenant has been successfully attached to this new property."
                    : "A KYC completion link has been sent to your tenant via WhatsApp. Once they complete their KYC information, their details will appear in your Tenant Details screen."}
                </div>
              </>
            ) : (
              <>
                <div>
                  <strong>{propertyName}</strong> has been successfully added to
                  your properties.
                </div>
                <div>
                  You can now generate KYC links for prospective tenants or
                  manage this property from your dashboard.
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Action Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-[#FF5000] hover:bg-[#E64800] text-white h-11 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
