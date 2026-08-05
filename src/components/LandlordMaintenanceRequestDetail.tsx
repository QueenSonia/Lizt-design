/* eslint-disable */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  MOCK_SERVICE_REQUESTS,
  MOCK_FACILITY_MANAGERS,
  ServiceRequest,
  FacilityManager,
  ResolutionDetails,
  resolveSource,
  reporterName,
  SOURCE_LABEL,
  formatDateTime,
  getRelativeTime,
  formatStatusLabel,
  statusColors,
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
  fmtThreadTime,
  fmtThreadDate,
  fmtNaira,
  subscribeToThreadStore,
  isTaskPriority,
  setTaskPriority,
} from "@/lib/taskThreadStore";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { toast } from "sonner";
import {
  AlertCircle,
  ChevronLeft,
  Check,
  MessageSquare,
  Send,
  Play,
  X,
  ChevronRight,
  ChevronDown,
  Paperclip,
  RotateCcw,
  Image as ImageIcon,
} from "lucide-react";

export default function LandlordMaintenanceRequestDetail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role || "property-manager";

  const requestId = searchParams.get("id") ?? "";

  // State
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [resolutionOverrides] = useState<Record<string, ResolutionDetails[]>>({});
  const [lightbox, setLightbox] = useState<{ items: Array<{ url: string; type: "image" | "video" }>; index: number } | null>(null);
  const [declineModal, setDeclineModal] = useState<{ taskId: string; entry: ThreadPaymentRequest } | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [approveModal, setApproveModal] = useState<{ taskId: string; entry: ThreadPaymentRequest } | null>(null);
  const [approvedAmountInput, setApprovedAmountInput] = useState("");
  const [managers, setManagers] = useState<FacilityManager[]>(MOCK_FACILITY_MANAGERS);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [pendingAssigneeId, setPendingAssigneeId] = useState<string>("unassigned");
  const [, fmStoreTick] = useState(0);
  const [, threadTick] = useState(0);
  const [threadInput, setThreadInput] = useState("");
  const [pendingThreadAttachments, setPendingThreadAttachments] = useState<ThreadMessageAttachment[]>([]);
  const threadTextareaRef = useRef<HTMLTextAreaElement>(null);
  const threadFileInputRef = useRef<HTMLInputElement>(null);

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

  const req: ServiceRequest | undefined = MOCK_SERVICE_REQUESTS.find((r) => r.id === requestId);

  if (!req) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">Maintenance request not found.</p>
          <Button variant="outline" onClick={() => router.push(`/${userRole}/facility`)}>
            Back to Facility
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

  // Thread
  const thread = [...getThread(req.id)].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const groups: { label: string; entries: ThreadEntry[] }[] = [];
  for (const entry of thread) {
    const label = fmtThreadDate(entry.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.label === label) { last.entries.push(entry); }
    else { groups.push({ label, entries: [entry] }); }
  }

  const assigneeName = getRequestAssignee(req.id)?.name ?? "Facility Manager";

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

  // Attachments
  const allAttachments = req.attachments ?? (req.issue_images ? req.issue_images.map((url) => ({ url, type: "image" as const, group: "original" as const })) : []);
  const origItems = allAttachments.filter((a) => a.group === "original");
  const reopenedItems = allAttachments.filter((a) => a.group === "reopened");
  const showGroupLabels = origItems.length > 0 && reopenedItems.length > 0;

  const renderAttachmentGroup = (
    items: Array<{ url: string; type: "image" | "video" }>,
    label: string,
    showLabel: boolean = showGroupLabels,
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
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
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

  const baseResArr = req.resolutions ?? (req.resolution ? [req.resolution] : []);
  const resArr = [...baseResArr, ...(resolutionOverrides[req.id] ?? [])];
  const isResolved = ["resolved", "closed"].includes(currentStatus.toLowerCase());

  return (
    <div className="page-container">

      {/* ── Header card — flush to top and left edge of content area ── */}
      <div className="bg-white shadow-sm mb-4 overflow-hidden -mt-4 -mx-4 sm:-mt-6 sm:-mx-6 lg:-mt-8 lg:-mx-8">

        {/* Row 1 — back nav only */}
        <div className="px-6 sm:px-8 py-4">
          <button
            type="button"
            onClick={() => router.push(`/${userRole}/facility`)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Maintenance Request
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Row 2 — request title + actions */}
        <div className="px-6 sm:px-8 py-5 flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-slate-900 leading-snug">{req.description}</h1>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Reported by {SOURCE_LABEL[source]} – {reporterName(req)}</span>
              {req.reopened_at && (
                <>
                  <span className="text-slate-300">•</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 cursor-default">
                        <RotateCcw className="w-3 h-3" />
                        Reopened
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Last reopened on {formatDateTime(req.reopened_at)}
                      {req.notes ? ` because ${req.notes.replace(/^["“]|["”]$/g, "")}` : ""}
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePriority}
              className={isPriority ? "border-orange-300 text-orange-700 hover:bg-orange-50" : "border-gray-200 text-gray-600 hover:bg-gray-50"}
            >
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
              {isPriority ? "Remove Priority" : "Add Priority"}
            </Button>
            <Button
              size="sm"
              disabled={!canApprove}
              className="bg-[#FF5000] hover:bg-[#e04600] text-white disabled:opacity-50"
              onClick={() => {
                setStatus("in_progress", `Request approved. ${assignee?.name ?? "Facility manager"} notified on WhatsApp; tenant updated.`);
                appendThreadEntry(req.id, { id: makeMsgId(), type: "event", body: `Request approved${assignee ? ` — ${assignee.name} notified` : ""}`, timestamp: new Date().toISOString() });
              }}
            >
              {isApproved ? "Approved" : "Approve Request"}
            </Button>
          </div>
        </div>

        {/* Assign-first warning */}
        {!isApproved && !assignee && (
          <div className="px-6 sm:px-8 pb-5">
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Assign a facility manager before approving this request.
            </div>
          </div>
        )}
      </div>

      {/* ── Page content — main frame + optional Previous Resolution sidebar ── */}
      <div className={`flex flex-col xl:flex-row xl:items-start gap-6 ${resArr.length > 0 && req.reopened_at ? "max-w-[1680px]" : "max-w-5xl"}`}>

      {/* ── Two-column content frame ─────────────────────────────────── */}
      <div className="flex-1 min-w-0 bg-white rounded-lg shadow-sm">
        <div className="flex flex-col lg:flex-row lg:divide-x lg:divide-gray-100">

          {/* ── Left column (primary) — 70% ────────────────────────────── */}
          <div className="flex-1 min-w-0 divide-y divide-gray-100">

            {/* Date metadata row */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Date Reported</p>
                  <p className="text-sm text-slate-900">{formatDateTime(req.date_reported)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Last Updated</p>
                  <p className="text-sm text-slate-900">{getRelativeTime(req.updated_at || req.updatedAt)}</p>
                </div>
              </div>
            </div>


            {/* Maintenance Attachments */}
            {allAttachments.length > 0 && (
              <div className="p-6 sm:p-8">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Maintenance Attachments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium mb-1.5">Original Request Media</p>
                    {origItems.length > 0 ? (
                      renderAttachmentGroup(origItems, "Original Request Media", false)
                    ) : (
                      <p className="text-xs text-gray-400 italic">No original media uploaded.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium mb-1.5">Reopened Request Media</p>
                    {reopenedItems.length > 0 ? (
                      renderAttachmentGroup(reopenedItems, "Reopened Request Media", false)
                    ) : (
                      <p className="text-xs text-gray-400 italic">No reopened media uploaded.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Updates & Activity */}
            <div className="p-6 sm:p-8">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Updates & Activity</h3>

              {/* Chat canvas */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">

                {/* Message area */}
                <div className="px-4 py-5 space-y-1 min-h-[120px]">
                  {groups.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center pt-4">No updates yet.</p>
                  )}
                  {groups.map((group) => (
                    <div key={group.label}>
                      {/* Date divider */}
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] text-gray-400 font-medium">{group.label}</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                      <div className="space-y-3">
                        {group.entries.map((entry) => {
                          /* System event — centred neutral pill */
                          if (entry.type === "event") {
                            return (
                              <div key={entry.id} className="flex justify-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-[11px] text-gray-500 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                                  {entry.body}
                                  <span className="text-gray-300">·</span>
                                  <span className="text-gray-400">{fmtThreadTime(entry.timestamp)}</span>
                                </span>
                              </div>
                            );
                          }

                          /* Resolution — full-width green summary card */
                          if (entry.type === "resolution") {
                            return (
                              <div key={entry.id} className="rounded-xl border border-emerald-200 bg-emerald-50/40 overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-200/70 bg-emerald-50">
                                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                                  <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">Maintenance Request Resolved</p>
                                </div>
                                <div className="px-4 py-3.5 space-y-2.5 text-sm">
                                  <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Resolved by</p>
                                    <p className="text-gray-900">{entry.resolvedBy}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Resolution Summary</p>
                                    <p className="text-gray-900 whitespace-pre-line leading-relaxed">{entry.summary}</p>
                                  </div>
                                  <p className="text-[11px] text-gray-400">
                                    {formatDateTime(entry.timestamp)}
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          /* Payment request reference — centred amber pill */
                          if (entry.type === "payment_request") {
                            return (
                              <div key={entry.id} className="flex justify-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-200 text-[11px] text-amber-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/></svg>
                                  Payment request · {entry.amount}
                                  <span className="text-amber-300">·</span>
                                  <span className="text-amber-600/70">{fmtThreadTime(entry.timestamp)}</span>
                                </span>
                              </div>
                            );
                          }

                          /* Chat messages */
                          const isLandlord = entry.author === "landlord";
                          return (
                            <div key={entry.id} className={`flex flex-col gap-1 ${isLandlord ? "items-end" : "items-start"}`}>
                              {/* Sender label */}
                              <span className="text-[10px] text-gray-400 font-medium px-1">
                                {isLandlord ? "You" : entry.authorName}
                              </span>
                              {/* Bubble */}
                              {entry.body && (
                                <div className={`max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.06)] ${
                                  isLandlord
                                    ? "bg-[#FF5000] text-white rounded-2xl rounded-br-sm"
                                    : "bg-white text-gray-900 rounded-2xl rounded-bl-sm border border-gray-100"
                                }`}>
                                  {entry.body}
                                </div>
                              )}
                              {/* Attachments */}
                              {entry.attachments && entry.attachments.length > 0 && (
                                <div className={`flex flex-wrap gap-1.5 max-w-[78%] ${isLandlord ? "justify-end" : "justify-start"}`}>
                                  {entry.attachments.map((att, i) =>
                                    att.type === "document" ? (
                                      <a
                                        key={i}
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                      >
                                        <Paperclip className="w-3 h-3 shrink-0" />
                                        <span className="truncate max-w-[140px]">{att.name}</span>
                                      </a>
                                    ) : (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() =>
                                          setLightbox({
                                            items: entry.attachments!.filter((a) => a.type !== "document").map((a) => ({ url: a.url, type: a.type as "image" | "video" })),
                                            index: entry.attachments!.filter((a) => a.type !== "document").findIndex((a) => a.url === att.url),
                                          })
                                        }
                                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF5000]"
                                      >
                                        {att.type === "video" ? (
                                          <>
                                            <video src={att.url} className="w-full h-full object-cover" muted preload="metadata" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                              <Play className="w-4 h-4 text-white" />
                                            </div>
                                          </>
                                        ) : (
                                          <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                        )}
                                      </button>
                                    ),
                                  )}
                                </div>
                              )}
                              {/* Timestamp */}
                              <span className="text-[10px] text-gray-400 px-1">{fmtThreadTime(entry.timestamp)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Composer — docked inside the canvas */}
                <div className="border-t border-gray-200 bg-white">
                  {pendingThreadAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
                      {pendingThreadAttachments.map((att, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-md border border-gray-200 bg-gray-50 text-xs text-gray-600"
                        >
                          {att.type === "document" ? (
                            <Paperclip className="w-3 h-3 shrink-0" />
                          ) : att.type === "video" ? (
                            <Play className="w-3 h-3 shrink-0" />
                          ) : (
                            <ImageIcon className="w-3 h-3 shrink-0" />
                          )}
                          <span className="truncate max-w-[100px]">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => setPendingThreadAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-3 py-2.5 flex items-end gap-2">
                    <input
                      ref={threadFileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        handleThreadFilesSelected(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => threadFileInputRef.current?.click()}
                      className="shrink-0 w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors"
                      aria-label="Attach a file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
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
                      disabled={!threadInput.trim() && pendingThreadAttachments.length === 0}
                      className="shrink-0 w-8 h-8 rounded-lg bg-[#FF5000] disabled:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>


          </div>{/* end left column */}

          {/* ── Right column (sticky details panel) — 30% ───────────────── */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0">
            <div className="lg:sticky lg:top-8 p-6 space-y-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Request Details</h3>

              {/* Assigned Facility Manager */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Assigned Facility Manager</p>
                <Popover
                  open={assigneePickerOpen}
                  onOpenChange={(open) => {
                    setAssigneePickerOpen(open);
                    if (open) setPendingAssigneeId(assignee?.id ?? "unassigned");
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-left hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5000] focus:ring-offset-1 transition-colors"
                    >
                      <span className={assignee ? "text-slate-900 font-medium" : "text-slate-400"}>
                        {assignee?.name ?? "Unassigned"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72 p-0">
                    <RadioGroup
                      value={pendingAssigneeId}
                      onValueChange={setPendingAssigneeId}
                      className="py-2"
                    >
                      <label
                        htmlFor="fm-radio-unassigned"
                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <RadioGroupItem value="unassigned" id="fm-radio-unassigned" />
                        <span className="text-sm text-slate-700">Unassigned</span>
                      </label>
                      {managers.map((m) => (
                        <label
                          key={m.id}
                          htmlFor={`fm-radio-${m.id}`}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <RadioGroupItem value={m.id} id={`fm-radio-${m.id}`} />
                          <span className="text-sm text-slate-700">{m.name}</span>
                        </label>
                      ))}
                    </RadioGroup>
                    <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setAssigneePickerOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-[#FF5000] hover:bg-[#e04600] text-white"
                        onClick={() => {
                          const previousAssignee = assignee;
                          const nextId = pendingAssigneeId === "unassigned" ? null : pendingAssigneeId;
                          const nextAssignee = nextId ? managers.find((m) => m.id === nextId) ?? null : null;

                          if ((previousAssignee?.id ?? null) === nextId) {
                            setAssigneePickerOpen(false);
                            return;
                          }

                          assignRequestToManager(req.id, nextId);
                          fmStoreTick((n) => n + 1);

                          const now = new Date().toISOString();
                          if (previousAssignee && nextAssignee) {
                            toast.success(`Reassigned to ${nextAssignee.name}. WhatsApp notification sent.`);
                            appendThreadEntry(req.id, {
                              id: makeMsgId(),
                              type: "event",
                              body: `Facility Manager Reassigned — Maintenance request reassigned from ${previousAssignee.name} to ${nextAssignee.name}`,
                              timestamp: now,
                            });
                          } else if (nextAssignee) {
                            toast.success(`Assigned to ${nextAssignee.name}. WhatsApp notification sent.`);
                            appendThreadEntry(req.id, { id: makeMsgId(), type: "event", body: `Assigned to ${nextAssignee.name}`, timestamp: now });
                          } else {
                            toast.success("Request unassigned");
                            appendThreadEntry(req.id, { id: makeMsgId(), type: "event", body: "Facility manager unassigned", timestamp: now });
                          }

                          setAssigneePickerOpen(false);
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Payment Request */}
              {(() => {
                const paymentEntries = thread.filter(e => e.type === "payment_request") as ThreadPaymentRequest[];
                if (paymentEntries.length === 0) return null;
                const taskId = req.id;
                return (
                  <>
                    <div className="h-px bg-gray-100" />
                    <div className="space-y-4">
                      <p className="text-xs font-medium text-slate-500">Payment Request{paymentEntries.length > 1 ? "s" : ""}</p>
                      {paymentEntries.map((entry) => {
                        const pyIsPending = entry.status === "pending";
                        const pyIsApproved = entry.status === "approved";
                        const pyIsDeclined = entry.status === "declined";
                        const pyIsPaid = entry.status === "paid";
                        const statusLabel = pyIsPaid ? "Paid" : pyIsApproved ? "Approved" : pyIsDeclined ? "Declined" : "Pending Approval";
                        const statusColor = pyIsPaid ? "text-emerald-700" : pyIsApproved ? "text-blue-700" : pyIsDeclined ? "text-red-600" : "text-slate-700";
                        return (
                          <div key={entry.id} className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 overflow-hidden">
                            {/* Card header */}
                            <div className="px-3 py-2.5 bg-gray-50">
                              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Payment Request</p>
                            </div>
                            {/* Requested Amount */}
                            <div className="px-3 py-3">
                              <p className="text-xs font-medium text-slate-500 mb-0.5">Requested Amount</p>
                              <p className="text-sm font-semibold text-slate-900 tabular-nums">{fmtNaira(entry.requestedAmount)}</p>
                            </div>
                            {/* Approved Amount */}
                            {typeof entry.approvedAmount === "number" && (
                              <div className="px-3 py-3">
                                <p className="text-xs font-medium text-slate-500 mb-0.5">Approved Amount</p>
                                <p className="text-sm font-semibold text-slate-900 tabular-nums">{fmtNaira(entry.approvedAmount)}</p>
                              </div>
                            )}
                            {/* Payment Status */}
                            <div className="px-3 py-3">
                              <p className="text-xs font-medium text-slate-500 mb-0.5">Payment Status</p>
                              <p className={`text-sm ${statusColor}`}>{statusLabel}</p>
                              {pyIsApproved && entry.approvedBy && (
                                <p className="text-xs text-slate-400 mt-1">
                                  Approved by {entry.approvedBy}
                                  {entry.approvedAt && <> · {fmtThreadTime(entry.approvedAt)}</>}
                                </p>
                              )}
                              {pyIsPaid && (
                                <p className="text-xs text-slate-400 mt-1">
                                  Disbursed {fmtNaira(entry.disbursedAmount ?? entry.approvedAmount ?? entry.requestedAmount)}
                                  {entry.paidAt && <> · {fmtThreadTime(entry.paidAt)}</>}
                                </p>
                              )}
                              {pyIsDeclined && (
                                <div className="mt-1">
                                  {entry.declinedReason && <p className="text-xs text-slate-400 mb-0.5">Reason: {entry.declinedReason}</p>}
                                </div>
                              )}
                            </div>
                            {/* Request Date */}
                            <div className="px-3 py-3">
                              <p className="text-xs font-medium text-slate-500 mb-0.5">Request Date</p>
                              <p className="text-sm text-slate-900">{formatDateTime(entry.timestamp)}</p>
                            </div>
                            {/* Requested By */}
                            <div className="px-3 py-3">
                              <p className="text-xs font-medium text-slate-500 mb-0.5">Requested By (Facility Manager)</p>
                              <p className="text-sm text-slate-900">{entry.requestedBy}</p>
                            </div>
                            {/* Category */}
                            {entry.category && (
                              <div className="px-3 py-3">
                                <p className="text-xs font-medium text-slate-500 mb-0.5">Category</p>
                                <p className="text-sm text-slate-900">{entry.category}</p>
                              </div>
                            )}
                            {/* Reason */}
                            <div className="px-3 py-3">
                              <p className="text-xs font-medium text-slate-500 mb-0.5">Reason</p>
                              <p className="text-sm text-slate-700 leading-snug">{entry.reason}</p>
                            </div>
                            {/* Legacy filename attachment (mock) */}
                            {entry.attachmentName && (
                              <div className="px-3 py-3">
                                <p className="text-xs font-medium text-slate-500 mb-0.5">Attachment</p>
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                                  <Paperclip className="w-3 h-3" />
                                  {entry.attachmentName}
                                </span>
                              </div>
                            )}
                            {/* Actions */}
                            {pyIsPending && (
                              <div className="flex gap-2 p-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-gray-200 text-slate-700 hover:bg-gray-50 text-xs"
                                  onClick={() => { setDeclineModal({ taskId, entry }); setDeclineReason(""); }}
                                >
                                  Decline Payment
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 bg-[#FF5000] hover:bg-[#e04600] text-white text-xs"
                                  onClick={() => { setApproveModal({ taskId, entry }); setApprovedAmountInput(String(entry.requestedAmount)); }}
                                >
                                  Approve Payment
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Payment Attachments */}
                      {(() => {
                        const paymentAttachments = paymentEntries.flatMap((e) => e.attachments ?? []);
                        if (paymentAttachments.length === 0) return null;
                        return (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-2">Payment Attachments</p>
                            {renderAttachmentGroup(paymentAttachments, "Payment Attachments", false)}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                );
              })()}

            </div>
          </div>{/* end right column */}

        </div>
      </div>{/* end white frame */}

      {/* ── Previous Resolution sidebar — only for reopened requests ── */}
      {req.reopened_at && resArr.length > 0 && (
        <div className="w-full xl:w-[340px] shrink-0">
          <div className="xl:sticky xl:top-8 bg-white rounded-lg shadow-sm p-6 space-y-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {resArr.length > 1 ? "Previous Resolution" : "Resolution Attempt 1"}
            </h3>
            <div className="flex flex-col gap-3">
              {[...resArr].reverse().map((attempt, revIdx) => {
                const origIdx = resArr.length - 1 - revIdx;
                const attemptNum = origIdx + 1;
                const isLatest = revIdx === 0;
                return (
                  <div key={origIdx}>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-emerald-200/70 bg-emerald-50">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">Resolution Attempt {attemptNum}</p>
                        </div>
                        {attempt.rejectedByTenant && (
                          <span className="text-[10px] font-semibold text-red-800 bg-red-100 border border-red-200 rounded-full px-2 py-0.5">Rejected by tenant</span>
                        )}
                      </div>
                      <div className="px-4 py-3.5 divide-y divide-emerald-100/70 text-sm">
                        <div className="pb-2.5">
                          <p className="text-xs text-gray-500 mb-0.5">Resolution Summary</p>
                          <p className="text-gray-900 whitespace-pre-line leading-relaxed">{attempt.summary}</p>
                        </div>
                        <div className="py-2.5">
                          <p className="text-xs text-gray-500 mb-0.5">Resolved by (Facility Manager)</p>
                          <p className="text-gray-900">{attempt.resolvedBy}</p>
                        </div>
                        <div className="py-2.5">
                          <p className="text-xs text-gray-500 mb-0.5">Resolution Date & Time</p>
                          <p className="text-gray-900">{formatDateTime(attempt.resolvedAt)}</p>
                        </div>
                        <div className="py-2.5">
                          <p className="text-xs text-gray-500 mb-0.5">Job category</p>
                          <p className="text-gray-900">{attempt.category}</p>
                        </div>
                        <div className="py-2.5">
                          <p className="text-xs text-gray-500 mb-0.5">Cost</p>
                          <p className="text-gray-900 tabular-nums">{attempt.hadCost ? attempt.costAmount || "—" : "No cost"}</p>
                        </div>
                        {attempt.artisanName && (
                          <div className="py-2.5">
                            <p className="text-xs text-gray-500 mb-0.5">Artisan name</p>
                            <p className="text-gray-900">{attempt.artisanName}</p>
                          </div>
                        )}
                        {attempt.artisanPhone && (
                          <div className="pt-2.5">
                            <p className="text-xs text-gray-500 mb-0.5">Phone number</p>
                            <p className="text-gray-900">{attempt.artisanPhone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {attempt.rejectedByTenant && attempt.tenantFeedback && (
                      <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500 mb-0.5">Tenant Feedback</p>
                        <p className="text-xs text-amber-800 italic">"{attempt.tenantFeedback}"</p>
                      </div>
                    )}
                    {isLatest && !attempt.rejectedByTenant && (
                      <div className="mt-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                        <p className="text-[11px] text-gray-500 italic">Awaiting tenant confirmation</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      </div>{/* end page content wrapper */}

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

      {/* Approve Payment Request Modal */}
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₦</span>
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

      {/* Decline Payment Request Modal */}
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
