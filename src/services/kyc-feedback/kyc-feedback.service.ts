import axiosInstance from "../axios-instance";

export interface CreateFeedbackDto {
  rating: number;
  comment?: string;
  tenant_email?: string;
  tenant_name?: string;
  landlord_id?: string;
  property_name?: string;
}

export interface FeedbackStatistics {
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentFeedbacks: Array<{
    id: string;
    rating: number;
    comment: string;
    tenant_name: string;
    tenant_email: string;
    property_name: string;
    submitted_at: string;
  }>;
}

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string;
  tenant_name: string;
  tenant_email: string;
  property_name: string;
  submitted_at: string;
}

class KycFeedbackService {
  async submitFeedback(
    data: CreateFeedbackDto
  ): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.post("/kyc-feedback", data);
    return response.data;
  }

  async getFeedbacks(): Promise<{ data: FeedbackItem[] }> {
    const response = await axiosInstance.get("/kyc-feedback");
    return response.data;
  }

  async getStatistics(): Promise<FeedbackStatistics> {
    const response = await axiosInstance.get("/kyc-feedback/statistics");
    return response.data;
  }

  async getAdminStatistics(): Promise<FeedbackStatistics> {
    const response = await axiosInstance.get("/kyc-feedback/admin/statistics");
    return response.data;
  }
}

export const kycFeedbackService = new KycFeedbackService();
