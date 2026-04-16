import axiosInstance from "../axios-instance";
import { KYCFormData } from "../../schemas/kyc.schemas";
import { ErrorHandler, ApiError } from "../../utils/error-handling";

export interface PropertyKYCData {
  valid: boolean;
  landlordId?: string;
  vacantProperties?: Array<{
    id: string;
    name: string;
    location: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    description?: string;
    hasPendingKyc?: boolean;
  }>;
  message?: string;
}

export interface KYCSubmissionResponse {
  success: boolean;
  message: string;
  applicationId: string;
  status: string;
}

export interface KYCLinkResponse {
  token: string;
  link: string;
  expiresAt: string | null;
}

export interface KYCApplication {
  id: string;
  propertyId: string;
  status: "pending" | "pending_completion" | "approved" | "rejected";
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  contactAddress?: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  stateOfOrigin: string;
  localGovernmentArea: string;
  maritalStatus: string;
  religion?: string;
  employmentStatus: string;
  occupation: string;
  jobTitle: string;
  employerName?: string;
  employerAddress?: string;
  employerPhoneNumber?: string;
  lengthOfEmployment?: string;
  businessDuration?: string;
  monthlyNetIncome: string;
  reference1: {
    name: string;
    address?: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  };
  reference2?: {
    name: string;
    address?: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  };
  tenantOffer: {
    proposedRentAmount: string;
    rentPaymentFrequency: string;
    intendedUse?: string;
    numberOfOccupants?: string;
    parkingRequirements?: string;
    additionalNotes?: string;
  };
  documents?: {
    passportPhoto?: string;
    idDocument?: string;
    employmentProof?: string;
  };
  property?: {
    name: string;
    address: string;
    status?: string;
  };
  submissionDate: string;
  createdAt: string;
  updatedAt: string;
  // Offer letter data (if generated)
  offerLetter?: {
    id: string;
    token: string;
    status: string;
    rentAmount: number;
    rentFrequency: string;
    serviceCharge?: number;
    tenancyStartDate: string;
    tenancyEndDate: string;
    cautionDeposit?: number;
    legalFee?: number;
    agencyFee?: number;
    totalAmount?: number;
    amountPaid?: number;
    outstandingBalance?: number;
    paymentStatus?: string;
    acceptedAt?: string;
    acceptanceOtp?: string;
    acceptedByPhone?: string;
    sentAt?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  offerLetterStatus?: string;
  offerLetterCreatedAt?: string;
  offerStatus?: string;
  invoiceCreatedAt?: string;
  invoice?: {
    id: string;
    createdAt: string;
    status: string;
  };
  paymentDate?: string;
}

export interface TenancyDetails {
  rentAmount: number;
  rentFrequency: "monthly" | "quarterly" | "bi-annually" | "annually";
  tenancyStartDate?: string; // ISO date string
}

export interface AttachTenantResponse {
  success: boolean;
  message: string;
  data: {
    tenantId: string;
    propertyId: string;
  };
}

export class KYCService {
  /**
   * Validate KYC token and get property information
   */
  static async validateToken(token: string): Promise<PropertyKYCData> {
    try {
      const response = await axiosInstance.get(`/api/kyc/${token}/validate`);
      // The backend returns { success, message, data }, we need the data field
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return {
          valid: false,
          message: response.data.message || "Invalid token response",
        };
      }
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      return {
        valid: false,
        message: errorResult.message,
      };
    }
  }

  /**
   * Generate general KYC link for landlord (not tied to specific property)
   */
  static async generateGeneralKYCLink(): Promise<KYCLinkResponse> {
    const response = await axiosInstance.post(`/api/kyc-links/generate`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(
      response.data.message || "API response did not include a KYC token.",
    );
  }

  /**
   * Submit KYC application
   * SECURITY: Token in request body to prevent exposure in logs
   */
  static async submitApplication(
    token: string,
    formData: KYCFormData,
  ): Promise<KYCSubmissionResponse> {
    try {
      const response = await axiosInstance.post(`/api/kyc/submit`, {
        ...formData,
        kyc_token: token,
      });
      return response.data;
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      throw new Error(errorResult.message);
    }
  }

  /**
   * Get all KYC applications for the current landlord
   */
  static async getAllKycApplications(): Promise<KYCApplication[]> {
    try {
      const response = await axiosInstance.get("/api/kyc-applications");

      // Handle the backend response format: { success, applications }
      if (response.data.success && response.data.applications) {
        const applications = response.data.applications;
        return Array.isArray(applications) ? applications : [];
      }

      return [];
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      throw new Error(errorResult.message);
    }
  }

  /**
   * Get KYC applications for a property (landlord only)
   */
  static async getApplicationsByProperty(
    propertyId: string,
  ): Promise<KYCApplication[]> {
    try {
      const response = await axiosInstance.get(
        `/api/properties/${propertyId}/kyc-applications`,
      );

      // Handle the backend response format: { success, message, applications }
      if (response.data.success && response.data.applications) {
        const applications = response.data.applications;
        return Array.isArray(applications) ? applications : [];
      }

      // Fallback for other response formats
      const applications = response.data.applications || response.data || [];
      return Array.isArray(applications) ? applications : [];
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      throw new Error(errorResult.message);
    }
  }

  /**
   * Attach tenant to property from KYC application (landlord only)
   */
  static async attachTenantToProperty(
    applicationId: string,
    tenancyDetails: TenancyDetails,
  ): Promise<AttachTenantResponse> {
    try {
      const response = await axiosInstance.post(
        `/api/kyc-applications/${applicationId}/attach`,
        tenancyDetails,
      );
      return response.data;
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      throw new Error(errorResult.message);
    }
  }

  /**
   * Get KYC application statistics for a property
   */
  static async getApplicationStatistics(propertyId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    try {
      const response = await axiosInstance.get(
        `/api/properties/${propertyId}/kyc-applications/statistics`,
      );

      // Handle the backend response format: { success, statistics }
      if (response.data.success && response.data.statistics) {
        return response.data.statistics;
      }

      // Handle the backend response format: { success, message, data }
      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      // Fallback for direct data response
      return response.data;
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      throw new Error(errorResult.message);
    }
  }

  /**
   * Get KYC applications by tenant ID (landlord only)
   */
  static async getApplicationsByTenant(
    tenantId: string,
  ): Promise<KYCApplication[]> {
    try {
      const response = await axiosInstance.get(
        `/api/tenants/${tenantId}/kyc-applications`,
      );

      // Handle the backend response format: { success, message, applications }
      if (response.data.success && response.data.applications) {
        const applications = response.data.applications;
        return Array.isArray(applications) ? applications : [];
      }

      // Fallback for other response formats
      const applications = response.data.applications || response.data || [];
      return Array.isArray(applications) ? applications : [];
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      throw new Error(errorResult.message);
    }
  }

  /**
   * Get a specific KYC application by ID (landlord only)
   */
  static async getApplicationById(
    applicationId: string,
  ): Promise<KYCApplication> {
    try {
      const response = await axiosInstance.get(
        `/api/kyc-applications/${applicationId}`,
      );

      // Handle the backend response format: { success, message, application }
      if (response.data.success && response.data.application) {
        return response.data.application;
      }

      // Handle alternative format: { success, message, data }
      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      // Fallback for direct data response
      return response.data;
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      throw new Error(errorResult.message);
    }
  }

  /**
   * Fix existing data inconsistencies - admin/landlord only
   * This cleans up orphaned tenant assignments and property status issues
   */
  static async fixDataInconsistencies(): Promise<{
    success: boolean;
    message: string;
    cleanedUpTenants: number;
    cleanedUpProperties: number;
  }> {
    try {
      const response = await axiosInstance.post(
        `/api/kyc-applications/fix-data-inconsistencies`,
      );

      // Handle the backend response format: { success, message, data }
      if (response.data.success && response.data.data) {
        return {
          success: response.data.success,
          message: response.data.message,
          cleanedUpTenants: response.data.data.cleanedUpTenants,
          cleanedUpProperties: response.data.data.cleanedUpProperties,
        };
      }

      // Fallback for other response formats
      return {
        success: response.data.success || false,
        message: response.data.message || "Data cleanup completed",
        cleanedUpTenants: response.data.cleanedUpTenants || 0,
        cleanedUpProperties: response.data.cleanedUpProperties || 0,
      };
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      throw new Error(errorResult.message);
    }
  }

  /**
   * Check for any existing KYC record system-wide
   * Returns KYC data for autofill purposes regardless of landlord or status
   * SECURITY: Requires KYC verification JWT (issued after OTP verification)
   */
  static async checkExistingKYC(
    verificationToken: string,
    email?: string,
  ): Promise<{
    hasExisting: boolean;
    kycData?: KYCApplication;
    source?: "kyc_application" | "tenant_kyc";
  }> {
    try {
      const params: Record<string, string> = {};
      if (email) {
        params.email = email;
      }

      const response = await axiosInstance.get(`/api/kyc/check-existing`, {
        params,
        headers: {
          Authorization: `Bearer ${verificationToken}`,
        },
      });

      // Handle the backend response format: { success, hasExisting, kycData, source }
      if (response.data.success) {
        return {
          hasExisting: response.data.hasExisting,
          kycData: response.data.kycData,
          source: response.data.source,
        };
      }

      // Fallback for direct data response
      return response.data;
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      // If no existing KYC found (404), return hasExisting: false
      if (errorResult.errorCode === "NOT_FOUND") {
        return { hasExisting: false };
      }

      throw new Error(errorResult.message);
    }
  }

  /**
   * Check for pending completion KYC by phone number
   * Requirements: 4.4 - Check if phone number matches any pending completion KYC
   * SECURITY: Requires KYC verification JWT (issued after OTP verification)
   */
  static async checkPendingKYC(
    verificationToken: string,
    email?: string,
  ): Promise<{
    hasPending: boolean;
    kycData?: KYCApplication;
    propertyIds?: string[];
  }> {
    try {
      const params: Record<string, string> = {};
      if (email) {
        params.email = email;
      }

      const response = await axiosInstance.get(`/api/kyc/check-pending`, {
        params,
        headers: {
          Authorization: `Bearer ${verificationToken}`,
        },
      });

      // Handle the backend response format: { success, data }
      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      // Fallback for direct data response
      return response.data;
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      // If no pending KYC found (404), return hasPending: false
      if (errorResult.errorCode === "NOT_FOUND") {
        return { hasPending: false };
      }

      throw new Error(errorResult.message);
    }
  }

  /**
   * Complete a pending KYC application
   * Requirements: 5.1 - Update existing KYC with completion data
   * SECURITY: Requires KYC token, phone number, and OTP verification (all in body)
   */
  static async completePendingKYC(
    token: string,
    phoneNumber: string,
    otp: string,
    completionData: Partial<KYCFormData>,
  ): Promise<KYCSubmissionResponse> {
    try {
      const response = await axiosInstance.put(`/api/kyc/complete-pending`, {
        ...completionData,
        kyc_token: token,
        phone_number: phoneNumber,
        otp,
      });

      // Handle the backend response format: { success, message, application }
      if (response.data.success) {
        return {
          success: response.data.success,
          message: response.data.message,
          applicationId: response.data.application?.id,
          status: response.data.application?.status || "approved",
        };
      }

      // Fallback for other response formats
      return response.data;
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      throw new Error(errorResult.message);
    }
  }

  /**
   * Get KYC link token for a specific application (for resending)
   */
  static async getKYCTokenForApplication(
    applicationId: string,
  ): Promise<string> {
    try {
      const response = await axiosInstance.get(
        `/api/kyc-applications/${applicationId}/kyc-token`,
      );

      // Handle the backend response format: { success, token }
      if (response.data.success && response.data.token) {
        return response.data.token;
      }

      throw new Error("KYC token not found in response");
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      throw new Error(errorResult.message);
    }
  }

  /**
   * Resend KYC completion link for a specific application
   */
  static async resendKYCCompletionLink(
    applicationId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosInstance.post(
        `/api/kyc-applications/${applicationId}/resend-kyc`,
      );

      // Handle the backend response format: { success, message }
      if (response.data.success) {
        return response.data;
      }

      throw new Error(response.data.message || "Failed to resend KYC link");
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      throw new Error(errorResult.message);
    }
  }

  /**
   * Track when a user opens the KYC form
   * Records timestamp and IP address
   */
  static async trackFormOpen(
    token: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosInstance.post(
        `/api/kyc/${token}/track-open`,
        { ipAddress },
      );

      return response.data;
    } catch (error: unknown) {
      // Silently fail - tracking shouldn't block the user experience
      console.error("Failed to track form open:", error);
      return { success: false, message: "Tracking failed" };
    }
  }

  /**
   * Get user's IP address from a public API
   */
  static async getUserIP(): Promise<string | undefined> {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Failed to get user IP:", error);
      return undefined;
    }
  }

  /**
   * Get property history events for a KYC application
   */
  static async getApplicationHistory(applicationId: string): Promise<
    Array<{
      id: string;
      eventType: string;
      eventDescription: string;
      createdAt: string;
    }>
  > {
    try {
      const response = await axiosInstance.get(
        `/api/kyc-applications/${applicationId}/history`,
      );

      if (response.data.success && response.data.history) {
        return response.data.history;
      }

      return [];
    } catch (error: unknown) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });

      console.error(
        "Failed to fetch application history:",
        errorResult.message,
      );
      return [];
    }
  }
}
