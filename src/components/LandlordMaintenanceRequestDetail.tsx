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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
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
} from "lucide-react";

export default function LandlordMaintenanceRequestDetail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role || "property-manager";

  const requestId = searchParams.get("id") ?? "";

  // State
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<{ items: Array<{ url: string; type: "image" | "video" }>; index: number } | null>(null);
  const [declineModal, setDeclineModal] = useState<{ taskId: string; entryId: string; amount: string; requestedBy: string; reason: string } | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [approveModal, setApproveModal] = useState<{ taskId: string; entryId: string; amount: string; requestedBy: string; reason: string } | null>(null);
  const [managers, setManagers] = useState<FacilityManager[]>(MOCK_FACILITY_MANAGERS);
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
  const thread = getThread(req.id);
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
    if (!body) return;
    appendThreadEntry(req.id, { id: makeMsgId(), type: "message", author: "landlord", authorName: "You", body, timestamp: new Date().toISOString() });
    setThreadInput("");
    if (threadTextareaRef.current) threadTextareaRef.current.style.height = "auto";
  };

  // Attachments
  const allAttachments = req.attachments ?? (req.issue_images ? req.issue_images.map((url) => ({ url, type: "image" as const, group: "original" as const })) : []);
  const origItems = allAttachments.filter((a) => a.group === "original");
  const reopenedItems = allAttachments.filter((a) => a.group === "reopened");
  const showGroupLabels = origItems.length > 0 && reopenedItems.length > 0;

  const renderAttachmentGroup = (items: typeof allAttachments, label: string) => {
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

  const resArr = req.resolutions ?? (req.resolution ? [req.resolution] : []);

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
            <p className="text-sm text-slate-500 mt-0.5">Reported by {SOURCE_LABEL[source]} – {reporterName(req)}</p>
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

      {/* ── Two-column content frame ─────────────────────────────────── */}
      <div className="max-w-5xl bg-white rounded-lg shadow-sm">
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

            {/* Reopened notice */}
            {req.reopened_at && (
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-0.5">Reopened</p>
                    <p className="text-xs text-red-600">Last reopened: {formatDateTime(req.reopened_at)}</p>
                    {req.notes && <p className="text-xs text-red-500 italic mt-1">"{req.notes}"</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Attachments */}
            {allAttachments.length > 0 && (
              <div className="p-6 sm:p-8">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Attachments</h3>
                <div className="space-y-4">
                  {renderAttachmentGroup(origItems, "Original Request")}
                  {renderAttachmentGroup(reopenedItems, "Reopened Request")}
                </div>
              </div>
            )}

            {/* Updates & Activity */}
            <div className="p-6 sm:p-8">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Updates & Activity</h3>
              <div className="space-y-1">
                {groups.length === 0 && (
                  <p className="text-xs text-gray-400 italic py-2">No updates yet.</p>
                )}
                {groups.map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-[10px] text-gray-400 font-medium">{group.label}</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="space-y-3">
                      {group.entries.map((entry) => {
                        if (entry.type === "event") {
                          return (
                            <div key={entry.id} className="flex items-center gap-2 py-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
                              <p className="text-xs text-gray-400 flex-1">{entry.body}</p>
                              <span className="text-[10px] text-gray-300 shrink-0">{fmtThreadTime(entry.timestamp)}</span>
                            </div>
                          );
                        }

                        if (entry.type === "payment_request") {
                          return (
                            <div key={entry.id} className="flex items-center gap-2 py-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />
                              <p className="text-xs text-gray-400 flex-1">Payment request submitted · {entry.amount}</p>
                              <span className="text-[10px] text-gray-300 shrink-0">{fmtThreadTime(entry.timestamp)}</span>
                            </div>
                          );
                        }

                        const isLandlord = entry.author === "landlord";
                        return (
                          <div key={entry.id} className={`flex flex-col gap-1 ${isLandlord ? "items-end" : "items-start"}`}>
                            <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
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
              {/* Thread composer — only after approval */}
              {isApproved && (
                <div className="flex items-end gap-2 mt-5 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/60 focus-within:border-gray-300 focus-within:bg-white transition-colors">
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
              )}
            </div>

            {/* Resolution History */}
            {resArr.length > 0 && (
              <div className="p-6 sm:p-8">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Resolution History</h3>
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
                              {attempt.artisanName && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-0.5">Artisan name</p>
                                  <p className="text-gray-900">{attempt.artisanName}</p>
                                </div>
                              )}
                              {attempt.artisanPhone && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-0.5">Phone number</p>
                                  <p className="text-gray-900">{attempt.artisanPhone}</p>
                                </div>
                              )}
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
                          <div className="mt-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                            <p className="text-[11px] text-gray-500 italic">Awaiting tenant confirmation</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>{/* end left column */}

          {/* ── Right column (sticky details panel) — 30% ───────────────── */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0">
            <div className="lg:sticky lg:top-8 p-6 space-y-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Request Details</h3>

              {/* Assigned Facility Manager */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Assigned Facility Manager</p>
                {isApproved && assignee ? (
                  <p className="text-sm font-medium text-slate-900">{assignee.name}</p>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {/* Payment Requests */}
              {(() => {
                const paymentEntries = thread.filter(e => e.type === "payment_request") as import("@/lib/taskThreadStore").ThreadPaymentRequest[];
                if (paymentEntries.length === 0) return null;
                return (
                  <>
                    <div className="h-px bg-gray-100" />
                    <div className="space-y-4">
                      <p className="text-xs font-medium text-slate-500">Payment Request{paymentEntries.length > 1 ? "s" : ""}</p>
                      {paymentEntries.map((entry) => {
                        const pyIsPending = entry.status === "pending";
                        const pyIsApproved = entry.status === "approved";
                        const pyIsDeclined = entry.status === "declined";
                        const taskId = req.id;
                        return (
                          <div key={entry.id} className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
                            {/* Fields */}
                            <div className="p-3 space-y-3">
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-0.5">Amount</p>
                                <p className="text-sm font-semibold text-slate-900 tabular-nums">{entry.amount}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-0.5">Requested by</p>
                                <p className="text-sm text-slate-900">{assigneeName}</p>
                              </div>
                              {entry.category && (
                                <div>
                                  <p className="text-xs font-medium text-slate-500 mb-0.5">Category</p>
                                  <p className="text-sm text-slate-900">{entry.category}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-0.5">Reason</p>
                                <p className="text-sm text-slate-700 leading-snug">{entry.reason}</p>
                              </div>
                              {entry.attachmentName && (
                                <div>
                                  <p className="text-xs font-medium text-slate-500 mb-0.5">Attachment</p>
                                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    {entry.attachmentName}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-0.5">Status</p>
                                <p className={`text-sm ${pyIsApproved ? "text-emerald-700" : pyIsDeclined ? "text-red-600" : "text-slate-700"}`}>
                                  {pyIsApproved ? "Approved" : pyIsDeclined ? "Declined" : "Pending Approval"}
                                </p>
                              </div>
                              {pyIsApproved && entry.approvedBy && (
                                <p className="text-xs text-slate-500">
                                  Approved by {entry.approvedBy}
                                  {entry.approvedAt && <> · {fmtThreadTime(entry.approvedAt)}</>}
                                </p>
                              )}
                              {pyIsDeclined && (
                                <div>
                                  {entry.declinedReason && <p className="text-xs text-slate-500 mb-0.5">Reason: {entry.declinedReason}</p>}
                                  <p className="text-xs text-slate-500">Declined by Tunji Oginni</p>
                                </div>
                              )}
                            </div>
                            {/* Actions */}
                            {pyIsPending && (
                              <div className="flex gap-2 p-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-gray-200 text-slate-700 hover:bg-gray-50 text-xs"
                                  onClick={() => { setDeclineModal({ taskId, entryId: entry.id, amount: entry.amount, requestedBy: assigneeName, reason: entry.reason }); setDeclineReason(""); }}
                                >
                                  Decline
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 bg-[#FF5000] hover:bg-[#e04600] text-white text-xs"
                                  onClick={() => setApproveModal({ taskId, entryId: entry.id, amount: entry.amount, requestedBy: assigneeName, reason: entry.reason })}
                                >
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}

            </div>
          </div>{/* end right column */}

        </div>
      </div>{/* end white frame */}

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
      {approveModal && (
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
              <p className="text-sm text-gray-600">Are you sure you want to approve this payment request?</p>
              <div className="bg-gray-50 rounded-xl p-3.5 space-y-2.5 border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Amount</span>
                  <span className="text-base font-bold text-gray-900 tabular-nums">{approveModal.amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Requested by</span>
                  <span className="text-sm font-medium text-gray-800">{approveModal.requestedBy}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">Reason</span>
                  <p className="text-sm text-gray-700 leading-snug">{approveModal.reason}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5 justify-end">
              <button onClick={() => setApproveModal(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!approveModal) return;
                  updatePaymentRequest(approveModal.taskId, approveModal.entryId, { status: "approved", approvedBy: "Tunji Oginni", approvedAt: new Date().toISOString() });
                  setApproveModal(null);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white"
              >
                Approve Payment
              </button>
            </div>
          </div>
        </div>
      )}

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
                <span className="text-xs text-gray-400">Amount</span>
                <span className="text-sm font-bold text-gray-900 tabular-nums">{declineModal.amount}</span>
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
                  updatePaymentRequest(declineModal.taskId, declineModal.entryId, { status: "declined", declinedReason: declineReason.trim() || undefined });
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
