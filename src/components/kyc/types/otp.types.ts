/**
 * TypeScript interfaces for OTP verification system
 * Requirements: 4.1, 4.4
 */

export interface OTPService {
  sendOTP(
    phoneNumber: string,
    token: string
  ): Promise<{ success: boolean; message: string; retryAfter?: number }>;
  verifyOTP(
    phoneNumber: string,
    otp: string,
    token: string
  ): Promise<{ success: boolean; message: string }>;
  resendOTP(
    phoneNumber: string,
    token: string
  ): Promise<{ success: boolean; message: string; retryAfter?: number }>;
}

export interface OTPState {
  isSending: boolean;
  isVerifying: boolean;
  canResend: boolean;
  resendTimer: number;
  error: string | null;
  success: boolean;
  otpSent: boolean;
  verificationAttempts: number;
  maxAttempts: number;
}

export interface OTPVerificationProps {
  phoneNumber: string;
  token: string;
  onVerificationSuccess: () => void;
  onVerificationError: (error: string) => void;
  onOTPSent?: () => void;
  autoSend?: boolean;
}

export interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  length?: number;
}

export interface OTPTimerProps {
  seconds: number;
  onComplete: () => void;
  isActive: boolean;
}
