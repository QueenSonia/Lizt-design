/* eslint-disable */
"use client";

import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  MOCK_SERVICE_REQUESTS,
  MOCK_FACILITY_MANAGERS,
  ServiceRequest,
  FacilityManager,
  resolveSource,
  reporterName,
  formatDateTime,
  getRelativeTime,
  formatStatusLabel,
} from "@/lib/landlordFacilityTypes";
import {
  assignRequestToManager,
  getRequestAssignee,
  subscribeToFMStore,
} from "@/lib/facilityManagerStore";
import {
  ThreadEntry,
  ThreadPaymentRequest,
  ThreadMessageAttachment,
  appendThreadEntry,
  updatePaymentRequest,
  getThread,
  makeMsgId,
  fmtNaira,
  subscribeToThreadStore,
  isTaskPriority,
  setTaskPriority,
} from "@/lib/taskThreadStore";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup } from "./ui/radio-group";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { toast } from "sonner";
import {
  AlertCircle,
  ChevronLeft,
  Check,
  Send,
  Play,
  X,
  ChevronRight,
  ChevronDown,
  Paperclip,
  RotateCcw,
  Image as ImageIcon,
  Star,
  Users,
  PanelRight,
  CheckCircle2,
  ChevronUp,
} from "lucide-react";

type ActiveFilter = "all" | "messages" | "payments" | "status";

interface Props {
  requestOverride?: ServiceRequest;
  backTo?: string;
  backLabel?: string;
}

export default function LandlordMaintenanceRequestDetail({ requestOverride, backTo, backLabel }: Props = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role || "property-manager";

  const searchParamId = searchParams.get("id") ?? "";
  const requestId = requestOverride?.id ?? searchParamId;

  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<{ items: Array<{ url: string; type: "image" | "video" }>; index: number } | null>(null);
  const [declineModal, setDeclineModal] = useState<{ taskId: string; entry: ThreadPaymentRequest } | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [approveModal, setApproveModal] = useState<{ taskId: string; entry: ThreadPaymentRequest } | null>(null);
  const [approvedAmountInput, setApprovedAmountInput] = useState("");
  const [managers] = useState<FacilityManager[]>(MOCK_FACILITY_MANAGERS);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [pendingAssigneeId, setPendingAssigneeId] = useState<string>("unassigned");
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [threadExpanded, setThreadExpanded] = useState(false);
  const [, fmStoreTick] = useState(0);
  const [, threadTick] = useState(0);
  const [threadInput, setThreadInput] = useState("");
  const [pendingThreadAttachments, setPendingThreadAttachments] = useState<ThreadMessageAttachment[]>([]);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const threadTextareaRef = useRef<HTMLTextAreaElement>(null);
  const threadFileInputRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

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

  const req: ServiceRequest | undefined = requestOverride ?? MOCK_SERVICE_REQUESTS.find((r) => r.id === requestId);

  if (!req) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">Maintenance request not found.</p>
          <Button variant="outline" onClick={() => router.push(backTo ?? `/${userRole}/facility`)}>
            {backLabel ? `Back to ${backLabel}` : "Back to Facility"}
          </Button>
        </div>
      </div>
    );
  }

  const currentStatus = statusOverrides[req.id] ?? req.status;
  const source = resolveSource(req);
  const isApproved = ["in_progress", "resolved", "closed"].includes(currentStatus.toLowerCase());
  const assignee = getRequestAssignee(req.id);
  const canApprove = !!assignee && !isApproved;
  const isPriority = isTaskPriority(req.id);

  const setStatus = (next: string, message: string) => {
    setStatusOverrides((prev) => ({ ...prev, [req.id]: next }));
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

  const thread = [...getThread(req.id)].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const sendMessage = () => {
    const body = threadInput.trim();
    if (!body && pendingThreadAttachments.length === 0) return;
    appendThreadEntry(req.id, {
      id: makeMsgId(),
      type: "message",
      author: "landlord",
      authorName: "You",
      body,
      attachments: pendingThreadAttachments.length > 0 ? pendingThreadAttachments : undefined,
      timestamp: new Date().toISOString(),
    });
    setThreadInput("");
    setPendingThreadAttachments([]);
    if (threadTextareaRef.current) threadTextareaRef.current.style.height = "auto";
    setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleThreadFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newAttachments: ThreadMessageAttachment[] = Array.from(files).map((file) => {
      const type: ThreadMessageAttachment["type"] = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : "document";
      return { url: URL.createObjectURL(file), type, name: file.name };
    });
    setPendingThreadAttachments((prev) => [...prev, ...newAttachments]);
  };

  const allAttachments = req.attachments ?? (req.issue_images ? req.issue_images.map((url) => ({ url, type: "image" as const, group: "original" as const })) : []);
  const origItems = allAttachments.filter((a) => a.group === "original");
  const reopenedItems = allAttachments.filter((a) => a.group === "reopened");
  const showGroupLabels = origItems.length > 0 && reopenedItems.length > 0;

  const renderAttachmentGroup = (
    items: Array<{ url: string; type: "image" | "video" }>,
    label: string,
    showLabel: boolean = showGroupLabels,
    gridClassName: string = "grid-cols-4 gap-2 sm:grid-cols-6",
  ) => {
    if (items.length === 0) return null;
    const lightboxItems = items.map((a) => ({ url: a.url, type: a.type }));
    const MAX_VISIBLE = 4;
    const visible = items.slice(0, MAX_VISIBLE - 1);
    const extra = items.length - visible.length;
    const showExtra = extra > 1;
    const displayItems = showExtra ? visible : items.slice(0, MAX_VISIBLE);
    return (
      <div key={label}>
        {showLabel && <p className="text-[11px] text-gray-400 font-medium mb-1.5">{label}</p>}
        <div className={`grid ${gridClassName}`}>
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

  const PAYMENT_STATUS_BADGE_CLASS: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    approved: "bg-blue-50 text-blue-700 border border-blue-200",
    declined: "bg-red-50 text-red-700 border border-red-200",
    paid: "bg-green-50 text-green-700 border border-green-200",
  };
  const PAYMENT_STATUS_LABEL: Record<string, string> = {
    pending: "Pending Approval", approved: "Approved", declined: "Declined", paid: "Paid",
  };

  const STATUS_CHIP_CLASS: Record<string, string> = {
    open: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    in_progress: "bg-blue-50 text-blue-700 border border-blue-200",
    resolved: "bg-green-50 text-green-700 border border-green-200",
    reopened: "bg-red-50 text-red-700 border border-red-200",
    urgent: "bg-red-50 text-red-700 border border-red-200",
    closed: "bg-gray-100 text-gray-600 border border-gray-200",
    pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  };

  const ROLE_TAG_CLASS: Record<string, string> = {
    TENANT: "bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold px-1.5 py-0.5 rounded",
    RESIDENT: "bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-semibold px-1.5 py-0.5 rounded",
    "FACILITY MANAGER": "bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold px-1.5 py-0.5 rounded",
    LANDLORD: "bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-semibold px-1.5 py-0.5 rounded",
  };

  const AVATAR_CLASS: Record<string, string> = {
    TENANT: "bg-blue-100 text-blue-700",
    RESIDENT: "bg-violet-100 text-violet-700",
    "FACILITY MANAGER": "bg-amber-100 text-amber-700",
    LANDLORD: "bg-gray-900 text-white",
  };

  function getRoleTagFromSource(src: string): string {
    if (src === "tenant") return "TENANT";
    if (src === "resident") return "RESIDENT";
    if (src === "facility_manager") return "FACILITY MANAGER";
    return "LANDLORD";
  }

  type DisplayItem =
    | { kind: "original" }
    | { kind: "reopened_media" }
    | { kind: "thread"; entry: ThreadEntry };

  type RenderNode =
    | { t: "divider"; label: string; key: string }
    | { t: "item"; item: DisplayItem; key: string }
    | { t: "collapse"; count: number }
    | { t: "showless" };

  function fmtItemDt(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  function _dayKey(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
  function _dayLabel(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    if (_dayKey(iso) === _dayKey(today.toISOString())) return "Today";
    if (_dayKey(iso) === _dayKey(yest.toISOString())) return "Yesterday";
    const dow = d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
    const day = d.getDate();
    const month = d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
    return `${dow}, ${day} ${month}`;
  }
  function _itemTs(item: DisplayItem): string {
    if (item.kind === "original") return req!.date_reported;
    if (item.kind === "reopened_media") return req!.reopened_at ?? req!.date_reported;
    return item.entry.timestamp;
  }

  const allDisplayItems: DisplayItem[] = [{ kind: "original" }];
  if (reopenedItems.length > 0) allDisplayItems.push({ kind: "reopened_media" });
  for (const e of thread) allDisplayItems.push({ kind: "thread", entry: e });

  const filteredDisplayItems: DisplayItem[] =
    activeFilter === "messages"
      ? allDisplayItems.filter(i =>
          i.kind === "original" || i.kind === "reopened_media" || (i.kind === "thread" && i.entry.type === "message")
        )
      : activeFilter === "payments"
        ? allDisplayItems.filter(i => i.kind === "thread" && i.entry.type === "payment_request")
        : activeFilter === "status"
          ? allDisplayItems.filter(i => i.kind === "thread" && i.entry.type === "event")
          : allDisplayItems;

  const msgCount = allDisplayItems.filter(i => i.kind !== "thread" || i.entry.type === "message").length;
  const payCount = allDisplayItems.filter(i => i.kind === "thread" && i.entry.type === "payment_request").length;
  const statusCount = allDisplayItems.filter(i => i.kind === "thread" && i.entry.type === "event").length;

  const TAIL_COUNT = 2;
  const canCollapse = activeFilter === "all" && !threadExpanded && filteredDisplayItems.length > 1 + TAIL_COUNT;

  const renderNodes: RenderNode[] = (() => {
    const nodes: RenderNode[] = [];
    let lastDk = "";
    function pushItem(item: DisplayItem) {
      const ts = _itemTs(item);
      const dk = _dayKey(ts);
      if (dk !== lastDk) {
        nodes.push({ t: "divider", label: _dayLabel(ts), key: `d-${dk}` });
        lastDk = dk;
      }
      nodes.push({ t: "item", item, key: item.kind === "thread" ? item.entry.id : item.kind });
    }
    if (filteredDisplayItems.length === 0) return nodes;
    pushItem(filteredDisplayItems[0]);
    if (canCollapse) {
      const middleCount = filteredDisplayItems.length - 1 - TAIL_COUNT;
      nodes.push({ t: "collapse", count: middleCount });
      for (const itm of filteredDisplayItems.slice(-TAIL_COUNT)) pushItem(itm);
    } else {
      for (const itm of filteredDisplayItems.slice(1)) pushItem(itm);
    }
    if (threadExpanded && filteredDisplayItems.length > 1 + TAIL_COUNT) {
      nodes.push({ t: "showless" });
    }
    return nodes;
  })();

  const needsClamp = (body: string) => body.length > 300 || body.includes("\n");
  const toggleMessage = (id: string) => setExpandedMessages(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const clampStyle: React.CSSProperties = {
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 8,
    WebkitBoxOrient: "vertical" as any,
  };

  const paymentEntries = thread.filter(e => e.type === "payment_request") as ThreadPaymentRequest[];

  return (
    <div className="page-container flex flex-col gap-5 min-[1440px]:h-[calc(100vh-2rem)] min-[1440px]:overflow-hidden">

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shrink-0">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
          <button
            type="button"
            onClick={() => router.push(backTo ?? `/${userRole}/facility`)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5000] rounded"
            aria-label="Back to maintenance requests"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Maintenance Requests</span>
          </button>

          <div className="flex-1" />

          {!isApproved && (
            <Button
              size="sm"
              disabled={!canApprove}
              className="bg-[#FF5000] hover:bg-[#e04600] text-white disabled:opacity-50 text-xs"
              onClick={() => {
                setStatus("in_progress", `Request approved. ${assignee?.name ?? "Facility manager"} notified on WhatsApp.`);
                appendThreadEntry(req.id, { id: makeMsgId(), type: "event", body: `Request approved${assignee ? ` — ${assignee.name} notified` : ""}`, timestamp: new Date().toISOString() });
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Approve Request
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setSidePanelOpen((v) => !v)}
                className={`flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5000] ${sidePanelOpen ? "text-gray-700 bg-gray-100" : "text-gray-500"}`}
                aria-label={sidePanelOpen ? "Hide details" : "Show details"}
              >
                <PanelRight className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{sidePanelOpen ? "Hide details" : "Show details"}</TooltipContent>
          </Tooltip>
        </div>

        {/* Assign-first warning banner */}
        {!isApproved && !assignee && (
          <div className="flex items-center gap-2 text-sm text-amber-700 px-5 py-2.5 bg-amber-50 border-b border-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Assign a facility manager before approving this request.
          </div>
        )}

        {/* Title + priority star */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start gap-2 mb-3">
            <h1 className="text-2xl font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">
              {req.description}
            </h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={togglePriority}
                  className="shrink-0 mt-0.5 p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5000]"
                  aria-label={isPriority ? "Remove priority" : "Mark as priority"}
                >
                  <Star className={`w-5 h-5 ${isPriority ? "fill-[#FF5000] text-[#FF5000]" : "text-gray-300"}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{isPriority ? "Remove priority" : "Mark as priority"}</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${(STATUS_CHIP_CLASS as Record<string, string>)[currentStatus.toLowerCase()] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>
              {formatStatusLabel(currentStatus)}
            </span>
            {isPriority && (
              <span className="text-xs font-semibold text-[#FF5000] bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-[#FF5000]" />Priority
              </span>
            )}
            {req.reopened_at && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 cursor-default">
                    <RotateCcw className="w-3 h-3" />Reopened
                  </span>
                </TooltipTrigger>
                <TooltipContent>Last reopened on {formatDateTime(req.reopened_at)}{req.notes ? ` — ${req.notes}` : ""}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* 3-column meta grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-t border-gray-100">
          {/* Col 1: Property */}
          <div className="px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Property</p>
            <p className="text-sm font-semibold text-gray-900">{req.property_name}</p>
            {req.property_address && (
              <p className="text-xs text-gray-500 mt-0.5">{req.property_address}</p>
            )}
          </div>

          {/* Col 2: Facility Manager */}
          <div className="px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Facility Manager</p>
            <Popover open={assigneePickerOpen} onOpenChange={(open) => { setAssigneePickerOpen(open); if (open) setPendingAssigneeId(assignee?.id ?? "unassigned"); }}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-[#FF5000] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5000] rounded"
                >
                  <span className={assignee ? "text-gray-900" : "text-gray-400 font-normal"}>{assignee?.name ?? "Unassigned"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-0">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Assign Facility Manager</p>
                </div>
                <div className="py-1 max-h-64 overflow-y-auto">
                  <button
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${pendingAssigneeId === "unassigned" ? "font-medium text-gray-900" : "text-gray-700"}`}
                    onClick={() => setPendingAssigneeId("unassigned")}
                  >
                    Unassigned
                  </button>
                  {managers.map((m) => (
                    <button
                      key={m.id}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${pendingAssigneeId === m.id ? "font-medium text-gray-900 bg-orange-50" : "text-gray-700"}`}
                      onClick={() => setPendingAssigneeId(m.id)}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setAssigneePickerOpen(false)}>Cancel</Button>
                  <Button size="sm" className="flex-1 bg-[#FF5000] hover:bg-[#e04600] text-white" onClick={() => {
                    const previousAssignee = assignee;
                    const nextId = pendingAssigneeId === "unassigned" ? null : pendingAssigneeId;
                    const nextAssignee = nextId ? managers.find((m) => m.id === nextId) ?? null : null;
                    if ((previousAssignee?.id ?? null) === nextId) { setAssigneePickerOpen(false); return; }
                    assignRequestToManager(req.id, nextId);
                    fmStoreTick((n) => n + 1);
                    const now = new Date().toISOString();
                    if (previousAssignee && nextAssignee) {
                      toast.success(`Reassigned to ${nextAssignee.name}. WhatsApp notification sent.`);
                      appendThreadEntry(req.id, { id: makeMsgId(), type: "event", body: `Reassigned from ${previousAssignee.name} to ${nextAssignee.name}`, timestamp: now });
                    } else if (nextAssignee) {
                      toast.success(`Assigned to ${nextAssignee.name}. WhatsApp notification sent.`);
                      appendThreadEntry(req.id, { id: makeMsgId(), type: "event", body: `Assigned to ${nextAssignee.name}`, timestamp: now });
                    } else {
                      toast.success("Request unassigned");
                      appendThreadEntry(req.id, { id: makeMsgId(), type: "event", body: "Facility manager unassigned", timestamp: now });
                    }
                    setAssigneePickerOpen(false);
                  }}>Save</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Col 3: Wallet Balance */}
          <div className="px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Wallet Balance</p>
            {req.walletBalance !== undefined ? (
              <p className="text-sm font-semibold text-green-600">{fmtNaira(req.walletBalance)}</p>
            ) : (
              <p className="text-sm text-gray-400">N/A</p>
            )}
          </div>
        </div>
      </div>

      {/* Main row */}
      <div className="flex gap-5 min-[1440px]:flex-1 min-[1440px]:min-h-0">

        {/* Thread card */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 flex flex-col min-h-[500px] min-[1440px]:min-h-0">

          {/* Thread card header */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Activity</span>
            <div className="bg-gray-100 rounded-lg p-0.5 flex">
              {(["all", "messages", "payments", "status"] as ActiveFilter[]).map((f) => {
                const cnt = f === "all" ? allDisplayItems.length : f === "messages" ? msgCount : f === "payments" ? payCount : statusCount;
                const label = f === "all" ? "All" : f === "messages" ? "Messages" : f === "payments" ? "Payments" : "Status";
                const isActive = activeFilter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => { setActiveFilter(f); setThreadExpanded(false); }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus:outline-none ${isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {label}
                    <span className={`text-[10px] font-semibold tabular-nums ${isActive ? "text-gray-500" : "text-gray-400"}`}>{cnt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thread card body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 min-[1440px]:min-h-0">

            {filteredDisplayItems.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">
                  No {activeFilter === "messages" ? "messages" : activeFilter === "payments" ? "payment requests" : "status updates"} yet.
                </p>
              </div>
            )}

            {renderNodes.map((node) => {
              if (node.t === "divider") {
                return (
                  <div key={node.key} className="py-2">
                    <div className="flex items-center gap-3 py-3">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-[11px] font-semibold text-gray-400 px-2.5 py-1 rounded-full bg-white border border-gray-200 tracking-wide whitespace-nowrap">
                        {node.label}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  </div>
                );
              }

              if (node.t === "collapse") {
                return (
                  <div key="collapse" className="py-2">
                    <button
                      type="button"
                      onClick={() => setThreadExpanded(true)}
                      className="rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm text-gray-500 flex items-center gap-2 w-full hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5000]"
                    >
                      <ChevronDown className="w-4 h-4" />
                      {node.count} earlier update{node.count !== 1 ? "s" : ""}
                    </button>
                  </div>
                );
              }

              if (node.t === "showless") {
                return (
                  <div key="showless" className="py-2">
                    <button
                      type="button"
                      onClick={() => setThreadExpanded(false)}
                      className="flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />Show less
                    </button>
                  </div>
                );
              }

              if (node.t === "item") {
                const { item } = node;
                const nodeKey = node.key;

                if (item.kind === "original") {
                  const name = reporterName(req);
                  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                  const roleTag = getRoleTagFromSource(source);
                  const roleClass = ROLE_TAG_CLASS[roleTag] ?? "bg-gray-100 text-gray-600 text-[10px] font-semibold px-1.5 py-0.5 rounded";
                  const avatarBg = AVATAR_CLASS[roleTag] ?? "bg-gray-100 text-gray-700";
                  const body = req.description;
                  const expanded = expandedMessages.has("original");
                  return (
                    <div key={nodeKey} className="py-5 border-b border-gray-100">
                      <div className="flex gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${avatarBg}`}>{initials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">{name}</span>
                            <span className={roleClass}>{roleTag}</span>
                            <span className="text-xs text-gray-400 ml-auto">{fmtItemDt(req.date_reported)}</span>
                          </div>
                          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Original Request</p>
                          <p
                            className="text-[15px] leading-6 text-gray-700 whitespace-pre-wrap"
                            style={needsClamp(body) && !expanded ? clampStyle : undefined}
                          >
                            {body}
                          </p>
                          {needsClamp(body) && (
                            <button type="button" onClick={() => toggleMessage("original")} className="text-xs text-[#FF5000] mt-1.5 hover:underline focus:outline-none">
                              {expanded ? "Show less" : "Show full message"}
                            </button>
                          )}
                          {origItems.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-400 mt-3 mb-1.5">{origItems.length} attachment{origItems.length !== 1 ? "s" : ""}</p>
                              <div className="flex flex-wrap gap-2">
                                {renderAttachmentGroup(origItems, "Original Media", false, "grid-cols-4 gap-2")}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.kind === "reopened_media") {
                  const name = reporterName(req);
                  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={nodeKey} className="py-5 border-b border-gray-100">
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-xs font-semibold text-amber-700">{initials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">{name}</span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <RotateCcw className="w-2.5 h-2.5" />REOPENED
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">{fmtItemDt(req.reopened_at ?? req.date_reported)}</span>
                          </div>
                          {req.notes && <p className="text-[15px] leading-6 text-gray-700 mb-2">{req.notes}</p>}
                          {reopenedItems.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-400 mb-1.5">{reopenedItems.length} attachment{reopenedItems.length !== 1 ? "s" : ""}</p>
                              <div className="flex flex-wrap gap-2">
                                {renderAttachmentGroup(reopenedItems, "Reopened Media", false, "grid-cols-4 gap-2")}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.kind === "thread") {
                  const entry = item.entry;

                  if (entry.type === "event") {
                    return (
                      <div key={nodeKey} className="py-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-[11px] text-gray-400 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 whitespace-nowrap flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            {entry.body} · {fmtItemDt(entry.timestamp)}
                          </span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                      </div>
                    );
                  }

                  if (entry.type === "resolution") {
                    return (
                      <div key={nodeKey} className="py-4 border-b border-gray-100">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-200/70 bg-emerald-50">
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">Resolved</p>
                            <span className="text-xs text-emerald-600 ml-auto">{fmtItemDt(entry.timestamp)}</span>
                          </div>
                          <div className="px-4 py-3.5 space-y-2 text-sm">
                            <div><p className="text-xs text-gray-500 mb-0.5">Resolved by</p><p className="text-gray-900">{entry.resolvedBy}</p></div>
                            <div><p className="text-xs text-gray-500 mb-0.5">Summary</p><p className="text-gray-900 leading-relaxed">{entry.summary}</p></div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (entry.type === "payment_request") {
                    const pyStatus = entry.status;
                    const pyIsPending = pyStatus === "pending";
                    const taskId = req.id;
                    return (
                      <div key={nodeKey} className="py-4 border-b border-gray-100">
                        <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ borderLeftWidth: "3px", borderLeftColor: "#FF5000" }}>
                          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                                <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/>
                              </svg>
                              <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Payment Request</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{fmtItemDt(entry.timestamp)}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${PAYMENT_STATUS_BADGE_CLASS[pyStatus] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>{PAYMENT_STATUS_LABEL[pyStatus] ?? pyStatus}</span>
                            </div>
                          </div>
                          <div className="px-4 py-3 space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Requested</p>
                                <p className="font-semibold tabular-nums text-gray-900">{fmtNaira(entry.requestedAmount)}</p>
                              </div>
                              {typeof entry.approvedAmount === "number" && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-0.5">Approved</p>
                                  <p className="font-semibold tabular-nums text-gray-900">{fmtNaira(entry.approvedAmount)}</p>
                                </div>
                              )}
                            </div>
                            {entry.category && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Category</span>
                                <span className="text-gray-900">{entry.category}</span>
                              </div>
                            )}
                            {entry.requestedBy && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Requested by</span>
                                <span className="text-gray-900">{entry.requestedBy}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">Reason</span>
                              <p className="text-gray-700 mt-0.5 leading-snug">{entry.reason}</p>
                            </div>
                            {entry.attachments && entry.attachments.length > 0 && renderAttachmentGroup(entry.attachments, "Payment Attachments", false, "grid-cols-4 gap-2")}
                          </div>
                          {pyIsPending && (
                            <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
                              <Button variant="outline" size="sm" className="flex-1 text-xs border-gray-200 text-slate-700 hover:bg-gray-50" onClick={() => { setDeclineModal({ taskId, entry }); setDeclineReason(""); }}>Decline</Button>
                              <Button size="sm" className="flex-1 bg-[#FF5000] hover:bg-[#e04600] text-white text-xs" onClick={() => { setApproveModal({ taskId, entry }); setApprovedAmountInput(String(entry.requestedAmount)); }}>Approve Payment</Button>
                            </div>
                          )}
                          {entry.status === "declined" && entry.declinedReason && (
                            <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-red-600 bg-red-50">Declined: {entry.declinedReason}</div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (entry.type === "message") {
                    const author = entry.author;
                    const isLandlord = author === "landlord";
                    const isTenant = author === "tenant";
                    const name = isLandlord ? "You" : entry.authorName;
                    const initials = isLandlord ? "YO" : entry.authorName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                    const roleTag = isLandlord ? "LANDLORD" : isTenant ? "TENANT" : "FACILITY MANAGER";
                    const roleClass = ROLE_TAG_CLASS[roleTag] ?? "bg-gray-100 text-gray-600 text-[10px] font-semibold px-1.5 py-0.5 rounded";
                    const avatarClass = AVATAR_CLASS[roleTag] ?? "bg-gray-100 text-gray-700";
                    const msgExpanded = expandedMessages.has(entry.id);
                    return (
                      <div key={nodeKey} className="py-5 border-b border-gray-100">
                        <div className="flex gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${avatarClass}`}>{initials}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900">{name}</span>
                              <span className={roleClass}>{roleTag}</span>
                              <span className="text-xs text-gray-400 ml-auto">{fmtItemDt(entry.timestamp)}</span>
                            </div>
                            {entry.body && (
                              <>
                                <p
                                  className="text-[15px] leading-6 text-gray-700 whitespace-pre-wrap"
                                  style={needsClamp(entry.body) && !msgExpanded ? clampStyle : undefined}
                                >
                                  {entry.body}
                                </p>
                                {needsClamp(entry.body) && (
                                  <button type="button" onClick={() => toggleMessage(entry.id)} className="text-xs text-[#FF5000] mt-1.5 hover:underline focus:outline-none">
                                    {msgExpanded ? "Show less" : "Show full message"}
                                  </button>
                                )}
                              </>
                            )}
                            {entry.attachments && entry.attachments.length > 0 && (
                              <>
                                <p className="text-xs text-gray-400 mt-3 mb-1.5">{entry.attachments.length} attachment{entry.attachments.length !== 1 ? "s" : ""}</p>
                                <div className="flex flex-wrap gap-2">
                                  {entry.attachments.map((att, i) =>
                                    att.type === "document" ? (
                                      <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 hover:bg-gray-100">
                                        <Paperclip className="w-3 h-3 shrink-0" /><span className="truncate max-w-[120px]">{att.name}</span>
                                      </a>
                                    ) : (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => setLightbox({ items: entry.attachments!.filter((a) => a.type !== "document").map((a) => ({ url: a.url, type: a.type as "image" | "video" })), index: entry.attachments!.filter((a) => a.type !== "document").findIndex((a) => a.url === att.url) })}
                                        className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5000]"
                                      >
                                        {att.type === "video" ? (
                                          <>
                                            <video src={att.url} className="w-full h-full object-cover" muted preload="metadata" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20"><Play className="w-4 h-4 text-white" /></div>
                                          </>
                                        ) : (
                                          <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                        )}
                                      </button>
                                    )
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                }
              }
              return null;
            })}

            <div ref={threadEndRef} />
          </div>

          {/* Reply bar */}
          <div className="shrink-0 border-t border-gray-100 px-6 py-4">
            {pendingThreadAttachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {pendingThreadAttachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-md border border-gray-200 bg-gray-50 text-xs text-gray-600">
                    {att.type === "document" ? <Paperclip className="w-3 h-3 shrink-0" /> : att.type === "video" ? <Play className="w-3 h-3 shrink-0" /> : <ImageIcon className="w-3 h-3 shrink-0" />}
                    <span className="truncate max-w-[100px]">{att.name}</span>
                    <button type="button" onClick={() => setPendingThreadAttachments((prev) => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-gray-600 ml-0.5"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2.5 rounded-xl bg-gray-100 px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#FF5000] focus-within:ring-offset-1 transition-shadow">
              <input type="file" ref={threadFileInputRef} className="hidden" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => { handleThreadFilesSelected(e.target.files); e.target.value = ""; }} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => threadFileInputRef.current?.click()} className="shrink-0 w-7 h-7 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 flex items-center justify-center">
                    <Paperclip className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Attach file</TooltipContent>
              </Tooltip>
              <textarea
                ref={threadTextareaRef}
                rows={1}
                value={threadInput}
                onChange={e => { setThreadInput(e.target.value); autoResizeThread(); }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Reply to the thread..."
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 resize-none leading-relaxed p-0 border-0 outline-none ring-0 shadow-none focus:ring-0 focus:outline-none focus:border-0 focus:shadow-none"
                style={{ maxHeight: 120, overflowY: "auto", boxShadow: "none" }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={sendMessage} disabled={!threadInput.trim() && pendingThreadAttachments.length === 0}
                    className="shrink-0 w-7 h-7 rounded-md bg-[#FF5000] disabled:bg-gray-200 flex items-center justify-center" aria-label="Send">
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Send</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Side panel card — desktop */}
        {sidePanelOpen && (
          <aside className="hidden lg:flex flex-col w-72 bg-white rounded-xl border border-gray-200 shrink-0 overflow-y-auto">
            <div className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Dates</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Reported</p>
                  <p className="text-sm font-medium text-gray-900">{formatDateTime(req.date_reported)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">{getRelativeTime(req.updated_at || req.updatedAt)}</p>
                </div>
              </div>
            </div>

            {paymentEntries.length > 0 && (
              <>
                <div className="border-t border-gray-100" />
                <div className="p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Payment{paymentEntries.length > 1 ? "s" : ""}</p>
                  <div className="space-y-2">
                    {paymentEntries.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium tabular-nums text-gray-900">{fmtNaira(p.requestedAmount)}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${PAYMENT_STATUS_BADGE_CLASS[p.status] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>{PAYMENT_STATUS_LABEL[p.status] ?? p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="border-t border-gray-100" />
            <div className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Request Details</p>
              <div className="space-y-3">
                {req.issue_category && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Category</p>
                    <p className="text-sm font-medium text-gray-900">{req.issue_category}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Reported By</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{reporterName(req)}</p>
                    <span className={ROLE_TAG_CLASS[getRoleTagFromSource(source)] ?? "bg-gray-100 text-gray-600 text-[10px] font-semibold px-1.5 py-0.5 rounded"}>
                      {getRoleTagFromSource(source)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile side panel slide-over */}
      {sidePanelOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidePanelOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Request Details</p>
              <button type="button" onClick={() => setSidePanelOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close details"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Dates</p>
              <div className="space-y-3 mb-5">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Reported</p>
                  <p className="text-sm font-medium text-gray-900">{formatDateTime(req.date_reported)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">{getRelativeTime(req.updated_at || req.updatedAt)}</p>
                </div>
              </div>

              {paymentEntries.length > 0 && (
                <>
                  <div className="border-t border-gray-100 mb-5" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Payment{paymentEntries.length > 1 ? "s" : ""}</p>
                  <div className="space-y-2 mb-5">
                    {paymentEntries.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium tabular-nums text-gray-900">{fmtNaira(p.requestedAmount)}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${PAYMENT_STATUS_BADGE_CLASS[p.status] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>{PAYMENT_STATUS_LABEL[p.status] ?? p.status}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="border-t border-gray-100 mb-5" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Request Details</p>
              <div className="space-y-3">
                {req.issue_category && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Category</p>
                    <p className="text-sm font-medium text-gray-900">{req.issue_category}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Reported By</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{reporterName(req)}</p>
                    <span className={ROLE_TAG_CLASS[getRoleTagFromSource(source)] ?? "bg-gray-100 text-gray-600 text-[10px] font-semibold px-1.5 py-0.5 rounded"}>
                      {getRoleTagFromSource(source)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white focus:outline-none"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          {lightbox.items.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white focus:outline-none"
              onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: (lb.index - 1 + lb.items.length) % lb.items.length } : null); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
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
          {lightbox.items.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white focus:outline-none"
              onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: (lb.index + 1) % lb.items.length } : null); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
          {lightbox.items.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white text-sm">
              {lightbox.index + 1} / {lightbox.items.length}
            </div>
          )}
        </div>
      )}

      {/* Approve Payment Modal */}
      {approveModal && (() => {
        const parsedApprovedAmount = Number(approvedAmountInput.replace(/,/g, ""));
        const isValid = approvedAmountInput.trim() !== "" && Number.isFinite(parsedApprovedAmount) && parsedApprovedAmount > 0;
        const amountChanged = parsedApprovedAmount !== approveModal.entry.requestedAmount;
        return (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setApproveModal(null); }}
            className="fixed inset-0 bg-black/50 z-[1400] flex items-center justify-center p-5"
          >
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/>
                  </svg>
                  <span className="text-sm font-bold text-gray-900">Approve Payment Request</span>
                </div>
                <button onClick={() => setApproveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="bg-gray-50 rounded-xl p-3.5 space-y-2.5 border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Property</span>
                    <span className="text-sm font-medium text-gray-800">{req.property_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Requested by</span>
                    <span className="text-sm font-medium text-gray-800">{approveModal.entry.requestedBy}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Request Date</span>
                    <span className="text-sm font-medium text-gray-800">{formatDateTime(approveModal.entry.timestamp)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Requested Amount</Label>
                  <div className="h-9 flex items-center px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700">
                    {fmtNaira(approveModal.entry.requestedAmount)}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="approved-amount-detail">
                    Approved Amount <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">&#8358;</span>
                    <Input
                      id="approved-amount-detail"
                      value={approvedAmountInput}
                      onChange={(e) => setApprovedAmountInput(e.target.value.replace(/[^\d.]/g, ""))}
                      inputMode="decimal"
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                  {!isValid && (
                    <p className="text-sm text-red-500">Enter a valid approved amount.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 px-5 pb-5 justify-end">
                <button onClick={() => setApproveModal(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  disabled={!isValid}
                  onClick={() => {
                    if (!approveModal || !isValid) return;
                    const now = new Date().toISOString();
                    updatePaymentRequest(approveModal.taskId, approveModal.entry.id, {
                      status: "approved",
                      approvedAmount: parsedApprovedAmount,
                      approvedBy: "Michael Adeyemi",
                      approvedAt: now,
                    });
                    if (amountChanged) {
                      appendThreadEntry(approveModal.taskId, { id: makeMsgId(), type: "event", body: `Approved Amount Changed to ${fmtNaira(parsedApprovedAmount)}`, timestamp: now });
                    }
                    appendThreadEntry(approveModal.taskId, { id: makeMsgId(), type: "event", body: "Payment Approved", timestamp: now });
                    toast.success("Payment request approved");
                    setApproveModal(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-sm font-semibold text-white"
                >
                  Approve Payment
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Decline Payment Modal */}
      {declineModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDeclineModal(null); }}
          className="fixed inset-0 bg-black/50 z-[1400] flex items-center justify-center p-5"
        >
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900">Decline Payment Request</span>
              <button onClick={() => setDeclineModal(null)} className="text-gray-400 hover:text-gray-600 flex items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-400">Requested Amount</span>
                <span className="text-sm font-bold text-gray-900 tabular-nums">{fmtNaira(declineModal.entry.requestedAmount)}</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">
                  Reason for Decline <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this payment request is being declined."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 resize-none outline-none focus:border-gray-400 bg-gray-50 leading-relaxed"
                />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5 justify-end">
              <button onClick={() => setDeclineModal(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!declineModal) return;
                  const now = new Date().toISOString();
                  updatePaymentRequest(declineModal.taskId, declineModal.entry.id, {
                    status: "declined",
                    declinedReason: declineReason.trim() || undefined,
                    declinedAt: now,
                  });
                  appendThreadEntry(declineModal.taskId, { id: makeMsgId(), type: "event", body: "Payment Declined", timestamp: now });
                  toast.success("Payment request declined");
                  setDeclineModal(null);
                  setDeclineReason("");
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold text-white"
              >
                Decline Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
