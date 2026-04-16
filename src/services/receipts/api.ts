import axiosInstance from "../axios-instance";

/**
 * Receipt response from the backend API
 * Matches the Receipt entity field names (snake_case from TypeORM)
 */
export interface ReceiptResponse {
  id: string;
  receipt_number: string;
  payment_id: string;
  offer_letter_id: string;
  property_id: string;
  kyc_application_id: string;
  token: string;
  pdf_url: string | null;
  receipt_date: string;
  amount_paid: number;
  payment_method: string | null;
  payment_reference: string;
  tenant_name: string;
  tenant_email: string | null;
  tenant_phone: string | null;
  property_name: string;
  property_address: string | null;
  invoice_number: string | null;
  notes: string | null;
  branding: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export const receiptsApi = {
  /**
   * Get all receipts for an offer letter
   * GET /receipts/by-offer/:offerLetterId
   * Requirements: 7.1
   */
  getByOfferLetterId: async (
    offerLetterId: string,
  ): Promise<ReceiptResponse[]> => {
    const response = await axiosInstance.get<ReceiptResponse[]>(
      `/receipts/by-offer/${offerLetterId}`,
    );
    return response.data;
  },

  /**
   * Get all receipts for a property
   * GET /receipts/by-property/:propertyId
   * Requirements: 7.2
   */
  getByPropertyId: async (propertyId: string): Promise<ReceiptResponse[]> => {
    const response = await axiosInstance.get<ReceiptResponse[]>(
      `/receipts/by-property/${propertyId}`,
    );
    return response.data;
  },

  /**
   * Get receipt PDF download URL
   * Returns the proxy URL for downloading the receipt PDF
   * Requirements: 7.4
   */
  getDownloadUrl: (receiptId: string): string => {
    return `/api/proxy/receipts/${receiptId}/download`;
  },

  /**
   * Track when a tenant views a receipt (public, fire-and-forget)
   */
  trackReceiptView: async (
    token: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosInstance.post(
        `/receipts/public/${token}/track-view`,
        { ipAddress },
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Failed to track receipt view:", error);
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
};
