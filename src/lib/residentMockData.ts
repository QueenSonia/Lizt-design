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
  raisedAt?: string;    // ISO datetime e.g. "2026-09-10T09:30:00"
  images?: string[];    // paths served from /public, e.g. ["/1.jpeg"]
  assignedTo?: string;  // facility manager name
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
      raisedAt: "2026-09-10T09:30:00",
      images: ["/1.jpeg"],
      assignedTo: "Jide Akinola",
    },
    {
      id: "rr-001-2",
      title: "Main Lobby lights flickering",
      location: "Main Lobby",
      status: "In Progress",
      date: "2026-09-14",
      raisedAt: "2026-09-14T11:05:00",
      assignedTo: "Sarah Okonkwo",
    },
    {
      id: "rr-001-3",
      title: "Parking lot gate jammed",
      location: "Parking Lot",
      status: "Resolved",
      date: "2026-08-28",
      raisedAt: "2026-08-28T08:15:00",
      assignedTo: "Jide Akinola",
    },
  ],
  "RES-002": [
    {
      id: "rr-002-1",
      title: "Generator not supplying power to Flat 2B",
      location: "Generator Room",
      status: "Open",
      date: "2026-09-18",
      raisedAt: "2026-09-18T14:45:00",
      assignedTo: "Taiwo Adesanya",
    },
    {
      id: "rr-002-2",
      title: "Water pressure low at Main Lobby taps",
      location: "Main Lobby",
      status: "Resolved",
      date: "2026-09-02",
      raisedAt: "2026-09-02T10:00:00",
      assignedTo: "Sarah Okonkwo",
    },
  ],
  "RES-003": [
    {
      id: "rr-003-1",
      title: "Rooftop Garden drain blocked after rain",
      location: "Rooftop Garden",
      status: "Open",
      date: "2026-09-15",
      raisedAt: "2026-09-15T08:00:00",
      images: ["/2.jpeg", "/3.jpeg"],
      assignedTo: "Jide Akinola",
    },
    {
      id: "rr-003-2",
      title: "Laundry Room door handle broken",
      location: "Laundry Room",
      status: "In Progress",
      date: "2026-09-20",
      raisedAt: "2026-09-20T16:20:00",
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
      raisedAt: "2026-09-22T09:00:00",
      images: ["/5.jpeg"],
      assignedTo: "Sarah Okonkwo",
    },
  ],
  "RES-006": [
    {
      id: "rr-006-1",
      title: "Reception entrance door closer faulty",
      location: "Reception",
      status: "Open",
      date: "2026-09-25",
      raisedAt: "2026-09-25T07:30:00",
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
    { id: "inv-004-1", dateGenerated: "2026-10-01", dueDate: "2026-10-15", category: "Service Charge", amount:  80_000, status: "Paid" },
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

// ── New exports for resident tabbed profile ────────────────────────────────────

export interface ResidentChatLog {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string;
  status: string;
  created_at: string;
  phone_number: string;
  message_type: string;
}

export const MOCK_RESIDENT_CHATS: Record<string, ResidentChatLog[]> = {
  "RES-001": [
    {
      id: "chat-001-1",
      direction: "OUTBOUND",
      content: "Hi Chibuike, this is a reminder that your October Service Charge of ₦120,000 is now overdue. Please make payment at your earliest convenience to avoid service disruption.",
      status: "delivered",
      created_at: "2026-10-01T09:05:00.000Z",
      phone_number: "+2348034412211",
      message_type: "text",
    },
    {
      id: "chat-001-2",
      direction: "INBOUND",
      content: "Good morning. I saw the invoice. I'll settle it by end of week. Also wanted to report that the generator in the generator room still hasn't been fixed — it's been over 3 weeks now.",
      status: "read",
      created_at: "2026-10-01T10:22:00.000Z",
      phone_number: "+2348034412211",
      message_type: "text",
    },
    {
      id: "chat-001-3",
      direction: "OUTBOUND",
      content: "Thank you for the update, Chibuike. We've escalated the generator issue and a technician has been scheduled for this week. We'll notify you once the visit is confirmed.",
      status: "delivered",
      created_at: "2026-10-01T11:00:00.000Z",
      phone_number: "+2348034412211",
      message_type: "text",
    },
    {
      id: "chat-001-4",
      direction: "INBOUND",
      content: "Also the lobby lights are still flickering at night. It's been reported before. Please look into it as well.",
      status: "read",
      created_at: "2026-10-02T08:45:00.000Z",
      phone_number: "+2348034412211",
      message_type: "text",
    },
    {
      id: "chat-001-5",
      direction: "OUTBOUND",
      content: "Noted, Chibuike. The lobby lights issue is already logged as In Progress. Our electrician will attend to both the generator and the lobby lights this week.",
      status: "delivered",
      created_at: "2026-10-02T09:30:00.000Z",
      phone_number: "+2348034412211",
      message_type: "text",
    },
    {
      id: "chat-001-6",
      direction: "INBOUND",
      content: "Alright, thank you. I'll make the payment by Friday.",
      status: "read",
      created_at: "2026-10-02T09:55:00.000Z",
      phone_number: "+2348034412211",
      message_type: "text",
    },
  ],
  "RES-002": [
    {
      id: "chat-002-1",
      direction: "OUTBOUND",
      content: "Hello Funmilola, your October Service Charge invoice of ₦120,000 has been generated and is due on 15 October 2026. Please make payment before the due date.",
      status: "delivered",
      created_at: "2026-10-01T09:10:00.000Z",
      phone_number: "+2348068873344",
      message_type: "text",
    },
    {
      id: "chat-002-2",
      direction: "INBOUND",
      content: "Thank you. I'll pay before the 15th. Please can you also update me on the generator issue? Power hasn't been stable in Flat 2B since last week.",
      status: "read",
      created_at: "2026-10-01T12:04:00.000Z",
      phone_number: "+2348068873344",
      message_type: "text",
    },
    {
      id: "chat-002-3",
      direction: "OUTBOUND",
      content: "Hi Funmilola, your complaint is logged and a technician has been assigned. We expect the generator supply to Flat 2B to be restored within 48 hours.",
      status: "delivered",
      created_at: "2026-10-01T13:15:00.000Z",
      phone_number: "+2348068873344",
      message_type: "text",
    },
    {
      id: "chat-002-4",
      direction: "INBOUND",
      content: "Okay, thank you. I hope it's sorted soon. The heat has been unbearable without the AC running properly.",
      status: "read",
      created_at: "2026-10-02T07:50:00.000Z",
      phone_number: "+2348068873344",
      message_type: "text",
    },
    {
      id: "chat-002-5",
      direction: "OUTBOUND",
      content: "We understand, and we apologise for the inconvenience. The technician's visit has been confirmed for tomorrow morning between 9am and 12pm. You don't need to be present.",
      status: "delivered",
      created_at: "2026-10-02T08:30:00.000Z",
      phone_number: "+2348068873344",
      message_type: "text",
    },
  ],
  "RES-003": [
    {
      id: "chat-003-1",
      direction: "OUTBOUND",
      content: "Dear Aminu, this is a reminder that your September Diesel invoice of ₦38,000 is now overdue. Your October Diesel invoice of ₦38,000 has also been generated and is due 10 October. Kindly settle both outstanding amounts.",
      status: "delivered",
      created_at: "2026-10-01T09:00:00.000Z",
      phone_number: "+2348122239900",
      message_type: "text",
    },
    {
      id: "chat-003-2",
      direction: "INBOUND",
      content: "Good morning. I'm aware of the overdue invoice — I had a travel issue last month. I'll pay both this week. Also the rooftop garden drain is still blocked. Water pools on the deck after any rain.",
      status: "read",
      created_at: "2026-10-01T10:30:00.000Z",
      phone_number: "+2348122239900",
      message_type: "text",
    },
    {
      id: "chat-003-3",
      direction: "OUTBOUND",
      content: "Thank you for the update, Aminu. We'll process both payments once received. The rooftop drain blockage has been escalated — our maintenance team will inspect it this week.",
      status: "delivered",
      created_at: "2026-10-01T11:10:00.000Z",
      phone_number: "+2348122239900",
      message_type: "text",
    },
    {
      id: "chat-003-4",
      direction: "INBOUND",
      content: "Also the laundry room door handle is still broken. I reported it last week and someone came but said they needed a spare part. Any update on that?",
      status: "read",
      created_at: "2026-10-03T08:15:00.000Z",
      phone_number: "+2348122239900",
      message_type: "text",
    },
    {
      id: "chat-003-5",
      direction: "OUTBOUND",
      content: "Hi Aminu, the spare part for the laundry room door handle is confirmed and will be installed by Thursday. We apologise for the delay.",
      status: "delivered",
      created_at: "2026-10-03T09:45:00.000Z",
      phone_number: "+2348122239900",
      message_type: "text",
    },
    {
      id: "chat-003-6",
      direction: "INBOUND",
      content: "Okay, thanks. I'll make the invoice payments tomorrow.",
      status: "read",
      created_at: "2026-10-03T10:05:00.000Z",
      phone_number: "+2348122239900",
      message_type: "text",
    },
  ],
  "RES-004": [
    {
      id: "chat-004-1",
      direction: "OUTBOUND",
      content: "Hello Adaeze, your October Service Charge invoice of ₦80,000 has been generated. It is due on 15 October 2026. Please make payment before the due date.",
      status: "delivered",
      created_at: "2026-10-01T09:15:00.000Z",
      phone_number: "+2348095517762",
      message_type: "text",
    },
    {
      id: "chat-004-2",
      direction: "INBOUND",
      content: "Thank you. I'll process the payment this week. I don't have any issues to report at the moment — everything has been fine so far.",
      status: "read",
      created_at: "2026-10-01T11:40:00.000Z",
      phone_number: "+2348095517762",
      message_type: "text",
    },
    {
      id: "chat-004-3",
      direction: "OUTBOUND",
      content: "That's great to hear, Adaeze! We appreciate the prompt response. Let us know if you ever need anything.",
      status: "delivered",
      created_at: "2026-10-01T12:00:00.000Z",
      phone_number: "+2348095517762",
      message_type: "text",
    },
    {
      id: "chat-004-4",
      direction: "INBOUND",
      content: "Will do. One small thing — the common area cleaning schedule for the lobby seems to have shifted. Is it still Monday and Thursday?",
      status: "read",
      created_at: "2026-10-04T09:00:00.000Z",
      phone_number: "+2348095517762",
      message_type: "text",
    },
    {
      id: "chat-004-5",
      direction: "OUTBOUND",
      content: "Good catch, Adaeze. The schedule was adjusted to Tuesday and Friday starting this month. We'll circulate an updated notice to all Maple Court residents shortly.",
      status: "delivered",
      created_at: "2026-10-04T09:30:00.000Z",
      phone_number: "+2348095517762",
      message_type: "text",
    },
  ],
  "RES-005": [
    {
      id: "chat-005-1",
      direction: "OUTBOUND",
      content: "Hello Babatunde, your October Diesel invoice of ₦60,000 has been generated and is due by 10 October 2026. Kindly make payment before the due date.",
      status: "delivered",
      created_at: "2026-10-01T09:20:00.000Z",
      phone_number: "+2347023348810",
      message_type: "text",
    },
    {
      id: "chat-005-2",
      direction: "INBOUND",
      content: "Got it, I'll pay today. On another note — the pool pump is making a very loud grinding noise. It started about a week ago. Is a technician coming to look at it?",
      status: "read",
      created_at: "2026-10-01T10:05:00.000Z",
      phone_number: "+2347023348810",
      message_type: "text",
    },
    {
      id: "chat-005-3",
      direction: "OUTBOUND",
      content: "Thank you, Babatunde. We've logged the pool pump issue — it is currently In Progress. A specialist technician has been engaged and will inspect it this week to prevent further damage.",
      status: "delivered",
      created_at: "2026-10-01T10:40:00.000Z",
      phone_number: "+2347023348810",
      message_type: "text",
    },
    {
      id: "chat-005-4",
      direction: "INBOUND",
      content: "Good. The noise is really disturbing, especially at night. It woke me up twice this week. Please make it a priority.",
      status: "read",
      created_at: "2026-10-02T07:30:00.000Z",
      phone_number: "+2347023348810",
      message_type: "text",
    },
    {
      id: "chat-005-5",
      direction: "OUTBOUND",
      content: "Understood, Babatunde. We've flagged this as urgent and the technician is scheduled for tomorrow morning. We'll update you once the inspection is complete.",
      status: "delivered",
      created_at: "2026-10-02T08:00:00.000Z",
      phone_number: "+2347023348810",
      message_type: "text",
    },
    {
      id: "chat-005-6",
      direction: "INBOUND",
      content: "Thank you. I'll transfer the diesel payment now.",
      status: "read",
      created_at: "2026-10-02T08:20:00.000Z",
      phone_number: "+2347023348810",
      message_type: "text",
    },
  ],
  "RES-006": [
    {
      id: "chat-006-1",
      direction: "OUTBOUND",
      content: "Dear Chiamaka, your September Diesel invoice of ₦60,000 remains overdue. Please make payment as soon as possible to avoid any interruption to your diesel allocation.",
      status: "delivered",
      created_at: "2026-10-01T09:25:00.000Z",
      phone_number: "+2348156625531",
      message_type: "text",
    },
    {
      id: "chat-006-2",
      direction: "INBOUND",
      content: "I'm sorry about the delay. I've been travelling. I'll make the payment by Wednesday. Also I want to report that the reception entrance door closer is faulty — the door doesn't shut properly.",
      status: "read",
      created_at: "2026-10-01T13:00:00.000Z",
      phone_number: "+2348156625531",
      message_type: "text",
    },
    {
      id: "chat-006-3",
      direction: "OUTBOUND",
      content: "Thank you, Chiamaka. We've logged the reception door issue — our maintenance team will attend to it this week. Please make the overdue payment at your earliest convenience.",
      status: "delivered",
      created_at: "2026-10-01T14:00:00.000Z",
      phone_number: "+2348156625531",
      message_type: "text",
    },
    {
      id: "chat-006-4",
      direction: "INBOUND",
      content: "Will do. The door is a security concern especially at night. Can it be looked at as a priority?",
      status: "read",
      created_at: "2026-10-02T10:10:00.000Z",
      phone_number: "+2348156625531",
      message_type: "text",
    },
    {
      id: "chat-006-5",
      direction: "OUTBOUND",
      content: "Absolutely, Chiamaka. We've re-classified the reception door issue as urgent. A technician will be on site tomorrow morning to fix the door closer. We take security very seriously.",
      status: "delivered",
      created_at: "2026-10-02T10:45:00.000Z",
      phone_number: "+2348156625531",
      message_type: "text",
    },
  ],
};

export interface ResidentOtherDoc {
  id: string;
  name: string;
  date: string; // ISO date
}

export const MOCK_RESIDENT_OTHER_DOCS: Record<string, ResidentOtherDoc[]> = {
  "RES-001": [
    { id: "odoc-001-1", name: "Tenancy Agreement", date: "2026-01-15" },
    { id: "odoc-001-2", name: "Move-In Inspection Report", date: "2026-01-15" },
  ],
  "RES-002": [
    { id: "odoc-002-1", name: "Tenancy Agreement", date: "2026-02-03" },
    { id: "odoc-002-2", name: "Move-In Inspection Report", date: "2026-02-03" },
  ],
  "RES-003": [
    { id: "odoc-003-1", name: "Tenancy Agreement", date: "2026-01-28" },
    { id: "odoc-003-2", name: "Move-In Inspection Report", date: "2026-01-28" },
  ],
  "RES-004": [
    { id: "odoc-004-1", name: "Tenancy Agreement", date: "2026-03-10" },
    { id: "odoc-004-2", name: "Move-In Inspection Report", date: "2026-03-10" },
  ],
  "RES-005": [
    { id: "odoc-005-1", name: "Tenancy Agreement", date: "2026-03-22" },
    { id: "odoc-005-2", name: "Move-In Inspection Report", date: "2026-03-22" },
  ],
  "RES-006": [
    { id: "odoc-006-1", name: "Tenancy Agreement", date: "2026-04-01" },
    { id: "odoc-006-2", name: "Move-In Inspection Report", date: "2026-04-01" },
  ],
};
