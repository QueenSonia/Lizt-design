/**
 * API Configuration Utility
 * Centralized configuration for API endpoints
 */

// Helper to ensure proper URL construction
const normalizeBaseUrl = (url: string): string => {
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

export const API_CONFIG = {
  baseUrl: normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3150",
  ),

  // KYC endpoints
  kyc: {
    validate: (token: string) =>
      `${API_CONFIG.baseUrl}/api/kyc/${token}/validate`,
    submit: () => `${API_CONFIG.baseUrl}/api/kyc/submit`,
    submitPropertyAddition: () =>
      `${API_CONFIG.baseUrl}/api/kyc/submit-property-addition`,
    sendOtp: (token: string) =>
      `${API_CONFIG.baseUrl}/api/kyc/${token}/send-otp`,
    verifyOtp: (token: string) =>
      `${API_CONFIG.baseUrl}/api/kyc/${token}/verify-otp`,
  },

  // Other API endpoints can be added here as needed
} as const;

/**
 * Helper function to get the full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.baseUrl;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${baseUrl}${cleanEndpoint}`;
};

export default API_CONFIG;
