/* eslint-disable */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { LandlordTopNav } from "./LandlordTopNav";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, Wrench, Users, Loader2, Filter, LayoutGrid, ChevronRight, X, ChevronDown, Check, AlertCircle, Send, MessageSquare, Paperclip, Play, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import AddManagerModal from "./AddManagerModal";
import { LandlordReportMaintenanceModal, LandlordMaintenancePayload } from "./LandlordReportMaintenanceModal";
import { toast } from "sonner";
import {
  useGetAllServiceRequests,
  StatusHistoryEvent,
} from "@/services/service-requests/query";
import { StatusBadgeDropdown, StatusEvent } from "./StatusBadgeDropdown";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  assignRequestToManager,
  getRequestAssignee,
  getRequestsForManager,
  subscribeToFMStore,
} from "@/lib/facilityManagerStore";
import {
  ThreadEntry,
  appendThreadEntry,
  updatePaymentRequest,
  getThread,
  makeMsgId,
  fmtThreadTime,
  fmtThreadDate,
  subscribeToThreadStore,
  isTaskPriority,
  setTaskPriority,
} from "@/lib/taskThreadStore";

interface LandlordFacilityProps {
  onBack?: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

interface FacilityManager {
  id: string;
  name: string;
  phone_number: string;
  email: string;
  role: string;
  date: string;
}

const MOCK_FACILITY_MANAGERS: FacilityManager[] = [
  {
    id: "fm-001",
    name: "Chukwuemeka Obi",
    phone_number: "+234 803 214 5678",
    email: "c.obi@facilitypro.ng",
    role: "facility_manager",
    date: "2025-09-10T00:00:00Z",
  },
  {
    id: "fm-002",
    name: "Amaka Nwosu",
    phone_number: "+234 806 332 9910",
    email: "a.nwosu@facilitypro.ng",
    role: "facility_manager",
    date: "2025-10-03T00:00:00Z",
  },
  {
    id: "fm-003",
    name: "Tunde Adeyemi",
    phone_number: "+234 812 554 7723",
    email: "t.adeyemi@facilitypro.ng",
    role: "facility_manager",
    date: "2025-11-18T00:00:00Z",
  },
  {
    id: "fm-004",
    name: "Ngozi Eze",
    phone_number: "+234 708 991 2244",
    email: "n.eze@facilitypro.ng",
    role: "facility_manager",
    date: "2026-01-07T00:00:00Z",
  },
  {
    id: "fm-005",
    name: "Femi Olawale",
    phone_number: "+234 815 663 8801",
    email: "f.olawale@facilitypro.ng",
    role: "facility_manager",
    date: "2026-02-14T00:00:00Z",
  },
  {
    id: "fm-006",
    name: "Blessing Okafor",
    phone_number: "+234 901 774 5532",
    email: "b.okafor@facilitypro.ng",
    role: "facility_manager",
    date: "2026-03-22T00:00:00Z",
  },
];

interface ResolutionDetails {
  summary: string;
  category: string;
  hadCost: boolean;
  costAmount?: string;
  resolvedAt: string;
  resolvedBy: string;
  artisanName?: string;
  artisanPhone?: string;
  rejectedByTenant?: boolean;
  tenantFeedback?: string;
}

interface ServiceRequest {
  id: string;
  request_id: string;
  tenant_name: string;
  property_name: string;
  issue_category: string;
  description: string;
  status: string;
  date_reported: string;
  resolution_date?: string | null;
  reopened_at?: string | null;
  issue_images?: string[] | null;
  attachments?: Array<{ url: string; type: "image" | "video"; group: "original" | "reopened" }>;
  notes?: string;
  tenant_id: string;
  property_id: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  statusHistory?: StatusHistoryEvent[];
  source?: "tenant" | "facility_manager";
  reporter_name?: string;
  resolution?: ResolutionDetails;
  resolutions?: ResolutionDetails[];
}

type RequestSource = "tenant" | "facility_manager";

function resolveSource(req: ServiceRequest): RequestSource {
  if (req.source) return req.source;
  const seed = (req.id || req.request_id || "").charCodeAt(0) || 0;
  return seed % 2 === 0 ? "tenant" : "facility_manager";
}

function reporterName(req: ServiceRequest): string {
  return req.reporter_name?.trim() || req.tenant_name;
}

const SOURCE_LABEL: Record<RequestSource, string> = {
  tenant: "Tenant",
  facility_manager: "Facility Manager",
};

const MOCK_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: "sr-001", request_id: "SR-001", tenant_name: "James Okafor", reporter_name: "James Okafor", source: "tenant",
    property_name: "Lekki Phase 1 Duplex", issue_category: "Plumbing",
    description: "Kitchen sink is leaking and water pools under the cabinet.",
    status: "open", date_reported: "2026-04-25T09:30:00.000Z", updated_at: "2026-04-26T11:00:00.000Z",
    tenant_id: "t-001", property_id: "p-001",
    attachments: [
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", type: "image", group: "original" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", type: "image", group: "original" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400", type: "image", group: "original" },
      { url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", group: "original" },
    ],
  },
  {
    id: "sr-002", request_id: "SR-002", tenant_name: "Adaeze Nwosu", reporter_name: "Adaeze Nwosu", source: "tenant",
    property_name: "Ikoyi 2-Bed Apartment", issue_category: "Electrical",
    description: "Living room sockets stopped working after last power outage.",
    status: "in_progress", date_reported: "2026-04-22T14:10:00.000Z", updated_at: "2026-04-27T08:20:00.000Z",
    tenant_id: "t-002", property_id: "p-002",
    attachments: [
      { url: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400", type: "image", group: "reopened" },
    ],
  },
  {
    id: "sr-003", request_id: "SR-003", tenant_name: "—", reporter_name: "Tobi Adekunle", source: "facility_manager",
    property_name: "Lekki Phase 1 Duplex", issue_category: "Common Area",
    description: "Driveway gate motor is jammed; needs replacement bracket.",
    status: "open", date_reported: "2026-04-26T07:45:00.000Z", updated_at: "2026-04-27T13:00:00.000Z",
    tenant_id: "", property_id: "p-001",
  },
  {
    id: "sr-004", request_id: "SR-004", tenant_name: "—", reporter_name: "Chinwe Obi", source: "facility_manager",
    property_name: "Ikoyi 2-Bed Apartment", issue_category: "Inspection",
    description: "Quarterly inspection found a cracked tile in the bathroom.",
    status: "resolved", date_reported: "2026-04-18T10:00:00.000Z", updated_at: "2026-04-24T16:30:00.000Z",
    tenant_id: "", property_id: "p-002",
    resolutions: [
      {
        summary: "Attempted to patch the cracked tile with adhesive filler. Appeared stable after initial inspection.",
        category: "Tiling & Flooring",
        hadCost: true,
        costAmount: "₦5,000",
        artisanName: "Kunle Fixes",
        artisanPhone: "0802 111 2233",
        resolvedAt: "2026-04-22T10:00:00.000Z",
        resolvedBy: "Tunde Adeyemi",
        rejectedByTenant: true,
        tenantFeedback: "The tile is still cracked and water seeps through.",
      },
      {
        summary: "Replaced the cracked floor tile near the shower drain. Re-grouted surrounding tiles and tested for water tightness. No further damage observed.",
        category: "Tiling & Flooring",
        hadCost: true,
        costAmount: "₦18,500",
        artisanName: "ProTile Services",
        artisanPhone: "0809 887 6654",
        resolvedAt: "2026-04-24T16:30:00.000Z",
        resolvedBy: "Tunde Adeyemi",
      },
    ],
  },
  {
    id: "sr-005", request_id: "SR-005", tenant_name: "Emmanuel Etim", reporter_name: "Emmanuel Etim", source: "tenant",
    property_name: "Victoria Island Studio", issue_category: "HVAC",
    description: "Air conditioner not cooling, just blowing warm air.",
    status: "urgent", date_reported: "2026-04-27T19:05:00.000Z", updated_at: "2026-04-27T21:05:00.000Z",
    tenant_id: "t-003", property_id: "p-003",
    attachments: [
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", type: "image" as const, group: "original" as const },
      { url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video" as const, group: "original" as const },
    ],
  },
  {
    id: "sr-006", request_id: "SR-006", tenant_name: "—", reporter_name: "Tobi Adekunle", source: "facility_manager" as const,
    property_name: "Lekki Phase 1 Duplex", issue_category: "Electrical",
    description: "Generator failed during power outage and building currently has no backup power.",
    status: "open", date_reported: "2026-04-28T09:15:00.000Z", updated_at: "2026-04-28T09:30:00.000Z",
    tenant_id: "", property_id: "p-001",
    attachments: [
      { url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400", type: "image" as const, group: "original" as const },
    ],
  },
  {
    id: "sr-007", request_id: "SR-007", tenant_name: "Chidi Okafor", reporter_name: "Chidi Okafor", source: "tenant" as const,
    property_name: "Greenfield Towers", issue_category: "Plumbing",
    description: "Major water leakage affecting multiple apartments on floors 3 and 4.",
    status: "open", date_reported: "2026-04-28T07:30:00.000Z", updated_at: "2026-04-28T07:50:00.000Z",
    tenant_id: "t-007", property_id: "p-004",
    attachments: [
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400", type: "image" as const, group: "original" as const },
      { url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video" as const, group: "original" as const },
    ],
  },
  // ── Reopened requests ─────────────────────────────────────────────────────
  {
    id: "sr-008", request_id: "SR-008", tenant_name: "James Okafor", reporter_name: "James Okafor", source: "tenant" as const,
    property_name: "Lekki Phase 1 Duplex", issue_category: "Plumbing",
    description: "Kitchen sink still leaking after repair.",
    status: "reopened", date_reported: "2026-05-10T09:00:00.000Z", updated_at: "2026-05-27T10:15:00.000Z",
    reopened_at: "2026-05-27T10:15:00.000Z",
    tenant_id: "t-001", property_id: "p-001",
    notes: "Tenant marked issue as not resolved.",
    attachments: [
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", type: "image" as const, group: "reopened" as const },
      { url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video" as const, group: "reopened" as const },
    ],
    resolutions: [
      {
        summary: "Replaced damaged pipe under sink. Joints sealed and checked for drips.",
        category: "Plumbing",
        hadCost: true,
        costAmount: "₦25,000",
        artisanName: "Musa Plumbing Services",
        artisanPhone: "0803 500 1122",
        resolvedAt: "2026-05-24T14:00:00.000Z",
        resolvedBy: "Chukwuemeka Obi",
        rejectedByTenant: true,
        tenantFeedback: "Water is still leaking under the sink.",
      },
    ],
  },
  {
    id: "sr-009", request_id: "SR-009", tenant_name: "Chidi Okafor", reporter_name: "Chidi Okafor", source: "tenant" as const,
    property_name: "Greenfield Towers", issue_category: "Electrical",
    description: "Generator still not powering common areas consistently.",
    status: "reopened", date_reported: "2026-05-08T11:30:00.000Z", updated_at: "2026-05-26T16:32:00.000Z",
    reopened_at: "2026-05-26T16:32:00.000Z",
    tenant_id: "t-004", property_id: "p-004",
    notes: "Issue partially resolved. Problem still occurring.",
    attachments: [
      { url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400", type: "image" as const, group: "reopened" as const },
    ],
    resolutions: [
      {
        summary: "Replaced faulty transfer switch on generator. Common areas power tested and appeared stable.",
        category: "Electrical",
        hadCost: true,
        costAmount: "₦68,000",
        artisanName: "Teknik Electrical Services",
        artisanPhone: "0802 345 6789",
        resolvedAt: "2026-05-23T16:00:00.000Z",
        resolvedBy: "Chukwuemeka Obi",
        rejectedByTenant: true,
        tenantFeedback: "Issue partially resolved. Problem still occurring in the evenings.",
      },
    ],
  },
  {
    id: "sr-010", request_id: "SR-010", tenant_name: "Emmanuel Etim", reporter_name: "Emmanuel Etim", source: "tenant" as const,
    property_name: "Victoria Island Studio", issue_category: "Tiling & Flooring",
    description: "Bathroom tiles replaced but water still seeps through the wall.",
    status: "reopened", date_reported: "2026-05-05T08:00:00.000Z", updated_at: "2026-05-25T09:20:00.000Z",
    reopened_at: "2026-05-25T09:20:00.000Z",
    tenant_id: "t-003", property_id: "p-003",
    notes: "Tenant reported the original issue still exists.",
    attachments: [
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", type: "image" as const, group: "reopened" as const },
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", type: "image" as const, group: "reopened" as const },
      { url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video" as const, group: "reopened" as const },
    ],
    resolutions: [
      {
        summary: "Re-grouted wall tiles in bathroom and applied waterproof sealant behind tiles.",
        category: "Tiling & Flooring",
        hadCost: true,
        costAmount: "₦32,000",
        artisanName: "ProTile Services",
        artisanPhone: "0809 887 6654",
        resolvedAt: "2026-05-22T11:30:00.000Z",
        resolvedBy: "Tunde Adeyemi",
        rejectedByTenant: true,
        tenantFeedback: "Water is still seeping through the wall after rain.",
      },
    ],
  },
];

// Thread types, helpers, and seed data live in @/lib/taskThreadStore (shared with FM dashboard)

// ── Common Areas types & mock data ────────────────────────────────────────────

interface CommonArea {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  openRequests: number;
}

const MOCK_COMMON_AREAS: CommonArea[] = [
  {
    id: "ca-001",
    name: "Main Lobby",
    address: "Ground Floor, Block A, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2025-11-01",
    openRequests: 2,
  },
  {
    id: "ca-002",
    name: "Rooftop Garden",
    address: "Rooftop Level, Block A, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2025-11-15",
    openRequests: 0,
  },
  {
    id: "ca-003",
    name: "Parking Lot B",
    address: "East Wing, Basement 1, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2025-12-03",
    openRequests: 1,
  },
  {
    id: "ca-004",
    name: "Generator Room",
    address: "Utility Block, Ground Floor, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2026-01-10",
    openRequests: 1,
  },
  {
    id: "ca-005",
    name: "Laundry Room",
    address: "Floor 2, Block B, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2026-02-20",
    openRequests: 0,
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export function LandlordFacility({
  onBack,
  onMenuClick,
  isMobile = false,
}: LandlordFacilityProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = user?.role || pathname.split("/")[1] || "landlord";

  const [activeTab, setActiveTab] = useState<"service_requests" | "common_areas" | "facility_managers">("service_requests");
  const [lightbox, setLightbox] = useState<{ items: Array<{ url: string; type: "image" | "video" }>; index: number } | null>(null);
  const [, fmStoreTick] = useState(0);
  const [, threadTick] = useState(0);
  const [threadInput, setThreadInput] = useState("");
  const threadTextareaRef = useRef<HTMLTextAreaElement>(null);
  const autoResizeThread = useCallback(() => {
    const el = threadTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    const unsubFM = subscribeToFMStore(() => fmStoreTick((n) => n + 1));
    const unsubThread = subscribeToThreadStore(() => threadTick((n) => n + 1));
    return () => { unsubFM(); unsubThread(); };
  }, []);

  // ── Facility Managers ──────────────────────────────────────────────────────
  const [managers, setManagers] = useState<FacilityManager[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [detailManager, setDetailManager] = useState<FacilityManager | null>(null);
  const [isEditingManager, setIsEditingManager] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [confirmDeleteManager, setConfirmDeleteManager] = useState(false);

  const deleteManager = () => {
    if (!detailManager) return;
    setManagers((prev) => prev.filter((m) => m.id !== detailManager.id));
    setConfirmDeleteManager(false);
    setDetailManager(null);
    setIsEditingManager(false);
    toast.success("Facility Manager deleted successfully");
  };

  const openDetailModal = (manager: FacilityManager) => {
    setDetailManager(manager);
    setIsEditingManager(false);
  };

  const startEdit = () => {
    if (!detailManager) return;
    setEditName(detailManager.name);
    setEditPhone(detailManager.phone_number);
    setIsEditingManager(true);
  };

  const saveEdit = () => {
    if (!detailManager || !editName.trim()) return;
    const updated = { ...detailManager, name: editName.trim(), phone_number: editPhone.trim() };
    setManagers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setDetailManager(updated);
    setIsEditingManager(false);
  };

  // ── Maintenance Requests ───────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusGroupFilter, setStatusGroupFilter] = useState<"in_progress" | "resolved" | "closed" | "reopened">("in_progress");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const page = 1;
  const size = 50;

  const { data, isLoading: loadingRequests, error } = useGetAllServiceRequests({
    page,
    size,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  // Design sandbox — always show the mock dataset so resolution previews are
  // visible regardless of what the API returns.
  const [localRequests, setLocalRequests] = useState<ServiceRequest[]>([]);
  const requests: ServiceRequest[] = [...localRequests, ...MOCK_SERVICE_REQUESTS];

  const [reportModalOpen, setReportModalOpen] = useState(false);

  // appendThreadEntry imported from @/lib/taskThreadStore

  // ── Common Areas ───────────────────────────────────────────────────────────
  const [caSearchQuery, setCaSearchQuery] = useState("");
  const [commonAreas, setCommonAreas] = useState<CommonArea[]>(MOCK_COMMON_AREAS);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaAddress, setNewAreaAddress] = useState("");
  const [areaNameError, setAreaNameError] = useState("");
  const [areaAddressError, setAreaAddressError] = useState("");

  // Payment request decline modal
  const [declineModal, setDeclineModal] = useState<{ taskId: string; entryId: string } | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const filteredAreas = useMemo(
    () =>
      commonAreas.filter(
        (ca) =>
          ca.name.toLowerCase().includes(caSearchQuery.toLowerCase()) ||
          ca.address.toLowerCase().includes(caSearchQuery.toLowerCase()),
      ),
    [commonAreas, caSearchQuery],
  );

  const handleAddArea = () => {
    let valid = true;
    if (!newAreaName.trim()) { setAreaNameError("Name is required"); valid = false; }
    if (!newAreaAddress.trim()) { setAreaAddressError("Address is required"); valid = false; }
    if (!valid) return;
    setCommonAreas((prev) => [
      {
        id: `ca-${Date.now()}`,
        name: newAreaName.trim(),
        address: newAreaAddress.trim(),
        createdAt: new Date().toISOString().split("T")[0],
        openRequests: 0,
      },
      ...prev,
    ]);
    closeAreaModal();
  };

  const closeAreaModal = () => {
    setShowAddAreaModal(false);
    setNewAreaName("");
    setNewAreaAddress("");
    setAreaNameError("");
    setAreaAddressError("");
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
      ", " +
      date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getRelativeTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  };

  const formatStatusLabel = (status: string) =>
    status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const formatStatusHistory = (statusHistory?: StatusHistoryEvent[]): StatusEvent[] => {
    if (!statusHistory || statusHistory.length === 0) return [];
    return statusHistory.map((event) => ({
      status: formatStatusLabel(event.new_status),
      timestamp: formatDateTime(event.changed_at),
      datetime: event.changed_at,
    }));
  };

  const fetchManagers = () => {
    setManagers(MOCK_FACILITY_MANAGERS);
    setLoadingManagers(false);
  };

  useEffect(() => { fetchManagers(); }, []);

  const handleAddManager = async (name: string, phone: string) => {
    const newManager: FacilityManager = {
      id: `fm-${Date.now()}`,
      name,
      phone_number: phone,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@facilitypro.ng`,
      role: "facility_manager",
      date: new Date().toISOString(),
    };
    setManagers((prev) => [newManager, ...prev]);
    toast.success("Facility manager added successfully");
  };

  const properties = ["all", ...new Set(requests.map((r) => r.property_name))];

  const STATUS_GROUP_MAP: Record<typeof statusGroupFilter, string[]> = {
    in_progress: ["open", "pending", "in_progress", "assigned", "urgent"],
    resolved: ["resolved"],
    closed: ["closed", "completed"],
    reopened: ["reopened"],
  };

  const filteredRequests = requests
    .filter((request) => {
      const effectiveStatus = (statusOverrides[request.id] ?? request.status ?? "").toLowerCase();
      const matchesStatusGroup = STATUS_GROUP_MAP[statusGroupFilter].includes(effectiveStatus);
      const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        (request.issue_category ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.property_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        reporterName(request).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProperty = propertyFilter === "all" || request.property_name === propertyFilter;
      return matchesStatusGroup && matchesStatus && matchesSearch && matchesProperty;
    })
    .sort((a, b) => {
      const aPriority = isTaskPriority(a.id) ? 0 : 1;
      const bPriority = isTaskPriority(b.id) ? 0 : 1;
      return aPriority - bPriority;
    });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <LandlordTopNav
        title="Facility"
        onBack={onBack}
        onAddNew={activeTab === "common_areas" ? () => setShowAddAreaModal(true) : () => setShowAddModal(true)}
        buttonText={activeTab === "common_areas" ? "Add Common Area" : "Add Facility Manager"}
        onMenuClick={onMenuClick}
        isMobile={isMobile}
        secondaryAction={activeTab === "service_requests" ? () => setReportModalOpen(true) : undefined}
        secondaryButtonText={activeTab === "service_requests" ? "Report Maintenance Request" : undefined}
      />

      {/* Tab bar */}
      <div className="fixed top-[73px] lg:top-[81px] right-0 left-0 lg:left-72 z-10 bg-white border-b border-gray-200">
        <div className="px-6 flex gap-6">
          {(["service_requests", "common_areas", "facility_managers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "border-[#FF5000] text-[#FF5000] font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "service_requests" ? "Maintenance Requests" : tab === "common_areas" ? "Common Areas" : "Facility Managers"}
            </button>
          ))}
        </div>
      </div>

      {/* Content — offset for nav + tab bar (~121px / ~129px) */}
      <div className="pt-[121px] lg:pt-[129px] px-6 py-6 space-y-8">

        {/* ── Maintenance Requests tab ── */}
        {activeTab === "service_requests" && (
          <>
            {/* Maintenance Requests */}
            <div>
              <div className="bg-white rounded-xl p-4 shadow-sm mb-6 max-w-xl">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search requests..."
                      className="pl-10"
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-4">
                        <div>
                          <h4 className="mb-2 text-sm font-medium">Status</h4>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="reopened">Reopened</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-medium">Property</h4>
                          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by Property" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Properties</SelectItem>
                              {properties.filter((p) => p !== "all").map((property) => (
                                <SelectItem key={property} value={property}>{property}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Status group filter */}
              <div className="mb-2.5 flex items-center gap-1.5 flex-wrap">
                {([
                  { value: "in_progress", label: "In Progress" },
                  { value: "resolved", label: "Resolved" },
                  { value: "closed", label: "Closed" },
                  { value: "reopened", label: "Reopened" },
                ] as const).map((opt) => {
                  const active = statusGroupFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatusGroupFilter(opt.value)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        active
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {loadingRequests && (
                <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading maintenance requests...</p>
                </div>
              )}

              {error && (
                <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <Wrench className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg text-gray-900 mb-2">Error loading requests</h3>
                  <p className="text-gray-500">{error instanceof Error ? error.message : "Please try again later."}</p>
                </div>
              )}

              {!loadingRequests && !error && filteredRequests.length === 0 && (
                <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Wrench className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg text-gray-900 mb-2">No maintenance requests yet.</h3>
                  <p className="text-gray-500">Requests from your tenants will appear here.</p>
                </div>
              )}

              {!loadingRequests && !error && filteredRequests.length > 0 && (() => {
                const renderCard = (request: ServiceRequest) => {
                  const assignee = getRequestAssignee(request.id);
                  const isPriority = isTaskPriority(request.id);
                  return (
                  <div
                    key={request.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedRequest(request)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedRequest(request);
                      }
                    }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:bg-gray-50 active:scale-[0.98] active:duration-100 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF5000] focus:ring-offset-1"
                  >
                      <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-base font-medium text-gray-900 leading-snug">{request.description}</h3>
                      {isPriority && (
                        <span className="shrink-0 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded mt-0.5">
                          Priority
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Property:</span>
                        <span className="text-sm text-gray-900">{request.property_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Reported by:</span>
                        <span className="text-sm text-gray-900">
                          {SOURCE_LABEL[resolveSource(request)]} – {reporterName(request)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Assigned to:</span>
                        {assignee ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                            <Users className="w-3 h-3" />
                            {assignee.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-500">
                      <div>
                        <span className="text-gray-600">Date Reported: </span>
                        <span>{formatDateTime(request.date_reported)}</span>
                      </div>
                      <div className="text-xs">
                        Last Updated: {getRelativeTime(request.updated_at || request.updatedAt)}
                      </div>
                    </div>
                    {request.attachments && request.attachments.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">{request.attachments.length} attachment{request.attachments.length !== 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>
                  );
                };

                return <div className="space-y-4">{filteredRequests.map(renderCard)}</div>;
              })()}
            </div>
          </>
        )}

        {/* ── Common Areas tab ── */}
        {activeTab === "common_areas" && (
          <div>
            {/* Tab header row */}
            <div className="mb-5 sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search common areas…"
                  value={caSearchQuery}
                  onChange={(e) => setCaSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Empty state */}
            {filteredAreas.length === 0 && (
              <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <LayoutGrid className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">
                  {caSearchQuery ? "No results found" : "No common areas yet"}
                </h3>
                <p className="text-sm text-gray-500">
                  {caSearchQuery ? "Try a different search term." : "Add your first common area to get started."}
                </p>
              </div>
            )}

            {/* List */}
            {filteredAreas.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
                {filteredAreas.map((ca) => (
                  <button
                    key={ca.id}
                    onClick={() => router.push(`/${userRole}/common-area-detail?id=${ca.id}`)}
                    className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                      <LayoutGrid className="w-4 h-4 text-[#FF5000]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{ca.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{ca.address}</p>
                      <p className="text-xs text-gray-400 mt-1">Added {formatDate(ca.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {ca.openRequests > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-full">
                          {ca.openRequests} open
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4">
              {filteredAreas.length} {filteredAreas.length === 1 ? "area" : "areas"}
              {caSearchQuery ? " found" : " total"}
            </p>
          </div>
        )}

        {/* ── Facility Managers tab ── */}
        {activeTab === "facility_managers" && (
          <div>

            {loadingManagers ? (
              <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : managers.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg text-gray-900 mb-2">No facility managers added yet.</h3>
                <p className="text-gray-500">Add your first facility manager to get started.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-4 px-6 text-sm text-gray-600">Name</th>
                      <th className="text-left py-4 px-6 text-sm text-gray-600">Phone Number</th>
                      <th className="text-left py-4 px-6 text-sm text-gray-600">Active Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((manager) => {
                      const activeCount = getRequestsForManager(manager.id).filter(
                        (rid) => {
                          const req = requests.find((r) => r.id === rid);
                          if (!req) return false;
                          const status = (statusOverrides[req.id] ?? req.status).toLowerCase();
                          return status !== "resolved" && status !== "closed";
                        },
                      ).length;
                      return (
                        <tr
                          key={manager.id}
                          onClick={() => openDetailModal(manager)}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-0"
                        >
                          <td className="py-4 px-6 text-gray-900">{manager.name}</td>
                          <td className="py-4 px-6 text-gray-600">{manager.phone_number}</td>
                          <td className="py-4 px-6">
                            {activeCount > 0 ? (
                              <span className="inline-flex items-center text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-full">
                                {activeCount} active
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">None</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Facility Manager modal */}
      <AddManagerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddManager}
      />

      {/* Facility Manager detail modal */}
      {detailManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h2 className="text-base font-semibold text-gray-900">Facility Manager</h2>
              <button
                onClick={() => { setDetailManager(null); setIsEditingManager(false); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Avatar + name/phone */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-[#FF5000] font-semibold text-sm">
                    {detailManager.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                {isEditingManager ? (
                  <div className="flex-1 space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Full name"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Phone number"
                      className="h-8 text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{detailManager.name}</p>
                    <p className="text-xs text-gray-500">{detailManager.phone_number}</p>
                  </div>
                )}
              </div>

              {/* Date added */}
              <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
                <span className="text-sm text-gray-500">Date Added</span>
                <span className="text-sm text-gray-900">{formatDate(detailManager.date)}</span>
              </div>

              {/* Active maintenance requests */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Active Maintenance Requests
                </p>
                {(() => {
                  const assignedReqIds = getRequestsForManager(detailManager.id);
                  const activeStatuses = ["open", "in_progress", "reopened", "pending", "urgent"];
                  const activeReqs = requests.filter((r) =>
                    assignedReqIds.includes(r.id) &&
                    activeStatuses.includes((statusOverrides[r.id] ?? r.status).toLowerCase())
                  );
                  if (activeReqs.length === 0) {
                    return (
                      <p className="text-sm text-gray-500">
                        No active maintenance requests assigned.
                      </p>
                    );
                  }
                  return (
                    <ul className="space-y-2">
                      {activeReqs.map((r) => (
                        <li
                          key={r.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedRequest(r)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedRequest(r); } }}
                          className="flex items-start gap-2 px-3 py-2.5 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF5000] focus:ring-offset-1"
                        >
                          <Wrench className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 leading-snug mb-0.5">
                              {r.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {r.property_name} · {formatStatusLabel(statusOverrides[r.id] ?? r.status)}
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 shrink-0">
              {isEditingManager ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsEditingManager(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-[#FF5000] hover:bg-[#E64800] text-white"
                    onClick={saveEdit}
                    disabled={!editName.trim()}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDeleteManager(true)}
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Delete
                  </Button>
                  <Button
                    className="flex-1 bg-[#FF5000] hover:bg-[#E64800] text-white"
                    onClick={startEdit}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Facility Manager confirmation */}
      <Dialog open={confirmDeleteManager} onOpenChange={setConfirmDeleteManager}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Facility Manager?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            This will remove{" "}
            <span className="font-medium text-gray-900">{detailManager?.name}</span>
            . Any maintenance requests currently assigned to them will become unassigned.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteManager(false)}>
              Cancel
            </Button>
            <Button onClick={deleteManager} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Common Area modal */}
      {showAddAreaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Add Common Area</h2>
              <button onClick={closeAreaModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newAreaName}
                  onChange={(e) => { setNewAreaName(e.target.value); if (areaNameError) setAreaNameError(""); }}
                  placeholder="e.g. Main Lobby"
                  className={areaNameError ? "border-red-500" : ""}
                  autoFocus
                />
                {areaNameError && <p className="text-xs text-red-500 mt-1">{areaNameError}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">
                  Address <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newAreaAddress}
                  onChange={(e) => { setNewAreaAddress(e.target.value); if (areaAddressError) setAreaAddressError(""); }}
                  placeholder="e.g. Ground Floor, Block A, 14 Admiralty Way"
                  className={areaAddressError ? "border-red-500" : ""}
                />
                {areaAddressError && <p className="text-xs text-red-500 mt-1">{areaAddressError}</p>}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeAreaModal}>Cancel</Button>
              <Button className="flex-1 bg-[#FF5000] hover:bg-[#E64800] text-white" onClick={handleAddArea}>
                Add Area
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Maintenance Request Detail — Mobile full-screen view ──────────────── */}
      {isMobile && selectedRequest && (() => {
        const req = selectedRequest;
        const currentStatus = statusOverrides[req.id] ?? req.status;
        const source = resolveSource(req);
        const isApproved = ["in_progress", "resolved", "closed"].includes(currentStatus.toLowerCase());
        const assignee = getRequestAssignee(req.id);
        const canApprove = !!assignee && !isApproved;
        const isPriority = isTaskPriority(req.id);

        const setStatus = (next: string, message: string) => {
          setStatusOverrides((prev) => ({ ...prev, [req.id]: next }));
          setSelectedRequest((r) => (r ? { ...r, status: next } : r));
          toast.success(message);
        };

        const togglePriority = () => {
          const wasPriority = isTaskPriority(req.id);
          setTaskPriority(req.id, !wasPriority);
          if (wasPriority) {
            toast.success("Priority removed.");
            appendThreadEntry(req.id, { id: makeMsgId(), type: "event", body: "Priority removed", timestamp: new Date().toISOString() });
          } else {
            toast.success("Marked as priority.");
            appendThreadEntry(req.id, { id: makeMsgId(), type: "event", body: "Marked as priority", timestamp: new Date().toISOString() });
          }
        };

        const thread = getThread(req.id);
        const groups: { label: string; entries: ThreadEntry[] }[] = [];
        for (const entry of thread) {
          const label = fmtThreadDate(entry.timestamp);
          const last = groups[groups.length - 1];
          if (last && last.label === label) { last.entries.push(entry); }
          else { groups.push({ label, entries: [entry] }); }
        }

        const sendMessage = () => {
          const body = threadInput.trim();
          if (!body) return;
          appendThreadEntry(req.id, { id: makeMsgId(), type: "message", author: "landlord", authorName: "You", body, timestamp: new Date().toISOString() });
          setThreadInput("");
          if (threadTextareaRef.current) threadTextareaRef.current.style.height = "auto";
        };

        const statusColors: Record<string, string> = {
          open: "bg-yellow-100 text-yellow-700 border-yellow-200",
          pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
          in_progress: "bg-blue-100 text-blue-700 border-blue-200",
          resolved: "bg-green-100 text-green-700 border-green-200",
          urgent: "bg-red-100 text-red-700 border-red-200",
          reopened: "bg-red-100 text-red-700 border-red-200",
          closed: "bg-gray-100 text-gray-700 border-gray-200",
        };

        return (
          <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
            {/* Fixed top nav */}
            <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Back"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{req.description}</p>
                {isApproved && assignee ? (
                  <p className="text-xs text-[#FF5000] mt-0.5 font-medium">Assigned to {assignee.name}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">{req.property_name}</p>
                )}
              </div>
              <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${statusColors[currentStatus.toLowerCase()] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                {formatStatusLabel(currentStatus)}
              </span>
            </div>

            {/* Scrollable body */}
            <div className={`flex-1 overflow-y-auto ${isApproved ? "pb-[72px]" : "pb-6"}`}>
              <div className="px-4 py-5 space-y-6">

                {/* Details grid */}
                <div className="bg-white rounded-xl p-4 space-y-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Property</p>
                      <p className="text-gray-900 leading-snug">{req.property_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Category</p>
                      <p className="text-gray-900">{req.issue_category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Reported by</p>
                      <p className="text-gray-900 leading-snug">{SOURCE_LABEL[source]} – {reporterName(req)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Last Updated</p>
                      <p className="text-gray-900">{getRelativeTime(req.updated_at || req.updatedAt)}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 mb-1">Date Reported</p>
                    <p className="text-sm text-gray-900">{formatDateTime(req.date_reported)}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{req.description}</p>
                </div>

                {/* Reopened notice */}
                {req.reopened_at && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Reopened</p>
                    </div>
                    <p className="text-xs text-red-600 mb-0.5">Last reopened: {formatDateTime(req.reopened_at)}</p>
                    {req.notes && <p className="text-xs text-red-500 italic mt-1">"{req.notes}"</p>}
                  </div>
                )}

                {/* Assigned FM — hidden after approval */}
                {!isApproved && <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Assigned Facility Manager</p>
                  <Select
                    value={assignee?.id ?? "unassigned"}
                    onValueChange={(value) => {
                      const nextId = value === "unassigned" ? null : value;
                      assignRequestToManager(req.id, nextId);
                      fmStoreTick((n) => n + 1);
                      if (nextId) {
                        const fm = managers.find((m) => m.id === nextId);
                        toast.success(`Assigned to ${fm?.name ?? "facility manager"}. WhatsApp notification sent.`);
                        appendThreadEntry(req.id, { id: makeMsgId(), type: "event", body: `Assigned to ${fm?.name ?? "facility manager"}`, timestamp: new Date().toISOString() });
                      } else {
                        toast.success("Request unassigned");
                        appendThreadEntry(req.id, { id: makeMsgId(), type: "event", body: "Facility manager unassigned", timestamp: new Date().toISOString() });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a facility manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-gray-400 mt-2">Assigning sends a WhatsApp notification to the facility manager.</p>
                </div>}

                {/* Attachments */}
                {(() => {
                  const allAttachments = req.attachments ?? (req.issue_images ? req.issue_images.map((url) => ({ url, type: "image" as const, group: "original" as const })) : []);
                  if (allAttachments.length === 0) return null;
                  const origItems = allAttachments.filter((a) => a.group === "original");
                  const reopenedItems = allAttachments.filter((a) => a.group === "reopened");
                  const showGroupLabels = origItems.length > 0 && reopenedItems.length > 0;
                  const renderGroup = (items: typeof allAttachments, label: string) => {
                    if (items.length === 0) return null;
                    const lightboxItems = items.map((a) => ({ url: a.url, type: a.type }));
                    const MAX_VISIBLE = 4;
                    const visible = items.slice(0, MAX_VISIBLE - 1);
                    const extra = items.length - visible.length;
                    const showExtra = extra > 1;
                    const displayItems = showExtra ? visible : items.slice(0, MAX_VISIBLE);
                    return (
                      <div key={label}>
                        {showGroupLabels && <p className="text-[11px] text-gray-400 font-medium mb-1.5">{label}</p>}
                        <div className="grid grid-cols-3 gap-2">
                          {displayItems.map((item, i) => (
                            <button
                              key={i}
                              onClick={() => setLightbox({ items: lightboxItems, index: i })}
                              className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF5000]"
                            >
                              {item.type === "video" ? (
                                <>
                                  <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                                      <Play className="w-4 h-4 text-gray-800 ml-0.5" />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <img src={item.url} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
                              )}
                            </button>
                          ))}
                          {showExtra && (
                            <button
                              onClick={() => setLightbox({ items: lightboxItems, index: visible.length })}
                              className="rounded-lg border border-gray-200 aspect-square bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF5000]"
                            >
                              +{extra + 1} more
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  };
                  return (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Attachments</p>
                      <div className="space-y-3">
                        {renderGroup(origItems, "Original Request")}
                        {renderGroup(reopenedItems, "Reopened Request")}
                      </div>
                    </div>
                  );
                })()}

                {/* Thread — visible only after approval */}
                {isApproved && <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Updates & Thread</p>
                  </div>

                  <div className="space-y-1 mb-4">
                    {groups.length === 0 && (
                      <p className="text-xs text-gray-400 italic py-2">No updates yet. Add the first update below.</p>
                    )}
                    {groups.map((group) => (
                      <div key={group.label}>
                        <div className="flex items-center gap-2 my-4">
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-[10px] text-gray-400 font-medium">{group.label}</span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <div className="space-y-3">
                          {group.entries.map((entry) => {
                            if (entry.type === "event") {
                              return (
                                <div key={entry.id} className="flex items-center gap-2 py-0.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                                  <p className="text-xs text-gray-400 flex-1">{entry.body}</p>
                                  <span className="text-[10px] text-gray-300 shrink-0">{fmtThreadTime(entry.timestamp)}</span>
                                </div>
                              );
                            }

                            if (entry.type === "payment_request") {
                              const isPending = entry.status === "pending";
                              const isApproved = entry.status === "approved";
                              const isDeclined = entry.status === "declined";
                              const taskId = selectedRequest?.id ?? "";
                              return (
                                <div key={entry.id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/60">
                                  {/* Card header */}
                                  <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-gray-100 bg-gray-100/70">
                                    <div className="flex items-center gap-2">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/>
                                      </svg>
                                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Payment Request</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">{fmtThreadTime(entry.timestamp)}</span>
                                  </div>
                                  {/* Card body */}
                                  <div className="px-3.5 py-3 flex flex-col gap-2">
                                    <div>
                                      <p className="text-[10px] text-gray-400 mb-0.5">Amount</p>
                                      <p className="text-lg font-bold text-gray-900 tabular-nums leading-tight">{entry.amount}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-400 mb-0.5">Reason</p>
                                      <p className="text-sm text-gray-700 leading-snug">{entry.reason}</p>
                                    </div>
                                    {entry.category && (
                                      <div>
                                        <p className="text-[10px] text-gray-400 mb-0.5">Category</p>
                                        <p className="text-sm text-gray-700">{entry.category}</p>
                                      </div>
                                    )}
                                    {/* Status row */}
                                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                                      <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                                        isApproved ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                                        isDeclined ? "bg-red-50 border-red-200 text-red-800" :
                                        "bg-amber-50 border-amber-200 text-amber-800"
                                      }`}>
                                        {isApproved ? "✅ Approved" : isDeclined ? "❌ Declined" : "⏳ Pending Approval"}
                                      </span>
                                      {entry.attachmentName && (
                                        <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                          {entry.attachmentName}
                                        </span>
                                      )}
                                    </div>
                                    {/* Approved detail */}
                                    {isApproved && entry.approvedBy && (
                                      <p className="text-[11px] text-emerald-700 border-t border-emerald-100 pt-2 mt-1">
                                        Approved by <strong>{entry.approvedBy}</strong>
                                        {entry.approvedAt && <> · {new Date(entry.approvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} {fmtThreadTime(entry.approvedAt)}</>}
                                      </p>
                                    )}
                                    {/* Declined detail */}
                                    {isDeclined && entry.declinedReason && (
                                      <p className="text-[11px] text-red-700 border-t border-red-100 pt-2 mt-1">
                                        <strong>Reason for Decline:</strong> {entry.declinedReason}
                                      </p>
                                    )}
                                    {/* Approve / Decline actions — Property Manager only */}
                                    {isPending && (
                                      <div className="flex gap-2 pt-1 mt-1 border-t border-gray-100">
                                        <button
                                          onClick={() => updatePaymentRequest(taskId, entry.id, { status: "approved", approvedBy: "Tunji Oginni", approvedAt: new Date().toISOString() })}
                                          className="flex-1 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => { setDeclineModal({ taskId, entryId: entry.id }); setDeclineReason(""); }}
                                          className="flex-1 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
                                        >
                                          Decline
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            const isLandlord = entry.author === "landlord";
                            return (
                              <div key={entry.id} className={`flex flex-col gap-1 ${isLandlord ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                  isLandlord ? "bg-[#FF5000] text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"
                                }`}>
                                  {entry.body}
                                </div>
                                <div className={`flex items-center gap-1.5 ${isLandlord ? "flex-row-reverse" : ""}`}>
                                  <span className="text-[10px] text-gray-400 font-medium">{isLandlord ? "You" : entry.authorName}</span>
                                  <span className="text-[10px] text-gray-300">·</span>
                                  <span className="text-[10px] text-gray-400">{fmtThreadTime(entry.timestamp)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>}

                {/* Resolution History */}
                {(req.resolutions ?? (req.resolution ? [req.resolution] : [])).length > 0 && (() => {
                  const resArr = req.resolutions ?? (req.resolution ? [req.resolution] : []);
                  return (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Resolution History</p>
                      <div className="flex flex-col gap-3">
                        {[...resArr].reverse().map((attempt, revIdx) => {
                          const origIdx = resArr.length - 1 - revIdx;
                          const attemptNum = origIdx + 1;
                          const isLatest = revIdx === 0;
                          return (
                            <div key={origIdx}>
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 overflow-hidden shadow-sm">
                                <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-emerald-200/70 bg-emerald-50">
                                  <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                                    <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">Resolution Attempt {attemptNum}</p>
                                  </div>
                                  {attempt.rejectedByTenant && (
                                    <span className="text-[10px] font-semibold text-red-800 bg-red-100 border border-red-200 rounded-full px-2 py-0.5">Rejected by tenant</span>
                                  )}
                                </div>
                                <div className="px-4 py-3.5 space-y-2.5 text-sm">
                                  <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Description</p>
                                    <p className="text-gray-900 whitespace-pre-line leading-relaxed">{attempt.summary}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div>
                                      <p className="text-xs text-gray-500 mb-0.5">Job category</p>
                                      <p className="text-gray-900">{attempt.category}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 mb-0.5">Cost</p>
                                      <p className="text-gray-900 tabular-nums">{attempt.hadCost ? attempt.costAmount || "—" : "No cost"}</p>
                                    </div>
                                    {attempt.artisanName && <div>
                                      <p className="text-xs text-gray-500 mb-0.5">Artisan name</p>
                                      <p className="text-gray-900">{attempt.artisanName}</p>
                                    </div>}
                                    {attempt.artisanPhone && <div>
                                      <p className="text-xs text-gray-500 mb-0.5">Phone number</p>
                                      <p className="text-gray-900">{attempt.artisanPhone}</p>
                                    </div>}
                                    <div>
                                      <p className="text-xs text-gray-500 mb-0.5">Date resolved</p>
                                      <p className="text-gray-900">{formatDateTime(attempt.resolvedAt)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 mb-0.5">Facility manager</p>
                                      <p className="text-gray-900">{attempt.resolvedBy}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {attempt.rejectedByTenant && attempt.tenantFeedback && (
                                <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                  <p className="text-xs text-amber-800 italic">"{attempt.tenantFeedback}"</p>
                                </div>
                              )}
                              {isLatest && !attempt.rejectedByTenant && (
                                <div className="mt-1.5 bg-gray-100 rounded-lg px-3 py-1.5">
                                  <p className="text-[11px] text-gray-500 italic">Awaiting tenant confirmation</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Actions (priority + approve) */}
                <div className="space-y-3">
                  {!isApproved && !assignee && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      Assign a facility manager before approving this request.
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className={`flex-1 ${isPriority ? "border-orange-300 text-orange-700 hover:bg-orange-50" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                      onClick={togglePriority}
                    >
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                      {isPriority ? "Remove Priority" : "Add Priority"}
                    </Button>
                    <Button
                      disabled={!canApprove}
                      className="flex-1 bg-[#FF5000] hover:bg-[#e04600] text-white"
                      onClick={() => {
                        setStatus("in_progress", `Request approved. ${assignee?.name ?? "Facility manager"} notified on WhatsApp; tenant updated.`);
                        appendThreadEntry(req.id, { id: makeMsgId(), type: "event", body: `Request approved${assignee ? ` — ${assignee.name} notified` : ""}`, timestamp: new Date().toISOString() });
                      }}
                    >
                      {isApproved ? "Approved" : "Approve Request"}
                    </Button>
                  </div>
                </div>

              </div>
            </div>

            {/* Fixed thread input at bottom — visible only after approval */}
            {isApproved && <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-10">
              <div className="flex items-end gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus-within:border-gray-400 focus-within:bg-white transition-colors">
                <textarea
                  ref={threadTextareaRef}
                  rows={1}
                  value={threadInput}
                  onChange={(e) => { setThreadInput(e.target.value); autoResizeThread(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Add an update…"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none"
                  style={{ maxHeight: 120, overflowY: "auto", lineHeight: "1.5" }}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!threadInput.trim()}
                  className="shrink-0 w-8 h-8 rounded-lg bg-[#FF5000] disabled:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>}
          </div>
        );
      })()}

      {/* ── Maintenance Request Detail Modal — Desktop ────────────────────────── */}
      {!isMobile && (
      <Dialog open={!!selectedRequest} onOpenChange={(v) => !v && setSelectedRequest(null)}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {selectedRequest && (() => {
            const currentStatus = statusOverrides[selectedRequest.id] ?? selectedRequest.status;
            const source = resolveSource(selectedRequest);
            const isApproved = ["in_progress", "resolved", "closed"].includes(currentStatus.toLowerCase());
            const desktopAssignee = getRequestAssignee(selectedRequest.id);
            const setStatus = (next: string, message: string) => {
              setStatusOverrides((prev) => ({ ...prev, [selectedRequest.id]: next }));
              setSelectedRequest((r) => (r ? { ...r, status: next } : r));
              toast.success(message);
            };
            return (
              <>
                {/* Header: title (left) + status badge (top-right) */}
                <DialogHeader>
                  <div className="flex items-start gap-3 pr-8">
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-lg font-semibold leading-snug">
                        {selectedRequest.description}
                      </DialogTitle>
                      {isApproved && desktopAssignee && (
                        <p className="text-xs text-[#FF5000] mt-0.5 font-medium">Assigned to {desktopAssignee.name}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 mt-0.5 text-xs px-2.5 py-1 rounded-full border ${
                        ({
                          open: "bg-yellow-100 text-yellow-700 border-yellow-200",
                          pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
                          in_progress: "bg-blue-100 text-blue-700 border-blue-200",
                          resolved: "bg-green-100 text-green-700 border-green-200",
                          urgent: "bg-red-100 text-red-700 border-red-200",
                          reopened: "bg-red-100 text-red-700 border-red-200",
                          closed: "bg-gray-100 text-gray-700 border-gray-200",
                        } as Record<string, string>)[currentStatus.toLowerCase()] ?? "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {formatStatusLabel(currentStatus)}
                    </span>
                  </div>
                </DialogHeader>

                <div className="space-y-6 py-2">
                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Property</p>
                      <p className="text-gray-900">{selectedRequest.property_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Reported by</p>
                      <p className="text-gray-900">
                        {SOURCE_LABEL[source]} – {reporterName(selectedRequest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Date Reported</p>
                      <p className="text-gray-900">{formatDateTime(selectedRequest.date_reported)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Last Updated</p>
                      <p className="text-gray-900">
                        {getRelativeTime(selectedRequest.updated_at || selectedRequest.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Assigned facility manager — hidden after approval */}
                  {!isApproved && <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Assigned Facility Manager
                    </p>
                    {(() => {
                      const assignee = getRequestAssignee(selectedRequest.id);
                      return (
                        <Select
                          value={assignee?.id ?? "unassigned"}
                          onValueChange={(value) => {
                            const nextId = value === "unassigned" ? null : value;
                            assignRequestToManager(selectedRequest.id, nextId);
                            fmStoreTick((n) => n + 1);
                            if (nextId) {
                              const fm = managers.find((m) => m.id === nextId);
                              toast.success(
                                `Assigned to ${fm?.name ?? "facility manager"}. WhatsApp notification sent.`,
                              );
                              appendThreadEntry(selectedRequest.id, {
                                id: makeMsgId(), type: "event",
                                body: `Assigned to ${fm?.name ?? "facility manager"}`,
                                timestamp: new Date().toISOString(),
                              });
                            } else {
                              toast.success("Request unassigned");
                              appendThreadEntry(selectedRequest.id, {
                                id: makeMsgId(), type: "event",
                                body: "Facility manager unassigned",
                                timestamp: new Date().toISOString(),
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a facility manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {managers.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    })()}
                    <p className="text-[11px] text-gray-400 mt-2">
                      Assigning sends a WhatsApp notification to the facility manager and updates the tenant.
                    </p>
                  </div>}

                  {/* Description */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {selectedRequest.description}
                    </p>
                  </div>

                  {/* Reopened notice */}
                  {selectedRequest.reopened_at && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Reopened</p>
                      </div>
                      <p className="text-xs text-red-600 mb-0.5">Last reopened: {formatDateTime(selectedRequest.reopened_at)}</p>
                      {selectedRequest.notes && <p className="text-xs text-red-500 italic mt-1">"{selectedRequest.notes}"</p>}
                    </div>
                  )}

                  {/* Media */}
                  {(() => {
                    const allAttachments = selectedRequest.attachments ?? (selectedRequest.issue_images ? selectedRequest.issue_images.map((url) => ({ url, type: "image" as const, group: "original" as const })) : []);
                    if (allAttachments.length === 0) return null;
                    const origItems = allAttachments.filter((a) => a.group === "original");
                    const reopenedItems = allAttachments.filter((a) => a.group === "reopened");
                    const showGroupLabels = origItems.length > 0 && reopenedItems.length > 0;
                    const renderGroup = (items: typeof allAttachments, label: string) => {
                      if (items.length === 0) return null;
                      const lightboxItems = items.map((a) => ({ url: a.url, type: a.type }));
                      const MAX_VISIBLE = 4;
                      const visible = items.slice(0, MAX_VISIBLE - 1);
                      const extra = items.length - visible.length;
                      const showExtra = extra > 1;
                      const displayItems = showExtra ? visible : items.slice(0, MAX_VISIBLE);
                      return (
                        <div key={label}>
                          {showGroupLabels && <p className="text-[11px] text-gray-400 font-medium mb-1.5">{label}</p>}
                          <div className="grid grid-cols-3 gap-2">
                            {displayItems.map((item, i) => (
                              <button
                                key={i}
                                onClick={() => setLightbox({ items: lightboxItems, index: i })}
                                className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF5000]"
                              >
                                {item.type === "video" ? (
                                  <>
                                    <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                                        <Play className="w-4 h-4 text-gray-800 ml-0.5" />
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <img src={item.url} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
                                )}
                              </button>
                            ))}
                            {showExtra && (
                              <button
                                onClick={() => setLightbox({ items: lightboxItems, index: visible.length })}
                                className="rounded-lg border border-gray-200 aspect-square bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF5000]"
                              >
                                +{extra + 1} more
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    };
                    return (
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Attachments</p>
                        <div className="space-y-3">
                          {renderGroup(origItems, "Original Request")}
                          {renderGroup(reopenedItems, "Reopened Request")}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Task Thread — visible only after approval ──────────── */}
                  {isApproved && (() => {
                    const thread = getThread(selectedRequest.id);

                    // Group entries by date label
                    const groups: { label: string; entries: ThreadEntry[] }[] = [];
                    for (const entry of thread) {
                      const label = fmtThreadDate(entry.timestamp);
                      const last = groups[groups.length - 1];
                      if (last && last.label === label) {
                        last.entries.push(entry);
                      } else {
                        groups.push({ label, entries: [entry] });
                      }
                    }

                    const sendMessage = () => {
                      const body = threadInput.trim();
                      if (!body) return;
                      appendThreadEntry(selectedRequest.id, {
                        id: makeMsgId(), type: "message",
                        author: "landlord", authorName: "You",
                        body,
                        timestamp: new Date().toISOString(),
                      });
                      setThreadInput("");
                      if (threadTextareaRef.current) threadTextareaRef.current.style.height = "auto";
                    };

                    return (
                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Updates & Thread
                          </p>
                        </div>

                        {/* Thread entries */}
                        <div className="space-y-1 mb-3">
                          {groups.length === 0 && (
                            <p className="text-xs text-gray-400 italic py-2">No updates yet. Add the first update below.</p>
                          )}
                          {groups.map((group) => (
                            <div key={group.label}>
                              {/* Date divider */}
                              <div className="flex items-center gap-2 my-3">
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-[10px] text-gray-400 font-medium">{group.label}</span>
                                <div className="flex-1 h-px bg-gray-100" />
                              </div>
                              <div className="space-y-2">
                                {group.entries.map((entry) => {
                                  if (entry.type === "event") {
                                    return (
                                      <div key={entry.id} className="flex items-center gap-2 py-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 ml-1" />
                                        <p className="text-xs text-gray-400 flex-1">{entry.body}</p>
                                        <span className="text-[10px] text-gray-300 shrink-0">{fmtThreadTime(entry.timestamp)}</span>
                                      </div>
                                    );
                                  }
                                  const isLandlord = entry.author === "landlord";
                                  return (
                                    <div key={entry.id} className={`flex flex-col gap-0.5 ${isLandlord ? "items-end" : "items-start"}`}>
                                      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                                        isLandlord
                                          ? "bg-[#FF5000] text-white rounded-br-sm"
                                          : "bg-gray-100 text-gray-900 rounded-bl-sm"
                                      }`}>
                                        {entry.body}
                                      </div>
                                      <div className={`flex items-center gap-1.5 ${isLandlord ? "flex-row-reverse" : ""}`}>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                          {isLandlord ? "You" : entry.authorName}
                                        </span>
                                        <span className="text-[10px] text-gray-300">·</span>
                                        <span className="text-[10px] text-gray-400">{fmtThreadTime(entry.timestamp)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Input */}
                        <div className="flex items-end gap-2 mt-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus-within:border-gray-400 focus-within:bg-white transition-colors">
                          <textarea
                            ref={threadTextareaRef}
                            rows={1}
                            value={threadInput}
                            onChange={(e) => { setThreadInput(e.target.value); autoResizeThread(); }}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Add an update…"
                            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none"
                            style={{ maxHeight: 120, overflowY: "auto", lineHeight: "1.5" }}
                          />
                          <button
                            type="button"
                            onClick={sendMessage}
                            disabled={!threadInput.trim()}
                            className="shrink-0 w-7 h-7 rounded-lg bg-[#FF5000] disabled:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Send className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Resolution History */}
                  {(selectedRequest.resolutions ?? (selectedRequest.resolution ? [selectedRequest.resolution] : [])).length > 0 && (() => {
                    const resArr = selectedRequest.resolutions ?? (selectedRequest.resolution ? [selectedRequest.resolution] : []);
                    return (
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Resolution History</p>
                        <div className="flex flex-col gap-3">
                          {[...resArr].reverse().map((attempt, revIdx) => {
                            const origIdx = resArr.length - 1 - revIdx;
                            const attemptNum = origIdx + 1;
                            const isLatest = revIdx === 0;
                            return (
                              <div key={origIdx}>
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 overflow-hidden">
                                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-emerald-200/70 bg-emerald-50">
                                    <div className="flex items-center gap-2">
                                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                                      <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">Resolution Attempt {attemptNum}</p>
                                    </div>
                                    {attempt.rejectedByTenant && (
                                      <span className="text-[10px] font-semibold text-red-800 bg-red-100 border border-red-200 rounded-full px-2 py-0.5">Rejected by tenant</span>
                                    )}
                                  </div>
                                  <div className="px-4 py-3.5 space-y-3 text-sm">
                                    <div>
                                      <p className="text-xs text-gray-500 mb-0.5">Description</p>
                                      <p className="text-gray-900 whitespace-pre-line leading-relaxed">{attempt.summary}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                                      <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Job category</p>
                                        <p className="text-gray-900">{attempt.category}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Cost</p>
                                        <p className="text-gray-900 tabular-nums">{attempt.hadCost ? attempt.costAmount || "—" : "No cost"}</p>
                                      </div>
                                      {attempt.artisanName && <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Artisan name</p>
                                        <p className="text-gray-900">{attempt.artisanName}</p>
                                      </div>}
                                      {attempt.artisanPhone && <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Phone number</p>
                                        <p className="text-gray-900">{attempt.artisanPhone}</p>
                                      </div>}
                                      <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Date resolved</p>
                                        <p className="text-gray-900">{formatDateTime(attempt.resolvedAt)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Facility manager</p>
                                        <p className="text-gray-900">{attempt.resolvedBy}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {attempt.rejectedByTenant && attempt.tenantFeedback && (
                                  <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    <p className="text-xs text-amber-800 italic">"{attempt.tenantFeedback}"</p>
                                  </div>
                                )}
                                {isLatest && !attempt.rejectedByTenant && (
                                  <div className="mt-1.5 bg-gray-100 rounded-lg px-3 py-1.5">
                                    <p className="text-[11px] text-gray-500 italic">Awaiting tenant confirmation</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Context-aware footer */}
                {(() => {
                  const assignee = getRequestAssignee(selectedRequest.id);
                  const canApprove = !!assignee && !isApproved;
                  const isPriority = isTaskPriority(selectedRequest.id);
                  const togglePriority = () => {
                    const reqId = selectedRequest.id;
                    const wasPriority = isTaskPriority(reqId);
                    setTaskPriority(reqId, !wasPriority);
                    if (wasPriority) {
                      toast.success("Priority removed from this request.");
                      appendThreadEntry(reqId, { id: makeMsgId(), type: "event", body: "Priority removed", timestamp: new Date().toISOString() });
                    } else {
                      toast.success("Request marked as priority — it will appear at the top of the list.");
                      appendThreadEntry(reqId, { id: makeMsgId(), type: "event", body: "Marked as priority", timestamp: new Date().toISOString() });
                    }
                  };
                  return (
                    <div className="space-y-2 pt-2">
                      {!isApproved && !assignee && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                          Assign a facility manager before approving this request.
                        </p>
                      )}
                      <DialogFooter className="sm:justify-between gap-2">
                        <Button
                          variant="outline"
                          onClick={togglePriority}
                          className={isPriority
                            ? "border-orange-300 text-orange-700 hover:bg-orange-50"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"}
                        >
                          <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                          {isPriority ? "Remove Priority" : "Add Priority"}
                        </Button>
                        <Button
                          disabled={!canApprove}
                          onClick={() => {
                            setStatus(
                              "in_progress",
                              `Request approved. ${assignee?.name ?? "Facility manager"} notified on WhatsApp; tenant updated.`,
                            );
                            appendThreadEntry(selectedRequest.id, {
                              id: makeMsgId(), type: "event",
                              body: `Request approved${assignee ? ` — ${assignee.name} notified` : ""}`,
                              timestamp: new Date().toISOString(),
                            });
                          }}
                          className="bg-[#FF5000] hover:bg-[#e04600] text-white"
                        >
                          {isApproved ? "Approved" : "Approve Request"}
                        </Button>
                      </DialogFooter>
                    </div>
                  );
                })()}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white focus:outline-none"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev button */}
          {lightbox.items.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white focus:outline-none"
              onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: (lb.index - 1 + lb.items.length) % lb.items.length } : null); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Media */}
          <div
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.items[lightbox.index].type === "video" ? (
              <video
                src={lightbox.items[lightbox.index].url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-lg"
              />
            ) : (
              <img
                src={lightbox.items[lightbox.index].url}
                alt={`Attachment ${lightbox.index + 1}`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>

          {/* Next button */}
          {lightbox.items.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white focus:outline-none"
              onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: (lb.index + 1) % lb.items.length } : null); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Counter */}
          {lightbox.items.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white text-sm">
              {lightbox.index + 1} / {lightbox.items.length}
            </div>
          )}
        </div>
      )}

      {/* Report Maintenance Request Modal */}
      {/* ── Decline Payment Request Modal ───────────────────────────── */}
      {declineModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDeclineModal(null); }}
          className="fixed inset-0 bg-black/40 z-[1300] flex items-center justify-center p-5"
        >
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900">Decline Payment Request</span>
              <button onClick={() => setDeclineModal(null)} className="text-gray-400 hover:text-gray-600 flex items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="px-5 py-4">
              <label className="text-xs font-semibold text-gray-600 block mb-2">Reason for Decline <span className="text-gray-400 font-normal">(Optional)</span></label>
              <textarea
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                rows={3}
                placeholder="e.g. Please obtain two additional quotations before proceeding."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 resize-none outline-none focus:border-gray-400 bg-gray-50 leading-relaxed"
              />
            </div>
            <div className="flex gap-3 px-5 pb-5 justify-end">
              <button onClick={() => setDeclineModal(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!declineModal) return;
                  updatePaymentRequest(declineModal.taskId, declineModal.entryId, { status: "declined", declinedReason: declineReason.trim() || undefined });
                  setDeclineModal(null);
                  setDeclineReason("");
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold text-white"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <LandlordReportMaintenanceModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={(payload: LandlordMaintenancePayload) => {
          const newReq: ServiceRequest = {
            id: "sr-new-" + Date.now(),
            request_id: "SR-NEW",
            source: "facility_manager",
            reporter_name: "You (Landlord)",
            tenant_name: payload.tenantName || "—",
            property_name: payload.propertyName || payload.commonAreaName || "",
            issue_category: payload.category || "Maintenance",
            description: payload.description,
            status: payload.assignedFmId ? "in_progress" : "open",
            date_reported: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tenant_id: payload.propertyId || "",
            property_id: payload.propertyId || "",
          };
          setLocalRequests((prev) => [newReq, ...prev]);
          setReportModalOpen(false);
        }}
      />
    </div>
  );
}

export default LandlordFacility;
