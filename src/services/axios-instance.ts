// ============================================================
// DESIGN SANDBOX — MOCK AXIOS INSTANCE
// All service API calls are intercepted here and return mock data.
// No real network requests are made.
// ============================================================

import {
  mockProperties,
  mockPropertyDetails,
  mockTenantList,
  mockTenantDetail,
  mockDashboardAnalytics,
  mockServiceRequests,
  mockKYCApplications,
  mockLandlords,
  mockFacilityManagers,
  mockArtisans,
  mockNotifications,
  mockRents,
} from "@/mock/mockData";

// Simulate a small async delay so loading states are visible during design
const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

// Build a fake response that matches the shape axios returns
const ok = async (data: unknown, ms = 150) => {
  await delay(ms);
  return { data, status: 200, statusText: "OK", headers: {}, config: {} };
};

// Match a URL pattern, return handler result or null
function match(url: string, pattern: string | RegExp): boolean {
  if (typeof pattern === "string") return url === pattern || url.startsWith(pattern);
  return pattern.test(url);
}

// ---- Route table ----

async function handleGet(url: string, params?: Record<string, unknown>) {
  // Properties
  if (match(url, "properties/admin/dashboard")) {
    return ok(mockDashboardAnalytics);
  }
  if (match(url, "/properties/marketing-ready")) {
    return ok(mockProperties.filter((p) => p.is_marketing_ready));
  }
  if (match(url, /^\/properties\/vacant/)) {
    return ok(mockProperties.filter((p) => ["vacant", "offer_pending", "offer_accepted"].includes(p.property_status)));
  }
  if (match(url, /^\/properties\/scheduled-move-outs/)) {
    return ok([]);
  }
  if (match(url, /^\/properties\/sync/)) {
    return ok({ success: true });
  }
  if (match(url, /^\/properties\/([^/]+)\/details/)) {
    const id = url.split("/")[2];
    return ok(mockPropertyDetails[id] ?? mockPropertyDetails["prop-1"]);
  }
  if (match(url, /^\/properties\/([^/]+)\/history/)) {
    const detail = mockPropertyDetails["prop-1"] as any;
    return ok(detail.history);
  }
  if (match(url, /^\/properties\/([^/]+)\/service-requests/)) {
    return ok({ service_requests: mockServiceRequests });
  }
  if (match(url, /^\/properties\/([^/]+)\/rents/)) {
    return ok({ rents: mockRents });
  }
  if (match(url, /^\/properties\/([^/]+)/)) {
    const id = url.split("/")[2];
    const raw = mockProperties.find((p) => p.id === id) ?? mockProperties[0];
    // Return PropertyDetail shape
    return ok({
      id: raw.id,
      name: raw.name,
      location: raw.location,
      description: raw.description,
      status: raw.property_status.toUpperCase(),
      type: raw.property_type,
      bedrooms: raw.no_of_bedrooms,
      propertyType: raw.property_type,
      bathrooms: raw.no_of_bathrooms,
      tenant: raw.rents[0]?.tenant?.user
        ? {
            id: "tenant-1",
            name: `${raw.rents[0].tenant.user.first_name} ${raw.rents[0].tenant.user.last_name}`,
            email: raw.rents[0].tenant.user.email,
            phone: raw.rents[0].tenant.user.phone_number,
            rentAmount: Number(raw.rents[0].rental_price),
            leaseStartDate: raw.rents[0].rent_start_date,
            rentExpiryDate: raw.rents[0].expiry_date,
          }
        : null,
      rentPayments: [],
      serviceRequests: mockServiceRequests.slice(0, 2).map((sr) => ({
        id: sr.id,
        tenantName: sr.tenant.name,
        propertyName: sr.property.name,
        messagePreview: sr.description,
        dateReported: sr.created_at,
        status: sr.status,
      })),
      kycApplications: mockKYCApplications.filter((k) => k.propertyId === raw.id),
      kycApplicationCount: mockKYCApplications.filter((k) => k.propertyId === raw.id).length,
      offerLetterCount: raw.offer_letter_count,
      hasActiveKYCLink: raw.is_marketing_ready,
    });
  }
  if (url === "/properties" || url.startsWith("/properties?")) {
    // Paginated
    return ok({
      properties: mockProperties,
      pagination: { currentPage: 1, hasNextPage: false, totalPages: 1, total: mockProperties.length },
    });
  }

  // Tenants / Users
  if (match(url, /^\/users\/tenant-list\/([^/]+)/)) {
    return ok(mockTenantDetail);
  }
  if (url === "/users/tenant-list" || url.startsWith("/users/tenant-list?")) {
    return ok(mockTenantList);
  }
  if (match(url, "/users/tenant-property")) {
    return ok(mockTenantList);
  }
  if (match(url, "/users/profile")) {
    return ok({ id: "user-admin-1", email: "admin@lizt.ng", role: "admin", name: "Admin User" });
  }
  if (url === "/users" || url.startsWith("/users?")) {
    return ok([...mockLandlords, ...mockFacilityManagers]);
  }

  // Service requests
  if (match(url, /^\/service-requests/)) {
    return ok({ service_requests: mockServiceRequests, pagination: { total: mockServiceRequests.length } });
  }

  // KYC
  if (match(url, /^\/kyc\/applications\/property\//)) {
    const propertyId = url.split("/").pop();
    return ok(mockKYCApplications.filter((k) => k.propertyId === propertyId));
  }
  if (match(url, /^\/kyc\/applications\/tenant\//)) {
    return ok(mockKYCApplications.slice(0, 1));
  }
  if (match(url, /^\/kyc\/applications\/([^/]+)\/statistics/)) {
    return ok({ total: 3, pending: 2, approved: 1, rejected: 0 });
  }
  if (match(url, /^\/kyc\/applications\/([^/]+)/)) {
    const id = url.split("/").pop();
    return ok(mockKYCApplications.find((k) => k.id === id) ?? mockKYCApplications[0]);
  }
  if (match(url, /^\/kyc/)) {
    return ok(mockKYCApplications);
  }

  // Notifications
  if (match(url, /^\/notifications/)) {
    return ok(mockNotifications);
  }

  // Rents
  if (match(url, /^\/rents\/tenant\//)) {
    return ok({ rents: mockRents });
  }
  if (match(url, /^\/rents/)) {
    return ok({ rents: mockRents });
  }

  // Offer letters
  if (match(url, /^\/offer-letters/)) {
    return ok([]);
  }

  // Landlords
  if (match(url, /^\/landlords/)) {
    return ok(mockLandlords);
  }

  // Facility managers
  if (match(url, /^\/facility-managers/)) {
    return ok(mockFacilityManagers);
  }

  // Artisans
  if (match(url, /^\/artisans/)) {
    return ok(mockArtisans);
  }

  // Waitlist
  if (match(url, /^\/waitlist/)) {
    return ok({ waitlist: [], pagination: { total: 0 } });
  }

  // Chat / messages
  if (match(url, /^\/chat|\/messages/)) {
    return ok({ messages: [], conversations: [] });
  }

  // Notice / agreements
  if (match(url, /^\/notice|\/agreements/)) {
    return ok([]);
  }

  // Payments
  if (match(url, /^\/payments/)) {
    return ok([]);
  }

  // Renewal invoices
  if (match(url, /^\/renewal/)) {
    return ok([]);
  }

  // Receipts
  if (match(url, /^\/receipts/)) {
    return ok([]);
  }

  // Invoices
  if (match(url, /^\/invoices/)) {
    return ok([]);
  }

  // Packages
  if (match(url, /^\/packages/)) {
    return ok([]);
  }

  // Fallback — return empty success
  console.info(`[mock] Unmatched GET ${url} — returning empty`);
  return ok({});
}

async function handlePost(url: string, _data?: unknown) {
  await delay(200);
  // Login — return a mock user
  if (match(url, "/users/login")) {
    return ok({
      user: { id: "user-admin-1", email: "admin@lizt.ng", role: "admin", name: "Admin User", createdAt: new Date() },
      access_token: "mock-token",
    });
  }
  // Mutations — just acknowledge success
  return ok({ success: true, message: "Action completed (design sandbox)" });
}

async function handlePatch(url: string, _data?: unknown) {
  await delay(200);
  return ok({ success: true, message: "Updated (design sandbox)" });
}

async function handlePut(url: string, _data?: unknown) {
  await delay(200);
  return ok({ success: true, message: "Updated (design sandbox)" });
}

async function handleDelete(url: string) {
  await delay(200);
  return ok({ success: true, message: "Deleted (design sandbox)" });
}

// ---- Mock axios object ----
// Matches the surface area used by the service files

const axiosInstance = {
  defaults: { baseURL: "/api/proxy" },

  interceptors: {
    request: { use: () => {}, eject: () => {} },
    response: { use: () => {}, eject: () => {} },
  },

  get: (url: string, config?: { params?: Record<string, unknown> }) =>
    handleGet(url, config?.params),

  post: (url: string, data?: unknown, _config?: unknown) =>
    handlePost(url, data),

  patch: (url: string, data?: unknown, _config?: unknown) =>
    handlePatch(url, data),

  put: (url: string, data?: unknown, _config?: unknown) =>
    handlePut(url, data),

  delete: (url: string, _config?: unknown) =>
    handleDelete(url),
};

export default axiosInstance;
