export type NotificationStatus = "Pending" | "Completed";

export enum NotificationType {
  SERVICE_REQUEST = "Service Request",
  NOTICE_AGREEMENT = "Notice Agreement",
  RENT_CREATED = "Rent Created",
  USER_ADDED_TO_PROPERTY = "User Added to Property",
  USER_SIGNED_UP = "User Signed Up",
  LEASE_SIGNED = "Lease Signed",
  PROPERTY_CREATED = "Property Created",
  KYC_SUBMITTED = "KYC Submitted",
  TENANT_ATTACHED = "Tenant Attached",
  TENANCY_ENDED = "Tenancy Ended",
  OFFER_LETTER_GENERATED = "Offer Letter Generated",
  OFFER_LETTER_SENT = "Offer Letter Sent",
  OFFER_LETTER_ACCEPTED = "Offer Letter Accepted",
  OFFER_LETTER_REJECTED = "Offer Letter Rejected",
  PAYMENT_RECEIVED = "Payment Received",
  RENT_REMINDER = "Rent reminder",
  RENT_PAYMENT = "Rent payment",
  RENT_OVERDUE = "Rent overdue",
  MAINTENANCE_COMPLETED = "Maintenance completeed",
  RENEWAL_LINK_SENT = "Renewal Link Sent",
  RENEWAL_PAYMENT_RECEIVED = "Renewal Payment Received",
  RENEWAL_PAYMENT_MADE = "Renewal Payment Made",
  GENERAL = "General",
  OUTSTANDING_BALANCE_RECORDED = "Outstanding Balance Recorded",
  USER_ADDED_HISTORY = "User Added History",
}

export interface PropertyTenantSummary {
  id: string;
  tenant_id: string;
  status: string;
}

export interface PropertySummary {
  id: string;
  name: string;
  address: string;
  property_tenants?: PropertyTenantSummary[];
}

export interface ServiceRequestSummary {
  id: string;
  title: string;
  status: string;
}

export interface Notification {
  id: string;
  date: Date;
  type: NotificationType;
  description: string;
  status: NotificationStatus;
  property_id: string;
  user_id: string;
  service_request_id?: string | null;
  property?: PropertySummary;
  serviceRequest?: ServiceRequestSummary | null;
  tenant_id?: string;
}
