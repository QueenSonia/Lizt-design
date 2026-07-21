/**
 * Realistic mock property-history timelines, used as a fallback whenever a property's real
 * `history` array (from the backend) is empty — so the Property History tab always has
 * something meaningful to show while designing/reviewing the UI.
 */

export type PropertyHistoryCategory =
  | "Property"
  | "Tenant"
  | "Tenancy"
  | "Payment"
  | "Maintenance"
  | "Document"
  | "KYC";

export interface MockPropertyHistoryEvent {
  id: string;
  title: string;
  description: string;
  /** ISO timestamp */
  date: string;
  category: PropertyHistoryCategory;
  /** Who or what performed the action, e.g. "David Johnson (Facility Manager)" or "Property Manager" */
  actor?: string;
}

const CATEGORY_BADGE_STYLES: Record<PropertyHistoryCategory, string> = {
  Property: "bg-gray-100 text-gray-700",
  Tenant: "bg-blue-50 text-blue-700",
  Tenancy: "bg-purple-50 text-purple-700",
  Payment: "bg-green-50 text-green-700",
  Maintenance: "bg-amber-50 text-amber-700",
  Document: "bg-indigo-50 text-indigo-700",
  KYC: "bg-pink-50 text-pink-700",
};

export function categoryBadgeClass(category: PropertyHistoryCategory): string {
  return CATEGORY_BADGE_STYLES[category];
}

/**
 * Builds a mock timeline for the given property, anchored to "today" so a "Today" group is
 * always present. Reuses the app's established mock continuity: property "Lekki Phase 1 Duplex"
 * (p-001), tenant "James Okafor", landlord "Michael Adeyemi", facility manager "David Johnson".
 */
export function buildMockPropertyHistory(): MockPropertyHistoryEvent[] {
  const now = new Date();
  const iso = (daysAgo: number, hour: number, minute: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: "ph-1",
      title: "Tenant Submitted Maintenance Request",
      description: "James Okafor reported a leaking kitchen sink.",
      date: iso(0, 10, 42),
      category: "Maintenance",
      actor: "James Okafor (Tenant)",
    },
    {
      id: "ph-2",
      title: "Rent Invoice Generated",
      description: "Annual rent invoice of ₦3,500,000 was generated for James Okafor.",
      date: iso(0, 9, 15),
      category: "Payment",
      actor: "System",
    },
    {
      id: "ph-3",
      title: "Maintenance Request Closed",
      description: "Kitchen sink repair was completed and the request was marked as resolved.",
      date: iso(6, 16, 18),
      category: "Maintenance",
      actor: "David Johnson (Facility Manager)",
    },
    {
      id: "ph-4",
      title: "Payment Received",
      description: "Partial rent payment of ₦1,750,000 received via bank transfer.",
      date: iso(14, 13, 5),
      category: "Payment",
      actor: "System",
    },
    {
      id: "ph-5",
      title: "Facility Manager Assigned",
      description: "David Johnson was assigned as the facility manager for this property.",
      date: iso(20, 8, 50),
      category: "Property",
      actor: "Property Manager",
    },
    {
      id: "ph-6",
      title: "Tenancy Started",
      description: "James Okafor's annual tenancy commenced.",
      date: iso(202, 9, 0),
      category: "Tenancy",
      actor: "Rent: ₦3,500,000",
    },
    {
      id: "ph-7",
      title: "Tenancy Agreement Uploaded",
      description: "The signed tenancy agreement was uploaded to the property.",
      date: iso(213, 14, 14),
      category: "Document",
      actor: "James Okafor (Tenant)",
    },
    {
      id: "ph-8",
      title: "Tenant KYC Approved",
      description: "James Okafor successfully completed KYC verification.",
      date: iso(215, 11, 36),
      category: "KYC",
      actor: "Property Manager",
    },
    {
      id: "ph-9",
      title: "Tenant KYC Submitted",
      description: "James Okafor submitted his KYC application for review.",
      date: iso(216, 17, 2),
      category: "KYC",
      actor: "James Okafor (Tenant)",
    },
    {
      id: "ph-10",
      title: "Tenant Assigned",
      description: "James Okafor was assigned to this property.",
      date: iso(218, 15, 42),
      category: "Tenant",
      actor: "Property Manager",
    },
    {
      id: "ph-11",
      title: "Property Details Updated",
      description: "Rent amount and service charge were updated ahead of tenant assignment.",
      date: iso(220, 9, 30),
      category: "Property",
      actor: "Michael Adeyemi (Landlord)",
    },
    {
      id: "ph-12",
      title: "Property Added",
      description: "This property was created and added under Michael Adeyemi.",
      date: iso(223, 10, 11),
      category: "Property",
      actor: "Created by Property Manager",
    },
  ];
}
