import axiosInstance from "../axios-instance";
import { ErrorHandler, ApiError } from "../../utils/error-handling";

/**
 * Terms of Tenancy interface
 * Matches backend TermsOfTenancy and TermsOfTenancyDto
 */
export interface TermsOfTenancy {
  title: string;
  content: string;
}

/**
 * Rent frequency options
 * Matches backend RentFrequency enum
 */
export type RentFrequency =
  | "Monthly"
  | "Quarterly"
  | "Bi-Annually"
  | "Annually";

/**
 * Offer letter status
 * Matches backend OfferLetterStatus enum
 */
export type OfferLetterStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "selected"
  | "rejected_by_payment"
  | "payment_held_race_condition";

/**
 * Payment status
 * Matches backend PaymentStatus enum
 */
export type PaymentStatus = "unpaid" | "partial" | "fully_paid";

/**
 * Content snapshot for offer letter
 */
export interface ContentSnapshot {
  offer_title: string;
  intro_text: string;
  agreement_text: string;
  closing_text: string;
  for_landlord_text: string;
  tenant_address: string;
  permitted_use: string;
  rent_amount_formatted?: string;
  service_charge_formatted?: string;
  caution_deposit_formatted?: string;
  legal_fee_formatted?: string;
  agency_fee_formatted?: string;
  tenancy_term?: string;
  tenancy_period?: string;
}

/**
 * Create Offer Letter Request
 * Matches backend CreateOfferLetterDto exactly
 * Requirements: 10.1
 */
export interface CreateOfferLetterRequest {
  kycApplicationId: string;
  propertyId: string;
  rentAmount: number;
  rentFrequency: RentFrequency;
  serviceCharge?: number;
  tenancyStartDate: string; // Format: YYYY-MM-DD
  tenancyEndDate: string; // Format: YYYY-MM-DD
  cautionDeposit?: number;
  legalFee?: number;
  agencyFee?: number;
  termsOfTenancy: TermsOfTenancy[];
  contentSnapshot?: ContentSnapshot;
  sendNotification?: boolean; // If true, send WhatsApp notification immediately
}

/**
 * Branding data for offer letters
 * Matches backend BrandingData interface
 */
export interface BrandingData {
  businessName: string;
  businessAddress: string;
  contactPhone?: string;
  contactEmail?: string;
  websiteLink?: string;
  footerColor: string;
  letterhead?: string;
  signature?: string;
  headingFont: string;
  bodyFont: string;
  updatedAt?: string;
}

/**
 * Offer Letter Response
 * Matches backend OfferLetterResponse interface exactly
 * Requirements: 10.2
 */
export interface OfferLetterResponse {
  id: string;
  token: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantGender?: string;
  propertyName: string;
  propertyAddress: string;
  rentAmount: number;
  rentFrequency: string;
  serviceCharge?: number;
  tenancyStartDate: string; // Format: YYYY-MM-DD
  tenancyEndDate: string; // Format: YYYY-MM-DD
  cautionDeposit?: number;
  legalFee?: number;
  agencyFee?: number;
  status: OfferLetterStatus;
  termsOfTenancy: TermsOfTenancy[];
  createdAt: string; // ISO date string
  sentAt?: string; // ISO date string - when offer was sent to tenant
  branding?: BrandingData;
  // Payment-related fields (Task 2.2)
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: PaymentStatus;
  isPropertyAvailable: boolean;
  tenantAddress?: string;
  contentSnapshot?: ContentSnapshot;
  // Acceptance tracking fields
  acceptedAt?: string;
  acceptedByPhone?: string;
  acceptanceOtp?: string;
  acceptedByName?: string;
}

/**
 * Acceptance Initiation Response
 * Matches backend AcceptanceInitiationResponse interface
 * Requirements: 10.5
 */
export interface AcceptanceInitiationResponse {
  message: string;
  phoneLastFour: string;
}

/**
 * Verify OTP Request
 * Matches backend VerifyOfferOtpDto
 * Requirements: 10.6
 */
export interface VerifyOtpRequest {
  otp: string;
  ipAddress?: string;
}

/**
 * Offer Letter API Service
 * Provides all API methods for offer letter operations
 * Requirements: 10.1-10.7
 */
export const offerLetterApi = {
  /**
   * Create and send an offer letter
   * POST /offer-letters
   * Requirements: 10.1
   */
  createOfferLetter: async (
    data: CreateOfferLetterRequest,
  ): Promise<OfferLetterResponse> => {
    try {
      const response = await axiosInstance.post<OfferLetterResponse>(
        "/offer-letters",
        data,
      );
      return response.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Send offer letter notification via WhatsApp
   * POST /offer-letters/:id/send
   * Requirements: 7.1, 7.2
   */
  sendOfferLetter: async (
    offerId: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosInstance.post<{
        success: boolean;
        message: string;
      }>(`/offer-letters/${offerId}/send`);
      return response.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Check if offer letter exists for KYC application and property
   * GET /offer-letters/check/:kycApplicationId/:propertyId
   */
  checkExistingOffer: async (
    kycApplicationId: string,
    propertyId: string,
  ): Promise<OfferLetterResponse | null> => {
    try {
      const response = await axiosInstance.get<OfferLetterResponse>(
        `/offer-letters/check/${kycApplicationId}/${propertyId}`,
      );
      return response.data;
    } catch (error: unknown) {
      // Return null if not found (404) instead of throwing
      const err = error as ApiError;
      if (err.response?.status === 404 || err.response?.status === 204) {
        return null;
      }
      const errorResult = ErrorHandler.handleApiError(err, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Get offer letter by token (public endpoint)
   * GET /offer-letters/:token
   * Requirements: 10.2
   */
  getOfferLetterByToken: async (
    token: string,
  ): Promise<OfferLetterResponse> => {
    try {
      const response = await axiosInstance.get<OfferLetterResponse>(
        `/offer-letters/${token}`,
      );
      return response.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Get PDF download URL for an offer letter
   * Returns the URL string for the PDF endpoint
   * Requirements: 10.3
   */
  getOfferLetterPdfUrl: (token: string): string => {
    // Use the proxy base URL for PDF download
    return `/api/proxy/offer-letters/${token}/pdf`;
  },

  /**
   * Initiate acceptance process (sends OTP via WhatsApp)
   * POST /offer-letters/:token/accept
   * Requirements: 10.5
   */
  initiateAcceptance: async (
    token: string,
  ): Promise<AcceptanceInitiationResponse> => {
    try {
      const response = await axiosInstance.post<AcceptanceInitiationResponse>(
        `/offer-letters/${token}/accept`,
      );
      return response.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Verify OTP and complete acceptance
   * POST /offer-letters/:token/verify-otp
   * Requirements: 10.6
   */
  verifyOtpAndAccept: async (
    token: string,
    otp: string,
    ipAddress?: string,
  ): Promise<OfferLetterResponse> => {
    try {
      const response = await axiosInstance.post<OfferLetterResponse>(
        `/offer-letters/${token}/verify-otp`,
        { otp, ipAddress } as VerifyOtpRequest,
      );
      return response.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Reject an offer letter
   * POST /offer-letters/:token/reject
   * Requirements: 10.7
   */
  rejectOfferLetter: async (
    token: string,
    ipAddress?: string,
  ): Promise<OfferLetterResponse> => {
    try {
      const response = await axiosInstance.post<OfferLetterResponse>(
        `/offer-letters/${token}/reject`,
        { ipAddress },
      );
      return response.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Track when a user opens the offer letter
   * Records timestamp and IP address
   */
  trackOfferOpen: async (
    token: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosInstance.post(
        `/offer-letters/${token}/track-open`,
        { ipAddress },
      );
      return response.data;
    } catch (error: unknown) {
      // Silently fail - tracking shouldn't block the user experience
      console.error("Failed to track offer letter open:", error);
      return { success: false, message: "Tracking failed" };
    }
  },

  /**
   * Get user's IP address from a public API
   */
  getUserIP: async (): Promise<string | undefined> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Failed to get user IP:", error);
      return undefined;
    }
  },

  /**
   * Get offer letter tracking history (landlord only)
   */
  getOfferLetterHistory: async (
    offerId: string,
  ): Promise<
    Array<{
      id: string;
      eventType: string;
      eventDescription: string;
      createdAt: string;
    }>
  > => {
    try {
      const response = await axiosInstance.get(
        `/offer-letters/${offerId}/history`,
      );
      return response.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },
};

export default offerLetterApi;
