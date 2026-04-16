import { useEffect, useRef } from "react";

interface KYCSubmissionData {
  propertyId: string;
  kycData: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
  };
  timestamp: string;
}

interface ServiceRequestCreatedData {
  propertyId: string;
  serviceRequestData: {
    serviceRequestId?: string;
    description?: string;
    tenantName?: string;
  };
  timestamp: string;
}

interface OfferLetterEventData {
  propertyId: string;
  propertyName: string;
  applicantName: string;
  token: string;
  timestamp: string;
}

interface ServiceRequestUpdatedData {
  propertyId: string;
  serviceRequestData: {
    serviceRequestId?: string;
    description?: string;
    tenantName?: string;
    propertyName?: string;
    status?: string;
    previousStatus?: string;
  };
  timestamp: string;
}

interface TenancyRenewedData {
  propertyId: string;
  propertyName: string;
  tenantName: string;
  rentAmount: number;
  paymentFrequency: string;
  startDate: string;
  endDate: string;
  timestamp: string;
}

interface HistoryAddedData {
  propertyId: string;
  propertyName: string;
  tenantName: string;
  displayType: string;
  description: string;
  timestamp: string;
}

export interface WhatsAppNotificationData {
  type: string;
  recipientName: string;
  success: boolean;
  error?: string;
  attempts: number;
  isRetry: boolean;
  timestamp: string;
}

interface UseWebSocketOptions {
  onKYCSubmitted?: (data: KYCSubmissionData) => void;
  onServiceRequestCreated?: (data: ServiceRequestCreatedData) => void;
  onServiceRequestUpdated?: (data: ServiceRequestUpdatedData) => void;
  onOfferLetterSent?: (data: OfferLetterEventData) => void;
  onOfferLetterAccepted?: (data: OfferLetterEventData) => void;
  onOfferLetterRejected?: (data: OfferLetterEventData) => void;
  onPaymentReceived?: (data: Record<string, unknown>) => void;
  onTenancyRenewed?: (data: TenancyRenewedData) => void;
  onHistoryAdded?: (data: HistoryAddedData) => void;
  onWhatsAppNotification?: (data: WhatsAppNotificationData) => void;
  onReconnect?: () => void;
  propertyId?: string;
  landlordId?: string;
  enabled?: boolean;
}

// Mock WebSocket hook — no real connection; returns null socket.
// Emit mock events here if needed for design/demo purposes.
export function useWebSocket(_options: UseWebSocketOptions) {
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return null;
}
