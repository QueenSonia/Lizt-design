import axiosInstance from "@/services/axios-instance";
import { CreateTenancyDto, Tenancy, RenewTenancyDto } from "@/types/tenancy";
import {
  retryWithBackoff,
  DEFAULT_RETRY_CONFIG,
} from "@/utilities/errorHandling";

// Property history entry interface
interface CreatePropertyHistoryEntryDto {
  propertyId: string;
  eventType: string;
  title: string;
  description: string;
  details?: string;
}

// Enhanced retry configuration for tenancy operations
const TENANCY_RETRY_CONFIG = {
  ...DEFAULT_RETRY_CONFIG,
  maxRetries: 2, // Reduced for tenancy operations to avoid long waits
  timeoutMs: 45000, // 45 seconds for tenancy operations
};

export const createTenancy = async (
  tenancyData: CreateTenancyDto
): Promise<Tenancy> => {
  return retryWithBackoff(
    async () => {
      const response = await axiosInstance.post("/tenancies", tenancyData);
      return response.data;
    },
    "createTenancy",
    TENANCY_RETRY_CONFIG
  );
};

export const renewTenancy = async (
  propertyTenantId: string,
  renewalData: RenewTenancyDto
): Promise<Tenancy> => {
  return retryWithBackoff(
    async () => {
      try {
        // Add request metadata for better debugging
        const requestMetadata = {
          propertyTenantId,
          renewalData,
          timestamp: new Date().toISOString(),
          requestId: `renewal_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        };

        console.log("Starting tenancy renewal request:", requestMetadata);

        const response = await axiosInstance.put(
          `/tenancies/${propertyTenantId}/renew`,
          renewalData,
          {
            // Add custom timeout for renewal operations
            timeout: TENANCY_RETRY_CONFIG.timeoutMs,
            headers: {
              "X-Request-ID": requestMetadata.requestId,
              "X-Operation": "tenancy-renewal",
            },
          }
        );

        console.log("Tenancy renewal successful:", {
          ...requestMetadata,
          responseStatus: response.status,
          responseData: response.data,
        });

        return response.data;
      } catch (error: unknown) {
        // Enhanced error handling with specific error scenarios
        const errorMetadata = {
          propertyTenantId,
          renewalData,
          timestamp: new Date().toISOString(),
          errorType: "unknown",
        };

        if (error && typeof error === "object" && "response" in error) {
          // Server responded with error status
          const axiosError = error as {
            response: {
              status: number;
              data?: { message?: string; error?: string; details?: unknown };
              headers?: Record<string, string>;
            };
            config?: { headers?: Record<string, string> };
          };

          const status = axiosError.response.status;
          const message =
            axiosError.response.data?.message ||
            axiosError.response.data?.error;
          const details = axiosError.response.data?.details;
          const requestId = axiosError.config?.headers?.["X-Request-ID"];

          errorMetadata.errorType = "http_error";

          // Enhanced error logging with request correlation
          console.error("Tenancy renewal HTTP error:", {
            ...errorMetadata,
            status,
            message,
            details,
            requestId,
            responseHeaders: axiosError.response.headers,
          });

          // Provide specific error messages based on status codes
          switch (status) {
            case 400:
              throw new Error(
                message ||
                  "Invalid tenancy renewal data provided. Please check your input and try again."
              );
            case 401:
              throw new Error(
                "Authentication failed. Please log in again and try again."
              );
            case 403:
              throw new Error(
                "You don't have permission to renew this tenancy. Please contact support if you believe this is an error."
              );
            case 404:
              throw new Error(
                "Tenancy not found. The tenancy may have been deleted or moved. Please refresh the page and try again."
              );
            case 409:
              throw new Error(
                message ||
                  "Tenancy renewal conflict. The tenancy may have been modified by another user. Please refresh and try again."
              );
            case 422:
              throw new Error(
                message ||
                  "Validation failed for tenancy renewal. Please verify all required fields are filled correctly."
              );
            case 429:
              throw new Error(
                "Too many requests. Please wait a moment and try again."
              );
            case 500:
              throw new Error(
                "Internal server error occurred while renewing tenancy. Please try again in a few moments."
              );
            case 502:
            case 503:
            case 504:
              throw new Error(
                "Service is temporarily unavailable. Please try again in a few moments."
              );
            default:
              throw new Error(
                message ||
                  `Server error (${status}) occurred while renewing tenancy. Please try again.`
              );
          }
        } else if (error && typeof error === "object" && "request" in error) {
          // Network error - no response received
          errorMetadata.errorType = "network_error";

          console.error("Network error during tenancy renewal:", errorMetadata);

          throw new Error(
            "Network connection failed. Please check your internet connection and try again."
          );
        } else if (error && typeof error === "object" && "code" in error) {
          // Handle specific error codes
          const errorCode = (error as { code?: string; isTimeout?: boolean })
            .code;
          const isTimeout = (error as { isTimeout?: boolean }).isTimeout;

          errorMetadata.errorType = "timeout_error";

          if (
            errorCode === "ECONNABORTED" ||
            errorCode === "TIMEOUT" ||
            isTimeout
          ) {
            console.error("Timeout error during tenancy renewal:", {
              ...errorMetadata,
              errorCode,
              isTimeout,
            });

            throw new Error(
              "Request timed out. The server is taking too long to respond. Please try again."
            );
          }

          if (errorCode === "NETWORK_ERROR") {
            throw new Error(
              "Network connection failed. Please check your internet connection and try again."
            );
          }
        }

        // Handle unexpected errors
        errorMetadata.errorType = "unexpected_error";

        console.error("Unexpected error during tenancy renewal:", {
          ...errorMetadata,
          error:
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                  name: error.name,
                }
              : String(error),
        });

        // Provide a user-friendly error message for unexpected errors
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during tenancy renewal. Please try again.";

        throw new Error(errorMessage);
      }
    },
    `renewTenancy(${propertyTenantId})`,
    TENANCY_RETRY_CONFIG
  );
};

export const createPropertyHistoryEntry = async (
  historyData: CreatePropertyHistoryEntryDto
): Promise<void> => {
  return retryWithBackoff(
    async () => {
      try {
        // Create a property history entry
        // Requirements: 4.2, 4.3, 4.4, 4.5 - Create history entry with proper timestamp and event type
        const historyEntry = {
          property_id: historyData.propertyId,
          event_type: historyData.eventType,
          title: historyData.title,
          description: historyData.description,
          details: historyData.details || null,
          date: new Date().toISOString(),
        };

        const requestMetadata = {
          propertyId: historyData.propertyId,
          eventType: historyData.eventType,
          timestamp: new Date().toISOString(),
          requestId: `history_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        };

        console.log("Creating property history entry:", requestMetadata);

        const response = await axiosInstance.post(
          "/property-history",
          historyEntry,
          {
            timeout: TENANCY_RETRY_CONFIG.timeoutMs,
            headers: {
              "X-Request-ID": requestMetadata.requestId,
              "X-Operation": "property-history-creation",
            },
          }
        );

        console.log("Property history entry created successfully:", {
          ...requestMetadata,
          responseStatus: response.status,
        });

        return response.data;
      } catch (error: unknown) {
        // Enhanced error handling for property history creation
        const errorMetadata = {
          propertyId: historyData.propertyId,
          eventType: historyData.eventType,
          timestamp: new Date().toISOString(),
          errorType: "unknown",
        };

        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as {
            response: {
              status: number;
              data?: { message?: string; error?: string; details?: unknown };
            };
          };
          const status = axiosError.response.status;
          const message =
            axiosError.response.data?.message ||
            axiosError.response.data?.error;

          errorMetadata.errorType = "http_error";

          console.error("Property history creation HTTP error:", {
            ...errorMetadata,
            status,
            message,
            historyData,
          });

          switch (status) {
            case 400:
              throw new Error(
                message ||
                  "Invalid property history data provided. Please check your input."
              );
            case 401:
              throw new Error("Authentication failed. Please log in again.");
            case 403:
              throw new Error(
                "You don't have permission to create property history entries."
              );
            case 404:
              throw new Error(
                "Property not found. The property may have been deleted."
              );
            case 422:
              throw new Error(
                message || "Validation failed for property history data."
              );
            case 500:
            case 502:
            case 503:
            case 504:
              throw new Error(
                "Server error occurred while creating property history entry. Please try again later."
              );
            default:
              throw new Error(
                message ||
                  `Server error (${status}) occurred while creating property history entry.`
              );
          }
        } else if (error && typeof error === "object" && "request" in error) {
          errorMetadata.errorType = "network_error";

          console.error(
            "Network error during property history creation:",
            errorMetadata
          );

          throw new Error(
            "Network error occurred. Please check your internet connection and try again."
          );
        } else if (error && typeof error === "object" && "code" in error) {
          const errorCode = (error as { code?: string; isTimeout?: boolean })
            .code;
          const isTimeout = (error as { isTimeout?: boolean }).isTimeout;

          if (
            errorCode === "ECONNABORTED" ||
            errorCode === "TIMEOUT" ||
            isTimeout
          ) {
            errorMetadata.errorType = "timeout_error";

            console.error("Timeout error during property history creation:", {
              ...errorMetadata,
              errorCode,
              isTimeout,
            });

            throw new Error(
              "Request timed out while creating property history entry. Please try again."
            );
          }
        }

        errorMetadata.errorType = "unexpected_error";

        console.error("Unexpected error during property history creation:", {
          ...errorMetadata,
          error:
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                  name: error.name,
                }
              : String(error),
        });

        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during property history creation";
        throw new Error(errorMessage);
      }
    },
    `createPropertyHistoryEntry(${historyData.propertyId})`,
    TENANCY_RETRY_CONFIG
  );
};
