import axiosInstance from "../axios-instance";
import { ErrorHandler, ApiError } from "../../utils/error-handling";

/**
 * Renewal Invoice Response
 * Matches backend RenewalInvoiceDto
 * Requirements: 4.1-4.7
 */
export interface RenewalInvoiceResponse {
  id: string;
  token: string;
  propertyName: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  renewalPeriod: {
    startDate: string;
    endDate: string;
  };
  charges: {
    rentAmount: number;
    serviceCharge: number;
    legalFee: number;
    otherCharges: number;
  };
  totalAmount: number;
  outstandingBalance: number;
  /** Signed wallet balance at invoice creation. positive = credit applied (reduced total), negative = debt added (increased total) */
  walletBalance: number;
  tokenType?: 'landlord' | 'tenant';
  paymentStatus: "unpaid" | "paid" | "partial" | "pending_approval";
  pendingApproval?: boolean;
  approvalStatus?: 'approved' | 'declined' | null;
  paidAt?: string;
  paymentReference?: string;
  landlordBranding?: {
    businessName?: string;
    businessAddress?: string;
    contactPhone?: string;
    contactEmail?: string;
    websiteLink?: string;
    footerColor?: string;
    letterhead?: string;
    signature?: string;
    headingFont?: string;
    bodyFont?: string;
    updatedAt?: string;
  };
  landlordLogoUrl?: string;
}

/**
 * Initialize Payment Request
 * Requirements: 5.1, 5.5
 */
export interface InitializePaymentRequest {
  email: string;
  paymentOption?: string;
  amount?: number;
}

/**
 * Initialize Payment Response
 * Requirements: 5.1
 */
export interface InitializePaymentResponse {
  success: boolean;
  data: {
    accessCode: string;
    reference: string;
    authorizationUrl: string;
  };
}

/**
 * Verify Payment Request
 * Requirements: 5.3
 */
export interface VerifyPaymentRequest {
  reference: string;
}

/**
 * Verify Payment Response (Enhanced for Payment Success Flow)
 * Requirements: 5.3, 2.1, 3.1-3.6
 */
export interface VerifyPaymentResponse {
  success: boolean;
  data: {
    status: "success" | "failed" | "pending";
    reference: string;
    amount: number;
    paidAt?: string;
  };
  receiptToken?: string;
  whatsappDelivery?: {
    sent: boolean;
    messageId?: string;
    error?: string;
  };
}

/**
 * Payment Success Page Data
 * Requirements: 1.1-1.7
 */
export interface PaymentSuccessData {
  invoiceToken: string;
  receiptToken: string;
  invoice: RenewalInvoiceResponse;
  paymentReference: string;
  paidAt: string;
}

/**
 * Renewal Receipt Data
 * Requirements: 4.1-4.8, 5.1-5.6
 */
export interface RenewalReceiptData {
  receiptNumber: string;
  receiptDate: string;
  transactionReference: string;

  // Tenant Information
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;

  // Property Information
  propertyName: string;
  propertyAddress: string;

  // Payment Breakdown
  charges: {
    rentAmount: number;
    serviceCharge?: number;
    legalFee?: number;
    otherCharges?: number;
  };
  totalAmount: number;
  /** Signed wallet balance at invoice creation. positive = credit applied, negative = previous outstanding added */
  walletBalance?: number;
  /** Actual amount paid — may differ from totalAmount for partial payments */
  amountPaid?: number | null;

  // Payment Details
  paymentDate: string;
  paymentMethod?: string;

  // Branding
  landlordBranding?: {
    businessName?: string;
    businessAddress?: string;
    contactPhone?: string;
    contactEmail?: string;
    websiteLink?: string;
    footerColor?: string;
    letterhead?: string;
    signature?: string;
    headingFont?: string;
    bodyFont?: string;
    updatedAt?: string;
  };
  landlordLogoUrl?: string;
}

/**
 * A single wallet ledger entry for the invoice breakdown modal
 */
export interface WalletHistoryEntry {
  id: string;
  date: string;
  description: string;
  balanceChange: number;
  balanceAfter: number;
}

/**
 * WhatsApp Receipt Message Template
 * Requirements: 3.1-3.6
 */
export interface WhatsAppReceiptRequest {
  tenantPhone: string;
  tenantName: string;
  propertyName: string;
  receiptUrl: string;
  paymentAmount: number;
}

/**
 * WhatsApp Receipt Response
 * Requirements: 3.1-3.6
 */
export interface WhatsAppReceiptResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Renewal Invoice API Service
 * Provides all API methods for renewal invoice operations
 * Requirements: 3.1-3.7, 4.1-4.7
 */
export const renewalInvoiceApi = {
  /**
   * Get renewal invoice by database ID (authenticated, for landlord dashboard)
   * GET /tenancies/renewal-invoice/by-id/:id
   */
  getRenewalInvoiceById: async (
    id: string,
  ): Promise<RenewalInvoiceResponse> => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: RenewalInvoiceResponse;
      }>(`/tenancies/renewal-invoice/by-id/${id}`);
      return response.data.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Get renewal invoice by token (public endpoint)
   * GET /tenancies/renewal-invoice/:token
   * Requirements: 4.1-4.7
   */
  getRenewalInvoiceByToken: async (
    token: string,
  ): Promise<RenewalInvoiceResponse> => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: RenewalInvoiceResponse;
      }>(`/tenancies/renewal-invoice/${token}`);
      return response.data.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Initialize payment for renewal invoice
   * POST /tenancies/renewal-invoice/:token/initialize-payment
   * Requirements: 5.1, 5.5
   */
  initializePayment: async (
    token: string,
    request: InitializePaymentRequest,
  ): Promise<InitializePaymentResponse> => {
    try {
      const response = await axiosInstance.post<{
        success: boolean;
        data: InitializePaymentResponse;
      }>(`/tenancies/renewal-invoice/${token}/initialize-payment`, request);
      return response.data.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Verify payment for renewal invoice
   * POST /tenancies/renewal-invoice/:token/verify-payment
   * Requirements: 5.3
   */
  verifyPayment: async (
    token: string,
    reference: string,
  ): Promise<VerifyPaymentResponse> => {
    try {
      const response = await axiosInstance.post<{
        success: boolean;
        data: VerifyPaymentResponse;
      }>(`/tenancies/renewal-invoice/${token}/verify-payment`, {
        reference,
      } as VerifyPaymentRequest);
      return response.data.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Download PDF invoice
   * GET /tenancies/renewal-invoice/:token/download
   * Requirements: 9.1, 9.2, 9.5
   */
  downloadInvoice: async (token: string): Promise<Blob> => {
    try {
      const response = await axiosInstance.get(
        `/tenancies/renewal-invoice/${token}/download`,
        {
          responseType: "blob",
        },
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
   * Get payment success page data
   * GET /tenancies/renewal-invoice/:token/success-data
   * Requirements: 1.1-1.7
   */
  getPaymentSuccessData: async (token: string): Promise<PaymentSuccessData> => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: PaymentSuccessData;
      }>(`/tenancies/renewal-invoice/${token}/success-data`);
      return response.data.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Get renewal receipt data by token
   * GET /tenancies/renewal-receipt/:token
   * Requirements: 4.1-4.8, 8.1-8.3
   */
  getRenewalReceiptByToken: async (
    token: string,
  ): Promise<RenewalReceiptData> => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: RenewalReceiptData;
      }>(`/tenancies/renewal-receipt/${token}`);
      return response.data.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
    }
  },

  /**
   * Download renewal receipt PDF
   * GET /tenancies/renewal-receipt/:token/download
   * Requirements: 6.1-6.4
   */
  downloadRenewalReceipt: async (token: string): Promise<Blob> => {
    try {
      const response = await axiosInstance.get(
        `/tenancies/renewal-receipt/${token}/download`,
        {
          responseType: "blob",
        },
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
   * Get wallet ledger history for a renewal invoice
   * GET /tenancies/renewal-invoice/:token/wallet-history
   */
  getWalletHistory: async (token: string): Promise<WalletHistoryEntry[]> => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: WalletHistoryEntry[];
      }>(`/tenancies/renewal-invoice/${token}/wallet-history`);
      return response.data.data;
    } catch (error) {
      const errorResult = ErrorHandler.handleApiError(error as ApiError, {
        showToast: false,
        logError: true,
      });
      throw new Error(errorResult.message);
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
};

export default renewalInvoiceApi;
