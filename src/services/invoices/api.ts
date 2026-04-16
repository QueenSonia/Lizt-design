import axiosInstance from "../axios-instance";

export interface InvoiceLineItem {
  description: string;
  amount: number;
}

export interface InvoicePaymentHistory {
  id: string;
  amount: number;
  paidAt: string;
  reference: string;
  paymentMethod: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyName: string;
  propertyId: string;
  invoiceDate: string;
  status: "pending" | "partially_paid" | "paid" | "overdue" | "cancelled";
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  lastPaymentDate: string | null;
  offerLetterToken: string | null;
  lineItems: InvoiceLineItem[];
  paymentHistory: InvoicePaymentHistory[];
  notes?: string;
  propertyAddress?: string;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateInvoiceDto {
  tenantId?: string;
  kycApplicationId?: string;
  propertyId: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
}

export const invoiceApi = {
  /**
   * Get all invoices for landlord
   */
  getInvoices: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<InvoiceListResponse> => {
    const response = await axiosInstance.get("/invoices", { params });
    return response.data;
  },

  /**
   * Get actionable invoices (pending or partially paid)
   */
  getActionableInvoices: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<InvoiceListResponse> => {
    const response = await axiosInstance.get("/invoices/actionable", {
      params,
    });
    return response.data;
  },

  /**
   * Get single invoice by ID
   */
  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await axiosInstance.get(`/invoices/${id}`);
    return response.data;
  },

  /**
   * Create new invoice
   */
  createInvoice: async (data: CreateInvoiceDto): Promise<Invoice> => {
    const response = await axiosInstance.post("/invoices", data);
    return response.data;
  },

  /**
   * Generate invoice from offer letter
   */
  generateFromOfferLetter: async (offerLetterId: string): Promise<Invoice> => {
    const response = await axiosInstance.post(
      `/invoices/from-offer/${offerLetterId}`,
    );
    return response.data;
  },

  /**
   * Update invoice
   */
  updateInvoice: async (
    id: string,
    data: Partial<CreateInvoiceDto>,
  ): Promise<Invoice> => {
    const response = await axiosInstance.put(`/invoices/${id}`, data);
    return response.data;
  },

  /**
   * Cancel invoice
   */
  cancelInvoice: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/invoices/${id}`);
    return response.data;
  },

  /**
   * Send payment reminder via WhatsApp
   */
  sendReminder: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.post(`/invoices/${id}/send-reminder`);
    return response.data;
  },

  /**
   * Get invoice by offer letter ID
   */
  getInvoiceByOfferLetterId: async (offerLetterId: string): Promise<Invoice | null> => {
    try {
      const response = await axiosInstance.get<Invoice>(
        `/invoices/by-offer/${offerLetterId}`,
      );
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Get invoice PDF download URL (via proxy)
   */
  getInvoicePdfUrl: (id: string): string => {
    return `/api/proxy/invoices/${id}/pdf`;
  },

  /**
   * Track when a tenant views an invoice (public, fire-and-forget)
   */
  trackInvoiceView: async (
    token: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosInstance.post(
        `/invoices/public/${token}/track-view`,
        { ipAddress },
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Failed to track invoice view:", error);
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
