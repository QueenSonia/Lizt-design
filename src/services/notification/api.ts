import { Notification, NotificationType, NotificationStatus } from "@/types/notification";

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    date: new Date(Date.now() - 1000 * 60 * 15),
    type: NotificationType.KYC_SUBMITTED,
    description: "James Okafor submitted a KYC application",
    status: "Pending",
    property_id: "prop-1",
    user_id: "user-1",
    tenant_id: "kyc-001",
    property: {
      id: "prop-1",
      name: "Lekki Heights",
      address: "12 Admiralty Way, Lekki",
      property_tenants: [{ id: "pt-1", tenant_id: "tenant-1", status: "active" }],
    },
  },
  {
    id: "notif-2",
    date: new Date(Date.now() - 1000 * 60 * 45),
    type: NotificationType.SERVICE_REQUEST,
    description: "Broken pipe in bathroom\nUrgent plumbing repair needed",
    status: "Pending",
    property_id: "prop-2",
    user_id: "user-2",
    tenant_id: "kyc-002",
    property: {
      id: "prop-2",
      name: "Ikoyi Residences",
      address: "5 Bourdillon Road, Ikoyi",
      property_tenants: [{ id: "pt-2", tenant_id: "tenant-2", status: "active" }],
    },
    serviceRequest: { id: "sr-1", title: "Broken pipe", status: "pending" },
  },
  {
    id: "notif-3",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2),
    type: NotificationType.OFFER_LETTER_ACCEPTED,
    description: "Amina Bello accepted the offer letter for Ikoyi Residences",
    status: "Completed",
    property_id: "prop-2",
    user_id: "user-3",
    tenant_id: "kyc-003",
    property: {
      id: "prop-2",
      name: "Ikoyi Residences",
      address: "5 Bourdillon Road, Ikoyi",
      property_tenants: [{ id: "pt-3", tenant_id: "tenant-3", status: "active" }],
    },
  },
  {
    id: "notif-4",
    date: new Date(Date.now() - 1000 * 60 * 60 * 5),
    type: NotificationType.RENT_REMINDER,
    description: "Rent reminder sent to Chukwuemeka Nwosu",
    status: "Completed",
    property_id: "prop-1",
    user_id: "user-4",
    tenant_id: "kyc-005",
    property: {
      id: "prop-1",
      name: "Lekki Heights",
      address: "12 Admiralty Way, Lekki",
      property_tenants: [{ id: "pt-4", tenant_id: "tenant-4", status: "active" }],
    },
  },
  {
    id: "notif-5",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    type: NotificationType.USER_ADDED_TO_PROPERTY,
    description: "Fatima Abdullahi was added to Victoria Garden City",
    status: "Completed",
    property_id: "prop-3",
    user_id: "user-5",
    tenant_id: "kyc-004",
    property: {
      id: "prop-3",
      name: "Victoria Garden City",
      address: "Block C, VGC, Lagos",
      property_tenants: [{ id: "pt-5", tenant_id: "tenant-5", status: "active" }],
    },
  },
  {
    id: "notif-6",
    date: new Date(Date.now() - 1000 * 60 * 60 * 26),
    type: NotificationType.PAYMENT_RECEIVED,
    description: "Rent payment received from Emeka Obi",
    status: "Completed",
    property_id: "prop-3",
    user_id: "user-6",
    tenant_id: "kyc-005",
    property: {
      id: "prop-3",
      name: "Victoria Garden City",
      address: "Block C, VGC, Lagos",
      property_tenants: [{ id: "pt-6", tenant_id: "tenant-6", status: "active" }],
    },
  },
];

export const getPropertyOverview = async ({
  pageParam = 1,
  limit = 20,
}: {
  pageParam: number;
  limit?: number;
}): Promise<{ notifications: Notification[]; total: number }> => {
  const start = (pageParam - 1) * limit;
  const end = start + limit;
  return {
    notifications: MOCK_NOTIFICATIONS.slice(start, end),
    total: MOCK_NOTIFICATIONS.length,
  };
};
