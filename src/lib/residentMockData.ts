// Shared mock data for Residents list and detail pages.

export interface Building {
  id: string;
  name: string;
  address: string;
  commonAreas: string[];
}

export interface Resident {
  id: string;
  name: string;
  phone: string;
  unit: string;
  building: string;
  dateAdded: string;
}

export interface ResidentRequest {
  id: string;
  title: string;
  location: string;
  status: "Open" | "In Progress" | "Resolved";
  date: string;
}

export interface ResidentInvoice {
  id: string;
  dateGenerated: string;
  dueDate: string;
  category: "Diesel" | "Service Charge";
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
}

export const MOCK_BUILDINGS: Building[] = [
  {
    id: "b-1",
    name: "Palm Grove Estate",
    address: "Ajah, Lagos",
    commonAreas: ["Main Lobby", "Generator Room", "Parking Lot"],
  },
  {
    id: "b-2",
    name: "Maple Court",
    address: "Lekki Phase 1, Lagos",
    commonAreas: ["Lobby", "Rooftop Garden", "Laundry Room"],
  },
  {
    id: "b-3",
    name: "Sapphire Heights",
    address: "Victoria Island, Lagos",
    commonAreas: ["Reception", "Swimming Pool", "Gym"],
  },
];

export const MOCK_RESIDENTS: Resident[] = [
  {
    id: "RES-001",
    name: "Chibuike Okonkwo",
    phone: "+234 803 441 2211",
    unit: "Flat 1A",
    building: "Palm Grove Estate",
    dateAdded: "2026-01-15",
  },
  {
    id: "RES-002",
    name: "Funmilola Adeyemi",
    phone: "+234 806 887 3344",
    unit: "Flat 2B",
    building: "Palm Grove Estate",
    dateAdded: "2026-02-03",
  },
  {
    id: "RES-003",
    name: "Aminu Suleiman",
    phone: "+234 812 223 9900",
    unit: "Flat 3C",
    building: "Maple Court",
    dateAdded: "2026-01-28",
  },
  {
    id: "RES-004",
    name: "Adaeze Nwosu",
    phone: "+234 809 551 7762",
    unit: "Flat 1B",
    building: "Maple Court",
    dateAdded: "2026-03-10",
  },
  {
    id: "RES-005",
    name: "Babatunde Fashola",
    phone: "+234 702 334 8810",
    unit: "Penthouse",
    building: "Sapphire Heights",
    dateAdded: "2026-03-22",
  },
  {
    id: "RES-006",
    name: "Chiamaka Igwe",
    phone: "+234 815 662 5531",
    unit: "Flat 4D",
    building: "Sapphire Heights",
    dateAdded: "2026-04-01",
  },
];

export const MOCK_RESIDENT_REQUESTS: Record<string, ResidentRequest[]> = {
  "RES-001": [
    {
      id: "rr-001-1",
      title: "Generator in Generator Room not starting",
      location: "Generator Room",
      status: "Open",
      date: "2026-09-10",
    },
    {
      id: "rr-001-2",
      title: "Main Lobby lights flickering",
      location: "Main Lobby",
      status: "In Progress",
      date: "2026-09-14",
    },
    {
      id: "rr-001-3",
      title: "Parking lot gate jammed",
      location: "Parking Lot",
      status: "Resolved",
      date: "2026-08-28",
    },
  ],
  "RES-002": [
    {
      id: "rr-002-1",
      title: "Generator not supplying power to Flat 2B",
      location: "Generator Room",
      status: "Open",
      date: "2026-09-18",
    },
    {
      id: "rr-002-2",
      title: "Water pressure low at Main Lobby taps",
      location: "Main Lobby",
      status: "Resolved",
      date: "2026-09-02",
    },
  ],
  "RES-003": [
    {
      id: "rr-003-1",
      title: "Rooftop Garden drain blocked after rain",
      location: "Rooftop Garden",
      status: "Open",
      date: "2026-09-15",
    },
    {
      id: "rr-003-2",
      title: "Laundry Room door handle broken",
      location: "Laundry Room",
      status: "In Progress",
      date: "2026-09-20",
    },
  ],
  "RES-004": [],
  "RES-005": [
    {
      id: "rr-005-1",
      title: "Swimming Pool pump making grinding noise",
      location: "Swimming Pool",
      status: "In Progress",
      date: "2026-09-22",
    },
  ],
  "RES-006": [
    {
      id: "rr-006-1",
      title: "Reception entrance door closer faulty",
      location: "Reception",
      status: "Open",
      date: "2026-09-25",
    },
  ],
};

// Unified invoice records — each entry covers the full lifecycle from generation to settlement.
export const MOCK_RESIDENT_INVOICES: Record<string, ResidentInvoice[]> = {
  "RES-001": [
    { id: "inv-001-1", dateGenerated: "2026-10-01", dueDate: "2026-10-15", category: "Service Charge", amount: 120_000, status: "Overdue" },
    { id: "inv-001-2", dateGenerated: "2026-10-01", dueDate: "2026-10-10", category: "Diesel",         amount:  45_000, status: "Pending" },
    { id: "inv-001-3", dateGenerated: "2026-09-01", dueDate: "2026-09-15", category: "Service Charge", amount: 120_000, status: "Paid" },
    { id: "inv-001-4", dateGenerated: "2026-09-01", dueDate: "2026-09-10", category: "Diesel",         amount:  45_000, status: "Paid" },
    { id: "inv-001-5", dateGenerated: "2026-08-01", dueDate: "2026-08-15", category: "Service Charge", amount: 120_000, status: "Paid" },
    { id: "inv-001-6", dateGenerated: "2026-08-01", dueDate: "2026-08-10", category: "Diesel",         amount:  45_000, status: "Paid" },
  ],
  "RES-002": [
    { id: "inv-002-1", dateGenerated: "2026-10-01", dueDate: "2026-10-15", category: "Service Charge", amount: 120_000, status: "Pending" },
    { id: "inv-002-2", dateGenerated: "2026-09-01", dueDate: "2026-09-15", category: "Service Charge", amount: 120_000, status: "Paid" },
    { id: "inv-002-3", dateGenerated: "2026-09-01", dueDate: "2026-09-10", category: "Diesel",         amount:  45_000, status: "Paid" },
  ],
  "RES-003": [
    { id: "inv-003-1", dateGenerated: "2026-10-01", dueDate: "2026-10-10", category: "Diesel",         amount:  38_000, status: "Pending" },
    { id: "inv-003-2", dateGenerated: "2026-09-01", dueDate: "2026-09-15", category: "Service Charge", amount:  80_000, status: "Paid" },
    { id: "inv-003-3", dateGenerated: "2026-09-01", dueDate: "2026-09-10", category: "Diesel",         amount:  38_000, status: "Overdue" },
  ],
  "RES-004": [
    { id: "inv-004-1", dateGenerated: "2026-10-01", dueDate: "2026-10-15", category: "Service Charge", amount:  80_000, status: "Pending" },
    { id: "inv-004-2", dateGenerated: "2026-09-01", dueDate: "2026-09-15", category: "Service Charge", amount:  80_000, status: "Paid" },
  ],
  "RES-005": [
    { id: "inv-005-1", dateGenerated: "2026-10-01", dueDate: "2026-10-10", category: "Diesel",         amount:  60_000, status: "Pending" },
    { id: "inv-005-2", dateGenerated: "2026-09-01", dueDate: "2026-09-15", category: "Service Charge", amount: 200_000, status: "Paid" },
    { id: "inv-005-3", dateGenerated: "2026-09-01", dueDate: "2026-09-10", category: "Diesel",         amount:  60_000, status: "Paid" },
  ],
  "RES-006": [
    { id: "inv-006-1", dateGenerated: "2026-09-01", dueDate: "2026-09-15", category: "Service Charge", amount: 200_000, status: "Paid" },
    { id: "inv-006-2", dateGenerated: "2026-09-01", dueDate: "2026-09-10", category: "Diesel",         amount:  60_000, status: "Overdue" },
  ],
};
