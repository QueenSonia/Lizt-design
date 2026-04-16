/**
 * API Testing Utility
 * Simple function to test API connectivity
 */

import { API_CONFIG } from "./api-config";

export const testApiConnection = async (): Promise<{
  success: boolean;
  message: string;
  baseUrl: string;
}> => {
  try {
    const testToken = "test-token";
    const url = API_CONFIG.kyc.validate(testToken);

    console.log("Testing API connection to:", url);

    const response = await fetch(url);

    return {
      success: response.ok,
      message: response.ok
        ? `API is reachable at ${API_CONFIG.baseUrl}`
        : `API returned status ${response.status}`,
      baseUrl: API_CONFIG.baseUrl,
    };
  } catch (error) {
    return {
      success: false,
      message: `API connection failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      baseUrl: API_CONFIG.baseUrl,
    };
  }
};

// Export for debugging purposes
export const getApiInfo = () => ({
  baseUrl: API_CONFIG.baseUrl,
  validateEndpoint: (token: string) => API_CONFIG.kyc.validate(token),
  submitEndpoint: () => API_CONFIG.kyc.submit(),
});
