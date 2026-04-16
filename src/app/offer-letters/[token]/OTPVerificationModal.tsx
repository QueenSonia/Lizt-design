"use client";

import { useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  useVerifyOTPMutation,
  useAcceptOfferMutation,
} from "@/services/offer-letters/mutation";
import { offerLetterApi } from "@/services/offer-letters/api";
import { toast } from "sonner";

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  phoneLastFour: string;
  onSuccess: () => void;
}

/**
 * OTP Verification Modal Component
 * Requirements: 9.1, 9.2, 9.9
 */
export function OTPVerificationModal({
  isOpen,
  onClose,
  token,
  phoneLastFour,
  onSuccess,
}: OTPVerificationModalProps) {
  const [otp, setOtp] = useState("");

  const verifyMutation = useVerifyOTPMutation();
  const resendMutation = useAcceptOfferMutation();

  // Handle OTP submission - Requirements: 9.3
  const handleVerify = useCallback(async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    try {
      // Get user's IP address for tracking
      const ipAddress = await offerLetterApi.getUserIP();
      await verifyMutation.mutateAsync({ token, otp, ipAddress });
      onSuccess();
    } catch {
      // Requirements: 9.9 - Allow retry on invalid OTP
      toast.error("Invalid verification code. Please try again.");
      setOtp("");
    }
  }, [otp, token, verifyMutation, onSuccess]);

  // Handle resend code - Requirements: 9.9
  const handleResend = useCallback(async () => {
    setOtp("");
    try {
      await resendMutation.mutateAsync(token);
      toast.success("A new verification code has been sent");
    } catch {
      toast.error("Failed to resend code. Please try again.");
    }
  }, [token, resendMutation]);

  // Handle modal close
  const handleClose = useCallback(() => {
    setOtp("");
    onClose();
  }, [onClose]);

  const isVerifying = verifyMutation.isPending;
  const isResending = resendMutation.isPending;
  const phoneNumber = `****${phoneLastFour}`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white p-0">
        <div className="px-6 py-4">
          <button
            onClick={handleClose}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center px-6 pt-8 pb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Confirm Your Acceptance
          </h2>
          <p className="text-sm text-gray-600 mb-1 text-center">
            To proceed, please confirm your acceptance of this offer.
          </p>
          <p className="text-sm text-gray-600 mb-8 text-center">
            This acts as your digital signature and verifies your identity.
          </p>

          <p className="text-xs text-gray-500 mb-4 text-center max-w-sm">
            The code sent to {phoneNumber} is used to confirm that you are the
            intended recipient of this offer letter.
          </p>

          <div className="mb-12">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            disabled={otp.length !== 6 || isVerifying}
            className="w-full max-w-xs h-10 mb-6 bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-50"
          >
            {isVerifying ? "Confirming..." : "Confirm & Sign"}
          </Button>

          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
