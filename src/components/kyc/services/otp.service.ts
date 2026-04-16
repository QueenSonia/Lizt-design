/**
 * OTP service for KYC phone verification
 * Requirements: 4.1, 4.4
 */

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

interface OTPResponse {
  success: boolean;
  message: string;
  retryAfter?: number;
}

export class KYCOTPService {
  private static baseUrl = (() => {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3150";
    return url.endsWith("/") ? url.slice(0, -1) : url;
  })();
  private static defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  };

  /**
   * Generic retry mechanism for API calls
   */
  private static async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = this.defaultRetryConfig
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on the last attempt
        if (attempt === config.maxRetries) {
          break;
        }

        // Don't retry on client errors (4xx) except for rate limiting
        if (error instanceof Error && error.message.includes("4")) {
          const isRateLimit =
            error.message.includes("429") ||
            error.message.toLowerCase().includes("rate limit") ||
            error.message.toLowerCase().includes("too many");
          if (!isRateLimit) {
            break;
          }
        }

        // Calculate delay with exponential backoff
        const delay =
          config.retryDelay * Math.pow(config.backoffMultiplier, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Make API request with proper error handling
   */
  private static async makeRequest(
    url: string,
    body: Record<string, unknown>
  ): Promise<OTPResponse> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(
        data.message || `HTTP ${response.status}`
      ) as Error & { status?: number };
      // Add status code to error for retry logic
      error.status = response.status;
      throw error;
    }

    return {
      success: true,
      message: data.message || "Operation successful",
      retryAfter: data.retryAfter,
    };
  }

  /**
   * Send OTP to phone number with retry mechanism
   */
  static async sendOTP(
    phoneNumber: string,
    token: string
  ): Promise<{ success: boolean; message: string; retryAfter?: number }> {
    try {
      const result = await this.withRetry(async () => {
        return this.makeRequest(`${this.baseUrl}/api/kyc/${token}/send-otp`, {
          phoneNumber,
        });
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send OTP";

      // Handle specific error cases
      if (
        errorMessage.toLowerCase().includes("rate limit") ||
        errorMessage.toLowerCase().includes("too many")
      ) {
        return {
          success: false,
          message: "Too many OTP requests. Please wait before trying again.",
        };
      }

      if (errorMessage.toLowerCase().includes("invalid phone")) {
        return {
          success: false,
          message: "Invalid phone number format. Please check and try again.",
        };
      }

      return {
        success: false,
        message:
          errorMessage.includes("Network") || errorMessage.includes("fetch")
            ? "Network error. Please check your connection and try again."
            : errorMessage,
      };
    }
  }

  /**
   * Verify OTP with enhanced error handling
   */
  static async verifyOTP(
    phoneNumber: string,
    otp: string,
    token: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Input validation
      if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        return {
          success: false,
          message: "Please enter a valid 6-digit OTP",
        };
      }

      const result = await this.withRetry(
        async () => {
          return this.makeRequest(
            `${this.baseUrl}/api/kyc/${token}/verify-otp`,
            {
              phoneNumber,
              otpCode: otp,
            }
          );
        },
        {
          maxRetries: 1, // Don't retry OTP verification to avoid account lockout
          retryDelay: 1000,
          backoffMultiplier: 1,
        }
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid OTP";

      // Handle specific error cases
      if (errorMessage.toLowerCase().includes("expired")) {
        return {
          success: false,
          message: "OTP has expired. Please request a new one.",
        };
      }

      if (
        errorMessage.toLowerCase().includes("invalid") ||
        errorMessage.toLowerCase().includes("incorrect")
      ) {
        return {
          success: false,
          message: "Invalid OTP. Please check and try again.",
        };
      }

      if (
        errorMessage.toLowerCase().includes("attempts") ||
        errorMessage.toLowerCase().includes("locked")
      ) {
        return {
          success: false,
          message: "Too many failed attempts. Please request a new OTP.",
        };
      }

      return {
        success: false,
        message:
          errorMessage.includes("Network") || errorMessage.includes("fetch")
            ? "Network error. Please check your connection and try again."
            : errorMessage,
      };
    }
  }

  /**
   * Resend OTP with rate limiting awareness
   */
  static async resendOTP(
    phoneNumber: string,
    token: string
  ): Promise<{ success: boolean; message: string; retryAfter?: number }> {
    try {
      const result = await this.sendOTP(phoneNumber, token);

      if (result.success) {
        return {
          ...result,
          message: "OTP resent successfully",
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to resend OTP",
      };
    }
  }

  /**
   * Check if phone number format is valid
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation for international phone numbers
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ""));
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return "";

    const cleaned = phoneNumber.replace(/\D/g, "");

    if (cleaned.startsWith("234")) {
      // Nigerian number format
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
        6,
        9
      )} ${cleaned.slice(9)}`;
    }

    // Generic international format
    return phoneNumber;
  }
}
