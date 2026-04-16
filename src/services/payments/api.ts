import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3150";

/**
 * Payment API Service
 * Handles all payment-related API calls
 */

export interface InitiatePaymentDto {
  amount: number;
  email: string;
  callbackUrl: string;
}

export interface PaymentResponse {
  paymentId: string;
  paystackReference: string;
  accessCode: string;
  authorizationUrl: string;
}

export interface PaymentStatusResponse {
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: "unpaid" | "partial" | "fully_paid";
  paymentHistory: Array<{
    id: string;
    amount: number;
    status: string;
    paymentMethod?: string;
    paidAt?: string;
    reference: string;
    receiptToken?: string;
  }>;
  propertyStatus: string;
  isPropertyAvailable: boolean;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  paidAt?: string;
  reference: string;
  receiptToken?: string;
}

export interface LandlordPaymentsResponse {
  payments: Array<{
    id: string;
    offerLetterId: string;
    tenantName: string;
    tenantEmail: string;
    tenantPhone: string;
    propertyName: string;
    propertyId: string;
    totalAmount: number;
    amountPaid: number;
    outstandingBalance: number;
    paymentStatus: string;
    offerStatus: string;
    requiresRefund: boolean;
    lastPaymentDate?: string;
    paymentHistory: PaymentHistoryItem[];
  }>;
  refundsRequired: Array<{
    id: string;
    tenantName: string;
    propertyName: string;
    amountPaid: number;
    reason: string;
    offerStatus: string;
    tenantContact: string;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const paymentApi = {
  /**
   * Initiate payment for an offer letter
   * POST /offer-letters/:token/initiate-payment
   */
  initiatePayment: async (
    token: string,
    dto: InitiatePaymentDto,
  ): Promise<PaymentResponse> => {
    const response = await axios.post(
      `${API_BASE_URL}/offer-letters/${token}/initiate-payment`,
      dto,
      {
        timeout: 30000, // 30 second timeout
      },
    );
    return response.data;
  },

  /**
   * Get payment status for an offer letter
   * GET /offer-letters/:token/payment-status
   */
  getPaymentStatus: async (token: string): Promise<PaymentStatusResponse> => {
    const response = await axios.get(
      `${API_BASE_URL}/offer-letters/${token}/payment-status`,
    );
    return response.data;
  },

  /**
   * Verify payment directly with Paystack (Hybrid approach)
   * GET /payments/verify/:reference
   *
   * This provides immediate verification by checking Paystack directly
   * if the webhook hasn't processed the payment yet.
   */
  verifyPaymentWithPaystack: async (
    reference: string,
  ): Promise<{
    status: string;
    verified: boolean;
    alreadyProcessed: boolean;
    payment?: {
      id: string;
      amount: number;
      paidAt: string;
      paymentMethod: string;
    };
    message: string;
    error?: string;
  }> => {
    const response = await axios.get(
      `${API_BASE_URL}/payments/verify/${reference}`,
    );
    return response.data;
  },

  /**
   * Get all payments for landlord's properties
   * GET /payments/landlord
   */
  getLandlordPayments: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<LandlordPaymentsResponse> => {
    const response = await axios.get(`${API_BASE_URL}/payments/landlord`, {
      params,
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Track payment cancellation
   * POST /offer-letters/:token/payment-cancelled
   */
  trackPaymentCancelled: async (token: string): Promise<void> => {
    try {
      await axios.post(
        `${API_BASE_URL}/offer-letters/${token}/payment-cancelled`,
      );
    } catch {
      // Non-critical — don't block the user if tracking fails
    }
  },

  /**
   * Get payment details for a specific offer
   * GET /payments/:offerId
   */
  getPaymentByOfferId: async (
    offerId: string,
  ): Promise<PaymentStatusResponse> => {
    const response = await axios.get(`${API_BASE_URL}/payments/${offerId}`, {
      withCredentials: true,
    });
    return response.data;
  },
};
