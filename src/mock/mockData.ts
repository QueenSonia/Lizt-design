// ============================================================
// DESIGN SANDBOX — MOCK DATA
// All API responses are served from here via the mock axios instance.
// Edit freely to change what screens display.
// ============================================================

// ---- Properties ----

export const mockProperties = [
  {
    id: "prop-1",
    name: "Sunrise Court, Unit 4A",
    location: "12 Sunrise Avenue, Lekki Phase 1",
    city: "Lagos",
    state: "Lagos",
    description: "12 Sunrise Avenue, Lekki Phase 1",
    property_status: "occupied",
    property_type: "Apartment",
    no_of_bedrooms: 3,
    no_of_bathrooms: 2,
    rental_price: 1800000,
    payment_frequency: "Annually",
    security_deposit: 900000,
    service_charge: 150000,
    is_marketing_ready: false,
    offer_letter_count: 1,
    owner_id: "landlord-1",
    rents: [
      {
        id: "rent-1",
        rent_status: "active",
        rental_price: "1800000",
        expiry_date: "2025-12-31",
        rent_start_date: "2025-01-01",
        payment_frequency: "Annually",
        tenant: {
          user: {
            first_name: "Amara",
            last_name: "Okonkwo",
            email: "amara.okonkwo@email.com",
            phone_number: "08012345678",
            tenant_kycs: [
              {
                first_name: "Amara",
                last_name: "Okonkwo",
                email: "amara.okonkwo@email.com",
                phone_number: "08012345678",
              },
            ],
          },
        },
      },
    ],
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "prop-2",
    name: "Palm Grove Estate, Block C",
    location: "45 Palm Grove Road, Ikoyi",
    city: "Lagos",
    state: "Lagos",
    description: "45 Palm Grove Road, Ikoyi",
    property_status: "vacant",
    property_type: "Duplex",
    no_of_bedrooms: 4,
    no_of_bathrooms: 3,
    rental_price: 3500000,
    payment_frequency: "Annually",
    security_deposit: 1750000,
    service_charge: 250000,
    is_marketing_ready: true,
    offer_letter_count: 3,
    owner_id: "landlord-1",
    rents: [],
    created_at: "2024-03-10T00:00:00Z",
    updated_at: "2025-02-01T00:00:00Z",
  },
  {
    id: "prop-3",
    name: "Heritage Towers, Flat 12",
    location: "7 Heritage Street, Victoria Island",
    city: "Lagos",
    state: "Lagos",
    description: "7 Heritage Street, Victoria Island",
    property_status: "offer_pending",
    property_type: "Apartment",
    no_of_bedrooms: 2,
    no_of_bathrooms: 2,
    rental_price: 2200000,
    payment_frequency: "Annually",
    security_deposit: 1100000,
    service_charge: 180000,
    is_marketing_ready: true,
    offer_letter_count: 2,
    owner_id: "landlord-2",
    rents: [],
    created_at: "2024-05-20T00:00:00Z",
    updated_at: "2025-03-01T00:00:00Z",
  },
  {
    id: "prop-4",
    name: "Green Valley Bungalow",
    location: "22 Green Valley Close, Surulere",
    city: "Lagos",
    state: "Lagos",
    description: "22 Green Valley Close, Surulere",
    property_status: "occupied",
    property_type: "Bungalow",
    no_of_bedrooms: 3,
    no_of_bathrooms: 2,
    rental_price: 1200000,
    payment_frequency: "Annually",
    security_deposit: 600000,
    service_charge: 100000,
    is_marketing_ready: false,
    offer_letter_count: 0,
    owner_id: "landlord-2",
    rents: [
      {
        id: "rent-2",
        rent_status: "active",
        rental_price: "1200000",
        expiry_date: "2025-08-31",
        rent_start_date: "2024-09-01",
        payment_frequency: "Annually",
        tenant: {
          user: {
            first_name: "Chukwuemeka",
            last_name: "Adeyemi",
            email: "chukwu.adeyemi@email.com",
            phone_number: "08098765432",
            tenant_kycs: [
              {
                first_name: "Chukwuemeka",
                last_name: "Adeyemi",
                email: "chukwu.adeyemi@email.com",
                phone_number: "08098765432",
              },
            ],
          },
        },
      },
    ],
    created_at: "2023-09-01T00:00:00Z",
    updated_at: "2024-09-01T00:00:00Z",
  },
  {
    id: "prop-5",
    name: "Maplewood Court, Unit 2B",
    location: "3 Maplewood Drive, Gbagada",
    city: "Lagos",
    state: "Lagos",
    description: "3 Maplewood Drive, Gbagada",
    property_status: "inactive",
    property_type: "Apartment",
    no_of_bedrooms: 1,
    no_of_bathrooms: 1,
    rental_price: 800000,
    payment_frequency: "Annually",
    security_deposit: 400000,
    service_charge: 60000,
    is_marketing_ready: false,
    offer_letter_count: 0,
    owner_id: "landlord-1",
    rents: [],
    created_at: "2023-06-15T00:00:00Z",
    updated_at: "2024-06-15T00:00:00Z",
  },
];

// ---- Property Details (for detail pages) ----

export const mockPropertyDetails: Record<string, object> = {
  "prop-1": {
    id: 1,
    name: "Sunrise Court, Unit 4A",
    address: "12 Sunrise Avenue, Lekki Phase 1, Lagos",
    type: "Apartment",
    bedrooms: 3,
    bathrooms: 2,
    status: "occupied",
    rent: 1800000,
    serviceCharge: 150000,
    rentExpiryDate: "2025-12-31",
    pendingRenewalInvoice: null,
    rentalPrice: null,
    isMarketingReady: false,
    description: "A beautiful 3-bedroom apartment in the heart of Lekki Phase 1 with modern finishes.",
    currentTenant: {
      id: "tenant-1",
      tenancyId: "tenancy-1",
      name: "Amara Okonkwo",
      email: "amara.okonkwo@email.com",
      phone: "08012345678",
      tenancyStartDate: "2025-01-01",
      paymentCycle: "Annually",
      passportPhoto: null,
      renewalStatus: null,
      outstandingBalance: 0,
    },
    history: [
      { id: 1, date: "2025-01-01", eventType: "move_in", title: "Tenant Moved In", description: "Amara Okonkwo moved in", details: null },
      { id: 2, date: "2025-01-15", eventType: "payment", title: "Rent Payment Received", description: "₦1,800,000 rent payment received", details: "Reference: PAY-20250115" },
      { id: 3, date: "2025-03-10", eventType: "maintenance", title: "Maintenance Request", description: "Plumbing issue in kitchen reported", details: null },
    ],
    kycApplications: [
      { id: "kyc-1", status: "approved", applicantName: "Amara Okonkwo", email: "amara.okonkwo@email.com", phoneNumber: "08012345678", submissionDate: "2024-12-10" },
    ],
    kycApplicationCount: 1,
    pendingApplicationsCount: 0,
    offerLetterCount: 1,
    hasActiveKYCLink: false,
  },
  "prop-2": {
    id: 2,
    name: "Palm Grove Estate, Block C",
    address: "45 Palm Grove Road, Ikoyi, Lagos",
    type: "Duplex",
    bedrooms: 4,
    bathrooms: 3,
    status: "vacant",
    rent: null,
    serviceCharge: 250000,
    rentExpiryDate: null,
    pendingRenewalInvoice: null,
    rentalPrice: 3500000,
    isMarketingReady: true,
    description: "A spacious 4-bedroom duplex with a private garden in the exclusive Ikoyi neighbourhood.",
    currentTenant: null,
    history: [
      { id: 1, date: "2024-11-15", eventType: "general", title: "Listed for Marketing", description: "Property listed as marketing-ready", details: null },
      { id: 2, date: "2024-12-01", eventType: "offer_letter", title: "Offer Letter Sent", description: "Offer letter sent to prospective tenant", details: null },
    ],
    kycApplications: [
      { id: "kyc-2", status: "pending", applicantName: "Fatima Al-Hassan", email: "fatima@email.com", phoneNumber: "08055512345", submissionDate: "2025-03-15" },
      { id: "kyc-3", status: "pending", applicantName: "Olumide Fashola", email: "olumide@email.com", phoneNumber: "07081234567", submissionDate: "2025-03-20" },
      { id: "kyc-4", status: "rejected", applicantName: "Grace Eze", email: "grace@email.com", phoneNumber: "09012345678", submissionDate: "2025-02-28" },
    ],
    kycApplicationCount: 3,
    pendingApplicationsCount: 2,
    offerLetterCount: 3,
    hasActiveKYCLink: true,
  },
};

// ---- Tenants ----

export const mockTenantList = {
  tenants: [
    {
      id: "tenant-1",
      user: {
        id: "user-1",
        first_name: "Amara",
        last_name: "Okonkwo",
        email: "amara.okonkwo@email.com",
        phone_number: "08012345678",
        tenant_kycs: [{ first_name: "Amara", last_name: "Okonkwo", phone_number: "08012345678", email: "amara.okonkwo@email.com" }],
      },
      status: "Active",
      property: { name: "Sunrise Court, Unit 4A", id: "prop-1" },
      rent: { rental_price: 1800000, expiry_date: "2025-12-31", rent_status: "active" },
    },
    {
      id: "tenant-2",
      user: {
        id: "user-2",
        first_name: "Chukwuemeka",
        last_name: "Adeyemi",
        email: "chukwu.adeyemi@email.com",
        phone_number: "08098765432",
        tenant_kycs: [{ first_name: "Chukwuemeka", last_name: "Adeyemi", phone_number: "08098765432", email: "chukwu.adeyemi@email.com" }],
      },
      status: "Active",
      property: { name: "Green Valley Bungalow", id: "prop-4" },
      rent: { rental_price: 1200000, expiry_date: "2025-08-31", rent_status: "active" },
    },
    {
      id: "tenant-3",
      user: {
        id: "user-3",
        first_name: "Ngozi",
        last_name: "Ibe",
        email: "ngozi.ibe@email.com",
        phone_number: "07012345678",
        tenant_kycs: [{ first_name: "Ngozi", last_name: "Ibe", phone_number: "07012345678", email: "ngozi.ibe@email.com" }],
      },
      status: "Inactive",
      property: { name: "Maplewood Court, Unit 2B", id: "prop-5" },
      rent: { rental_price: 800000, expiry_date: "2024-06-30", rent_status: "expired" },
    },
  ],
  pagination: { currentPage: 1, hasNextPage: false, totalPages: 1, total: 3 },
};

// ---- Single Tenant Detail ----

export const mockTenantDetail = {
  id: "tenant-1",
  kycApplicationId: "kyc-1",
  firstName: "Amara",
  lastName: "Okonkwo",
  dateOfBirth: "1990-05-14",
  phone: "08012345678",
  email: "amara.okonkwo@email.com",
  gender: "Female",
  stateOfOrigin: "Anambra",
  lga: "Onitsha North",
  nationality: "Nigerian",
  maritalStatus: "Single",
  religion: "Christianity",
  employmentStatus: "employed",
  employerName: "TechCorp Nigeria Ltd",
  employerAddress: "10 Tech Hub, Victoria Island, Lagos",
  jobTitle: "Senior Software Engineer",
  workEmail: "amara@techcorp.ng",
  monthlyIncome: 500000,
  employerPhoneNumber: "014567890",
  lengthOfEmployment: "3 years",
  natureOfBusiness: null,
  businessName: null,
  businessAddress: null,
  businessDuration: null,
  occupation: null,
  currentAddress: "12 Sunrise Avenue, Lekki Phase 1, Lagos",
  nokName: "Chidi Okonkwo",
  nokRelationship: "Brother",
  nokPhone: "08023456789",
  nokEmail: "chidi@email.com",
  nokAddress: "5 Unity Road, Onitsha, Anambra",
  guarantorName: "Emmanuel Nwosu",
  guarantorPhone: "08034567890",
  guarantorEmail: "emmanuel@email.com",
  guarantorAddress: "8 Guarantor Lane, Lagos",
  guarantorRelationship: "Colleague",
  guarantorOccupation: "Accountant",
  property: "Sunrise Court, Unit 4A",
  propertyId: "prop-1",
  propertyAddress: "12 Sunrise Avenue, Lekki Phase 1, Lagos",
  propertyStatus: "occupied",
  whatsAppConnected: true,
  totalOutstandingBalance: 0,
  totalCreditBalance: 0,
  outstandingBalanceBreakdown: [],
  paymentTransactions: [],
  leaseStartDate: "2025-01-01",
  leaseEndDate: "2025-12-31",
  tenancyStatus: "Active",
  rentAmount: 1800000,
  serviceCharge: 150000,
  rentFrequency: "Annually",
  rentStatus: "paid",
  nextRentDue: "2026-01-01",
  outstandingBalance: 0,
  creditBalance: 0,
  paymentHistory: [
    { id: "pay-1", date: "2025-01-15", amount: 1950000, status: "paid", reference: "PAY-20250115" },
    { id: "pay-2", date: "2024-01-10", amount: 1800000, status: "paid", reference: "PAY-20240110" },
  ],
  maintenanceIssues: [
    { id: "maint-1", title: "Plumbing leak in kitchen", description: "Water leaking under kitchen sink", status: "resolved", reportedDate: "2025-03-10", resolvedDate: "2025-03-12", priority: "High" },
    { id: "maint-2", title: "AC not cooling", description: "Air conditioner in master bedroom not effective", status: "in_progress", reportedDate: "2025-04-01", resolvedDate: null, priority: "Medium" },
  ],
  documents: [
    { id: "doc-1", name: "Offer Letter - 2025", url: "#", type: "offer_letter", uploadDate: "2025-01-01" },
    { id: "doc-2", name: "Receipt - Jan 2025", url: "#", type: "receipt", uploadDate: "2025-01-15" },
  ],
  activeTenancies: [
    { id: "at-1", property: "Sunrise Court, Unit 4A", startDate: "2025-01-01", endDate: "2025-12-31", status: "Active" },
  ],
  tenancyHistory: [
    { id: "th-1", property: "Old Quarters, Yaba", startDate: "2022-03-01", endDate: "2024-12-31", status: "Completed" },
  ],
  history: [
    { id: "h-1", type: "payment", title: "Rent Payment", description: "₦1,950,000 received (rent + service charge)", date: "2025-01-15", time: "10:30 AM", details: "Ref: PAY-20250115" },
    { id: "h-2", type: "offer_letter", title: "Offer Letter Accepted", description: "Tenant accepted offer letter for 2025", date: "2025-01-01", time: "09:00 AM", details: null },
    { id: "h-3", type: "maintenance", title: "Maintenance Request", description: "Plumbing issue reported", date: "2025-03-10", time: "02:15 PM", details: null },
  ],
  kycInfo: { kycStatus: "Verified", kycSubmittedDate: "2024-12-10", kycDocuments: [] },
  tenantKycId: "tenantkyc-1",
  passportPhotoUrl: null,
  intendedUseOfProperty: "Residential",
  numberOfOccupants: "2",
  numberOfCarsOwned: "1",
  proposedRentAmount: "1800000",
  rentPaymentFrequency: "Annually",
  additionalNotes: null,
  status: "Active",
};

// ---- Admin Dashboard Analytics ----

export const mockDashboardAnalytics = {
  totalProperties: 5,
  occupiedProperties: 2,
  vacantProperties: 2,
  inactiveProperties: 1,
  totalTenants: 3,
  activeTenants: 2,
  totalRevenue: 3000000,
  pendingPayments: 1,
  serviceRequests: {
    total: 4,
    open: 2,
    inProgress: 1,
    resolved: 1,
  },
  recentActivity: [
    { type: "payment", description: "Rent payment received from Amara Okonkwo", date: "2025-04-08" },
    { type: "maintenance", description: "AC maintenance request from Green Valley Bungalow", date: "2025-04-07" },
    { type: "kyc", description: "New KYC application from Fatima Al-Hassan", date: "2025-04-06" },
  ],
  properties: mockProperties.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.property_status,
    location: p.location,
    rentAmount: p.rental_price,
  })),
};

// ---- Service Requests ----

export const mockServiceRequests = [
  {
    id: "sr-1",
    issue_category: "Plumbing",
    description: "Water leaking under kitchen sink. Needs urgent fix.",
    status: "resolved",
    priority: "High",
    created_at: "2025-03-10T14:15:00Z",
    effective_date: "2025-03-12T11:00:00Z",
    property: { id: "prop-1", name: "Sunrise Court, Unit 4A" },
    tenant: { name: "Amara Okonkwo", id: "tenant-1" },
  },
  {
    id: "sr-2",
    issue_category: "Electrical",
    description: "Power socket in living room sparking when plugged in.",
    status: "open",
    priority: "High",
    created_at: "2025-04-02T09:30:00Z",
    effective_date: null,
    property: { id: "prop-4", name: "Green Valley Bungalow" },
    tenant: { name: "Chukwuemeka Adeyemi", id: "tenant-2" },
  },
  {
    id: "sr-3",
    issue_category: "Air Conditioning",
    description: "AC unit in master bedroom not cooling effectively.",
    status: "in_progress",
    priority: "Medium",
    created_at: "2025-04-01T13:00:00Z",
    effective_date: null,
    property: { id: "prop-1", name: "Sunrise Court, Unit 4A" },
    tenant: { name: "Amara Okonkwo", id: "tenant-1" },
  },
  {
    id: "sr-4",
    issue_category: "General",
    description: "Front gate hinge is broken, gate won't close fully.",
    status: "open",
    priority: "Low",
    created_at: "2025-03-28T16:45:00Z",
    effective_date: null,
    property: { id: "prop-4", name: "Green Valley Bungalow" },
    tenant: { name: "Chukwuemeka Adeyemi", id: "tenant-2" },
  },
];

// ---- KYC Applications ----

export const mockKYCApplications = [
  { id: "kyc-1", status: "approved", applicantName: "Amara Okonkwo", email: "amara.okonkwo@email.com", phoneNumber: "08012345678", submissionDate: "2024-12-10", propertyId: "prop-1", employmentStatus: "employed", monthlyIncome: "500000" },
  { id: "kyc-2", status: "pending", applicantName: "Fatima Al-Hassan", email: "fatima@email.com", phoneNumber: "08055512345", submissionDate: "2025-03-15", propertyId: "prop-2", employmentStatus: "employed", monthlyIncome: "350000" },
  { id: "kyc-3", status: "pending", applicantName: "Olumide Fashola", email: "olumide@email.com", phoneNumber: "07081234567", submissionDate: "2025-03-20", propertyId: "prop-2", employmentStatus: "self-employed", monthlyIncome: "600000" },
  { id: "kyc-4", status: "rejected", applicantName: "Grace Eze", email: "grace@email.com", phoneNumber: "09012345678", submissionDate: "2025-02-28", propertyId: "prop-2", employmentStatus: "employed", monthlyIncome: "200000" },
];

// ---- Landlords / Users ----

export const mockLandlords = [
  {
    id: "landlord-1",
    first_name: "Babajide",
    last_name: "Sanwo-Olu",
    email: "babajide@propmanager.ng",
    phone_number: "08011112222",
    role: "landlord",
    properties: [{ id: "prop-1" }, { id: "prop-2" }, { id: "prop-5" }],
    created_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "landlord-2",
    first_name: "Chidinma",
    last_name: "Ekile",
    email: "chidinma@propmanager.ng",
    phone_number: "08033334444",
    role: "landlord",
    properties: [{ id: "prop-3" }, { id: "prop-4" }],
    created_at: "2023-03-15T00:00:00Z",
  },
];

// ---- Facility Managers ----

export const mockFacilityManagers = [
  {
    id: "fm-1",
    first_name: "Taiwo",
    last_name: "Adesanya",
    email: "taiwo@facilities.ng",
    phone_number: "08055556666",
    role: "facility-manager",
    assigned_properties: ["prop-1", "prop-4"],
    created_at: "2023-06-01T00:00:00Z",
  },
  {
    id: "fm-2",
    first_name: "Emeka",
    last_name: "Obi",
    email: "emeka@facilities.ng",
    phone_number: "08077778888",
    role: "facility-manager",
    assigned_properties: ["prop-2", "prop-3"],
    created_at: "2024-01-10T00:00:00Z",
  },
];

// ---- Artisans ----

export const mockArtisans = [
  { id: "art-1", name: "Kunle Plumber", trade: "Plumbing", phone: "08022223333", rating: 4.5, completed_jobs: 38 },
  { id: "art-2", name: "Seyi Electricals", trade: "Electrical", phone: "08044445555", rating: 4.8, completed_jobs: 55 },
  { id: "art-3", name: "AC Cool Solutions", trade: "HVAC", phone: "08066667777", rating: 4.2, completed_jobs: 22 },
];

// ---- Notifications ----

export const mockNotifications = [
  { id: "notif-1", title: "Rent Due Soon", message: "Chukwuemeka Adeyemi's rent at Green Valley Bungalow is due in 30 days.", type: "reminder", read: false, created_at: "2025-04-08T08:00:00Z" },
  { id: "notif-2", title: "New KYC Application", message: "Olumide Fashola submitted a KYC application for Palm Grove Estate.", type: "kyc", read: false, created_at: "2025-04-06T14:30:00Z" },
  { id: "notif-3", title: "Maintenance Resolved", message: "Plumbing issue at Sunrise Court has been resolved.", type: "maintenance", read: true, created_at: "2025-03-12T11:00:00Z" },
];

// ---- Rent records ----

export const mockRents = [
  { id: "rent-1", property: { id: "prop-1", name: "Sunrise Court, Unit 4A" }, tenant: { first_name: "Amara", last_name: "Okonkwo" }, rental_price: 1800000, expiry_date: "2025-12-31", rent_start_date: "2025-01-01", rent_status: "active", payment_frequency: "Annually", amount_paid: 1950000 },
  { id: "rent-2", property: { id: "prop-4", name: "Green Valley Bungalow" }, tenant: { first_name: "Chukwuemeka", last_name: "Adeyemi" }, rental_price: 1200000, expiry_date: "2025-08-31", rent_start_date: "2024-09-01", rent_status: "active", payment_frequency: "Annually", amount_paid: 1300000 },
];
