/**
 * Phone Verification Component
 * Handles phone number entry and OTP verification before KYC form
 */

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { BrandBanner } from "@/components/ui/BrandBanner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { API_CONFIG } from "../utils/api-config";

interface PhoneVerificationProps {
  token: string;
  onVerificationComplete: (phoneNumber: string, verificationToken: string) => void;
  onError?: (error: string) => void;
}

type VerificationStage = "phone" | "otp";

export function PhoneVerification({
  token,
  onVerificationComplete,
  onError,
}: PhoneVerificationProps) {
  const [verificationStage, setVerificationStage] =
    useState<VerificationStage>("phone");
  const [enteredPhone, setEnteredPhone] = useState("");
  const [otpValue, setOtpValue] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "loading" | "success"
  >("idle");
  const [isSkippingOtp, setIsSkippingOtp] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /**
   * Normalize Nigerian phone number to international format (+234...)
   * Handles formats like: 0909843457, 909843457, +234909843457, 234909843457
   */
  const normalizeNigerianPhone = (phone: string): string => {
    // Remove all non-digit characters except leading +
    const cleaned = phone.replace(/[^\d+]/g, "");

    // If already starts with +234, return as-is
    if (cleaned.startsWith("+234")) {
      return cleaned;
    }

    // If starts with 234 (without +), add the +
    if (cleaned.startsWith("234") && cleaned.length >= 13) {
      return "+" + cleaned;
    }

    // If starts with 0, replace with +234
    if (cleaned.startsWith("0")) {
      return "+234" + cleaned.slice(1);
    }

    // If it's just the local number without leading 0 (e.g., 9098434570)
    // Nigerian mobile numbers are 10 digits starting with 7, 8, or 9
    if (/^[789]\d{9}$/.test(cleaned)) {
      return "+234" + cleaned;
    }

    // Return with +234 prefix as fallback
    return "+234" + cleaned;
  };

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  /**
   * Check if user has saved form data in sessionStorage for this token
   * Returns the saved phone number if found, null otherwise
   */
  const checkForSavedFormData = (): string | null => {
    try {
      const storageKey = `kyc_form_${token}`;
      const savedData = sessionStorage.getItem(storageKey);

      if (!savedData) return null;

      const formData = JSON.parse(savedData);
      console.log("📋 Parsed form data:", {
        hasPhoneNumber: !!formData.phone_number,
        phone_number: formData.phone_number,
      });

      const savedPhone = formData.phone_number;

      // Normalize the saved phone number before returning it
      return savedPhone ? normalizeNigerianPhone(savedPhone) : null;
    } catch (error) {
      console.error("Error checking saved form data:", error);
      return null;
    }
  };

  const handlePhoneSubmit = async () => {
    if (enteredPhone.length < 10) return;

    const normalizedPhone = normalizeNigerianPhone(enteredPhone);

    // Check if user has saved form data for this token
    const savedPhone = checkForSavedFormData();

    console.log("🔍 OTP Skip Check:", {
      enteredPhone,
      normalizedPhone,
      savedPhone,
      match: savedPhone === normalizedPhone,
    });

    // If saved phone matches entered phone, skip OTP verification
    // Note: No verificationToken is available when skipping OTP,
    // so KYC autofill lookups will be skipped (the form will use saved local data instead)
    if (savedPhone && savedPhone === normalizedPhone) {
      console.log("✅ Found saved form data for this phone - skipping OTP");
      setIsSkippingOtp(true);

      // Small delay for UX feedback
      setTimeout(() => {
        onVerificationComplete(normalizedPhone, "");
      }, 800);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(API_CONFIG.kyc.sendOtp(token), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: normalizedPhone }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setVerificationStage("otp");
      setResendTimer(60);
      // Focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (error) {
      console.error("Error sending OTP:", error);
      if (onError) {
        onError(
          error instanceof Error
            ? error.message
            : "Failed to send verification code. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtpValue = [...otpValue];
    newOtpValue[index] = value;
    setOtpValue(newOtpValue);
    setOtpError("");

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (index === 5 && value) {
      const fullOtp = newOtpValue.join("");
      if (fullOtp.length === 6) {
        handleOtpVerify(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otpValue[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpVerify = async (otp: string) => {
    const normalizedPhone = normalizeNigerianPhone(enteredPhone);

    setIsSubmitting(true);
    try {
      const response = await fetch(API_CONFIG.kyc.verifyOtp(token), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: normalizedPhone,
          otpCode: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid verification code");
      }

      // Verification successful - pass normalized phone number and verification token
      onVerificationComplete(normalizedPhone, data.verificationToken);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setOtpError(
        error instanceof Error
          ? error.message
          : "Verification failed. Please try again.",
      );
      if (onError) {
        onError(
          error instanceof Error
            ? error.message
            : "Failed to verify code. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendStatus === "loading") return;

    const normalizedPhone = normalizeNigerianPhone(enteredPhone);

    setResendStatus("loading");
    try {
      const response = await fetch(API_CONFIG.kyc.sendOtp(token), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: normalizedPhone }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setResendStatus("success");
      setResendTimer(60);
      setOtpValue(["", "", "", "", "", ""]);
      setOtpError("");
      otpInputRefs.current[0]?.focus();

      // Reset success state after 2 seconds
      setTimeout(() => setResendStatus("idle"), 2000);
    } catch (error) {
      console.error("Error resending OTP:", error);
      setResendStatus("idle");
      if (onError) {
        onError(
          error instanceof Error
            ? error.message
            : "Failed to resend code. Please try again.",
        );
      }
    }
  };

  // Phone Number Entry Screen
  if (verificationStage === "phone") {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-orange-50/30 flex flex-col">
        <BrandBanner />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          {/* Page Overlay */}
          <div
            className="fixed inset-0 bg-black/5 backdrop-blur-[2px]"
            style={{ zIndex: -1 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[460px] bg-white rounded-2xl shadow-xl p-8 sm:p-10 relative"
          >
            {/* Header */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-1.5">
                Welcome 👋
              </h2>
              <p className="text-sm text-gray-600">
                Enter your WhatsApp number to get started with your KYC.
              </p>
              <p className="text-sm text-gray-600 mt-1">
                We&apos;ll send a verification code to you on WhatsApp to
                securely confirm your identity.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              <div>
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  WhatsApp Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={enteredPhone}
                  onChange={(e) => setEnteredPhone(e.target.value)}
                  // placeholder="+234 800 000 0000"
                  className="h-11 text-sm px-3.5 border-2 border-gray-200 rounded-lg focus:border-[#FF5000] focus:ring-4 focus:ring-[#FF5000]/10 transition-all"
                  onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              <Button
                onClick={handlePhoneSubmit}
                disabled={
                  enteredPhone.length < 10 || isSubmitting || isSkippingOtp
                }
                className="w-full h-11 text-sm font-medium text-white rounded-lg transition-all hover:shadow-lg hover:shadow-[#FF5000]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor:
                    enteredPhone.length >= 10 ? "#FF5000" : undefined,
                }}
              >
                {isSkippingOtp
                  ? "Resuming your application..."
                  : isSubmitting
                    ? "Sending..."
                    : "Continue"}
              </Button>
            </div>

            {/* Security Note */}
            <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-500">
              <Lock className="w-3.5 h-3.5" />
              <p className="text-xs">Your information is secure</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // OTP Verification Screen
  if (verificationStage === "otp") {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-orange-50/30 flex flex-col">
        <BrandBanner
          onBack={() => {
            setVerificationStage("phone");
            setOtpValue(["", "", "", "", "", ""]);
            setOtpError("");
          }}
        />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          {/* Page Overlay */}
          <div
            className="fixed inset-0 bg-black/5 backdrop-blur-[2px]"
            style={{ zIndex: -1 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[460px] bg-white rounded-2xl shadow-xl p-8 sm:p-10 relative"
          >
            {/* Header */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-1.5">
                Verify Your Number
              </h2>
              <p className="text-sm text-gray-600">
                We&apos;ve sent a 6-digit code to{" "}
                <span className="font-medium text-gray-900">
                  {enteredPhone}
                </span>
              </p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* OTP Inputs */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Enter verification code
                </Label>
                <div className="flex gap-2 justify-center">
                  {otpValue.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={isSubmitting}
                      className="w-11 h-12 text-center text-lg font-semibold border-2 border-gray-200 rounded-lg focus:border-[#FF5000] focus:ring-4 focus:ring-[#FF5000]/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: otpError ? "#ef4444" : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>

              {otpError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500"
                >
                  {otpError}
                </motion.p>
              )}

              {/* Resend Code */}
              <div className="text-center text-xs">
                <span className="text-gray-600">
                  Didn&apos;t receive the code?{" "}
                </span>
                <button
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || resendStatus === "loading"}
                  className="font-medium transition-colors disabled:text-gray-400 disabled:cursor-not-allowed hover:underline"
                  style={{
                    color:
                      resendTimer === 0 && resendStatus === "idle"
                        ? "#FF5000"
                        : resendStatus === "success"
                          ? "#10b981"
                          : undefined,
                  }}
                >
                  {resendTimer > 0
                    ? `Resend in ${resendTimer}s`
                    : resendStatus === "loading"
                      ? "Sending..."
                      : resendStatus === "success"
                        ? "Code sent! ✓"
                        : "Resend code"}
                </button>
              </div>
            </div>

            {/* Helper Text */}
            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  setVerificationStage("phone");
                  setOtpValue(["", "", "", "", "", ""]);
                  setOtpError("");
                }}
                disabled={isSubmitting}
                className="text-xs font-light underline transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: "#FF5000" }}
              >
                Change phone number
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
