"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Ico } from "./Icon";
import { useIsMobile, fmtDate } from "./helpers";
import { ResolutionModal } from "./ResolutionModal";
import { FmIssue, FmResolution, STATUS_LABEL } from "./mockData";
import {
  appendThreadEntry,
  getThread,
  makeMsgId,
  fmtThreadTime,
  fmtThreadDate,
  subscribeToThreadStore,
  ThreadEntry,
  ThreadPaymentRequest,
  PaymentRequestCategory,
} from "@/lib/taskThreadStore";

function ResRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <span style={{ fontSize: 11, color: "#6B7280", flexShrink: 0, minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export interface IssueDetailIssue {
  id: string;
  title: string;
  desc: string;
  time: number;
  property: string;
  tenant?: string;
  status: string;
  ref?: string;
  resolutions?: FmResolution[];
  attachments?: Array<{ url: string; type: "image" | "video"; group: "original" | "reopened" }>;
  source?: "tenant" | "landlord";
}

interface IssueDetailModalProps {
  issue: IssueDetailIssue | FmIssue | null;
  onClose: () => void;
  onStatusChange: (
    id: string,
    status: string,
    resolution?: FmResolution
  ) => void;
}

export function IssueDetailModal({
  issue,
  onClose,
  onStatusChange,
}: IssueDetailModalProps) {
  const isMobile = useIsMobile();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [threadTick, setThreadTick] = useState(0);
  const [lightbox, setLightbox] = useState<{ items: Array<{ url: string; type: "image" | "video" }>; index: number } | null>(null);
  const [threadInput, setThreadInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Payment request modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payReason, setPayReason] = useState("");
  const [payCategory, setPayCategory] = useState<PaymentRequestCategory | "">("");
  const [payAttachmentName, setPayAttachmentName] = useState<string | undefined>(undefined);
  const payFileRef = useRef<HTMLInputElement>(null);

  const resetPayModal = () => {
    setPayAmount("");
    setPayReason("");
    setPayCategory("");
    setPayAttachmentName(undefined);
    setPayModalOpen(false);
  };

  const submitPaymentRequest = () => {
    if (!issue) return;
    const raw = payAmount.replace(/[^\d.]/g, "");
    if (!raw || !payReason.trim()) return;
    const formatted = `₦${Number(raw).toLocaleString("en-NG")}`;
    const entry: ThreadPaymentRequest = {
      id: makeMsgId(),
      type: "payment_request",
      amount: formatted,
      reason: payReason.trim(),
      category: payCategory || undefined,
      attachmentName: payAttachmentName,
      status: "pending",
      timestamp: new Date().toISOString(),
    };
    appendThreadEntry(issue.id, entry);
    resetPayModal();
  };

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    return subscribeToThreadStore(() => setThreadTick((n) => n + 1));
  }, []);

  if (!issue) return null;

  const isPending = issue.status === "open";
  const isResolved = issue.status === "resolved";
  const px = isMobile ? 16 : 24;

  const timeline = [
    { label: "Reported", value: fmtDate(issue.time) },
    issue.status === "in_progress" && {
      label: "In progress",
      value: "Currently being reviewed",
    },
    issue.status === "resolved" && {
      label: "Resolved",
      value: "Marked as resolved",
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.32)",
          zIndex: 1100,
          display: "flex",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "center",
          padding: isMobile ? 0 : 20,
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: isMobile ? 0 : 14,
            width: "100%",
            maxWidth: isMobile ? "100%" : 520,
            height: isMobile ? "100%" : "auto",
            maxHeight: isMobile ? "100dvh" : "90vh",
            boxShadow: isMobile ? "none" : "0 8px 40px rgba(0,0,0,.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: `${isMobile ? 14 : 18}px ${px}px`,
              borderBottom: "1px solid #EDECEA",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9A9790",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                  marginLeft: -4,
                }}
              >
                <span
                  style={{ display: "flex", transform: "rotate(90deg)" }}
                >
                  <Ico n="chev" s={16} c="currentColor" />
                </span>
              </button>
              <span
                style={{
                  fontSize: isMobile ? 15 : 16,
                  fontWeight: 700,
                  color: "#1A1A1A",
                  lineHeight: 1.35,
                }}
              >
                {issue.title}
              </span>
            </div>
            <div
              style={{
                paddingLeft: 28,
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {issue.ref && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#B0ADA8",
                    letterSpacing: "0.04em",
                    marginBottom: 2,
                  }}
                >
                  {issue.ref}
                </span>
              )}
              <span style={{ fontSize: 13, color: "#6B7280" }}>
                {issue.property}
              </span>
              {issue.tenant && (
                <span style={{ fontSize: 13, color: "#9A9790" }}>
                  {issue.tenant}
                </span>
              )}
              <span style={{ fontSize: 12, color: "#B0ADA8" }}>
                {fmtDate(issue.time)}
              </span>
              {issue.attachments && issue.attachments.length > 0 && issue.source === "tenant" && (
                <span style={{ fontSize: 12, color: "#9A9790", marginTop: 2 }}>
                  📎 Tenant attached {issue.attachments.length} file{issue.attachments.length !== 1 ? "s" : ""}.
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              padding: `18px ${px}px`,
              flex: 1,
              overflowY: "auto",
            }}
          >
            <p
              style={{
                fontSize: 14,
                color: "#374151",
                lineHeight: 1.7,
                margin: "0 0 20px",
              }}
            >
              {issue.desc}
            </p>

            {issue.attachments && issue.attachments.length > 0 && (() => {
              const originalItems = issue.attachments!.filter(a => a.group === "original");
              const reopenedItems = issue.attachments!.filter(a => a.group === "reopened");
              const showGroupLabels = originalItems.length > 0 && reopenedItems.length > 0;

              const renderGroup = (items: typeof issue.attachments, groupLabel: string) => {
                if (!items || items.length === 0) return null;
                const lightboxItems = items.map(a => ({ url: a.url, type: a.type }));
                const displayed = items.slice(0, items.length > 4 ? 3 : 4);
                const extra = items.length > 4 ? items.length - 3 : 0;
                return (
                  <div style={{ marginBottom: showGroupLabels ? 12 : 0 }}>
                    {showGroupLabels && (
                      <div style={{ fontSize: 11, color: "#B0ADA8", fontWeight: 500, marginBottom: 8 }}>{groupLabel}</div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                      {displayed.map((att, idx) => (
                        <div
                          key={idx}
                          onClick={() => setLightbox({ items: lightboxItems, index: idx })}
                          style={{
                            position: "relative",
                            aspectRatio: "1 / 1",
                            borderRadius: 8,
                            overflow: "hidden",
                            border: "1px solid #EDECEA",
                            cursor: "pointer",
                            background: "#F5F4F1",
                          }}
                        >
                          {att.type === "image" ? (
                            <img src={att.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <>
                              <video src={att.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <div style={{
                                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                background: "rgba(0,0,0,0.25)",
                              }}>
                                <div style={{
                                  width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.5)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  <div style={{ width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderLeft: "12px solid white", marginLeft: 3 }} />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {extra > 0 && (
                        <div
                          onClick={() => setLightbox({ items: lightboxItems, index: 3 })}
                          style={{
                            aspectRatio: "1 / 1",
                            borderRadius: 8,
                            border: "1px solid #EDECEA",
                            background: "#F5F4F1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#6B7280",
                          }}
                        >
                          +{extra} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#B0ADA8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                    Attachments
                  </div>
                  {renderGroup(originalItems, "Original Request")}
                  {renderGroup(reopenedItems, "Reopened Request")}
                </div>
              );
            })()}

            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#B0ADA8",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Status
              </div>
              <span
                style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}
              >
                {STATUS_LABEL[issue.status] || issue.status}
              </span>
            </div>

            {/* Resolution record — shown inline above thread when resolved */}

            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#B0ADA8",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Activity
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {timeline.map((step, i) => (
                  <div
                    key={step.label}
                    style={{
                      display: "flex",
                      gap: 14,
                      paddingBottom: i < timeline.length - 1 ? 14 : 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 14,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background:
                            i === timeline.length - 1 ? "#374151" : "#D5D2CD",
                          marginTop: 3,
                          flexShrink: 0,
                        }}
                      />
                      {i < timeline.length - 1 && (
                        <div
                          style={{
                            width: 1,
                            flex: 1,
                            background: "#EDECEA",
                            marginTop: 4,
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#1A1A1A",
                          marginBottom: 1,
                        }}
                      >
                        {step.label}
                      </div>
                      <div style={{ fontSize: 12, color: "#9A9790" }}>
                        {step.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Task Thread ───────────────────────────────────────────── */}
            {(() => {
              const thread = getThread(issue.id);
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
                appendThreadEntry(issue.id, {
                  id: makeMsgId(),
                  type: "message",
                  author: "facility_manager",
                  authorName: "You",
                  body,
                  timestamp: new Date().toISOString(),
                });
                setThreadInput("");
                if (textareaRef.current) {
                  textareaRef.current.style.height = "auto";
                }
              };

              return (
                <div style={{ marginTop: 24, borderTop: "1px solid #EDECEA", paddingTop: 20 }}>
                  {/* Section label */}
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#B0ADA8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
                    Updates & Thread
                  </div>

                  {/* Messages */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {groups.length === 0 && (
                      <p style={{ fontSize: 12, color: "#B0ADA8", fontStyle: "italic", margin: "4px 0 8px" }}>No updates yet.</p>
                    )}
                    {groups.map((group) => (
                      <div key={group.label}>
                        {/* Date divider */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 8px" }}>
                          <div style={{ flex: 1, height: 1, background: "#F0EEEA" }} />
                          <span style={{ fontSize: 10, color: "#B0ADA8", fontWeight: 500 }}>{group.label}</span>
                          <div style={{ flex: 1, height: 1, background: "#F0EEEA" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {group.entries.map((entry) => {
                            if (entry.type === "event") {
                              return (
                                <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D5D2CD", flexShrink: 0 }} />
                                  <span style={{ flex: 1, fontSize: 11, color: "#B0ADA8" }}>{entry.body}</span>
                                  <span style={{ fontSize: 10, color: "#D5D2CD", flexShrink: 0 }}>{fmtThreadTime(entry.timestamp)}</span>
                                </div>
                              );
                            }

                            if (entry.type === "resolution") {
                              return (
                                <div key={entry.id} style={{ border: "1px solid #D1FAE5", borderRadius: 12, background: "#F0FDF4", overflow: "hidden" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid #D1FAE5", background: "#DCFCE7" }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                      Maintenance Request Resolved
                                    </span>
                                  </div>
                                  <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                                    <ResRow label="Resolved by" value={entry.resolvedBy} />
                                    <div>
                                      <span style={{ fontSize: 11, color: "#6B7280", display: "block", marginBottom: 3 }}>Resolution Summary</span>
                                      <p style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{entry.summary}</p>
                                    </div>
                                    <span style={{ fontSize: 10, color: "#B0ADA8" }}>
                                      {new Date(entry.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {fmtThreadTime(entry.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            if (entry.type === "payment_request") {
                              const statusColor =
                                entry.status === "approved" ? { bg: "#F0FDF4", border: "#86EFAC", text: "#166534" } :
                                entry.status === "declined" ? { bg: "#FFF1F2", border: "#FECDD3", text: "#9F1239" } :
                                { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" };
                              const statusLabel =
                                entry.status === "approved" ? "✅ Approved" :
                                entry.status === "declined" ? "❌ Declined" :
                                "⏳ Pending Approval";
                              return (
                                <div key={entry.id} style={{ border: "1px solid #E8E5E0", borderRadius: 12, background: "#FAFAF8", overflow: "hidden" }}>
                                  {/* Card header */}
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid #F0EEEA", background: "#F5F3EF" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/>
                                    </svg>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: "0.05em", textTransform: "uppercase" }}>Payment Request</span>
                                    <span style={{ marginLeft: "auto", fontSize: 10, color: "#B0ADA8" }}>{fmtThreadTime(entry.timestamp)}</span>
                                  </div>
                                  {/* Card body */}
                                  <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div>
                                      <div style={{ fontSize: 10, color: "#9A9790", marginBottom: 2 }}>Amount</div>
                                      <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.01em" }}>{entry.amount}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 10, color: "#9A9790", marginBottom: 2 }}>Reason</div>
                                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{entry.reason}</div>
                                    </div>
                                    {entry.category && (
                                      <div>
                                        <div style={{ fontSize: 10, color: "#9A9790", marginBottom: 2 }}>Category</div>
                                        <div style={{ fontSize: 13, color: "#374151" }}>{entry.category}</div>
                                      </div>
                                    )}
                                    {/* Status badge */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                                      <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: statusColor.bg, border: `1px solid ${statusColor.border}`, color: statusColor.text }}>
                                        {statusLabel}
                                      </span>
                                      {entry.attachmentName && (
                                        <span style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                          {entry.attachmentName}
                                        </span>
                                      )}
                                    </div>
                                    {entry.status === "approved" && entry.approvedBy && (
                                      <div style={{ fontSize: 11, color: "#166534", borderTop: "1px solid #D1FAE5", paddingTop: 8, marginTop: 2 }}>
                                        Approved by <strong>{entry.approvedBy}</strong>
                                        {entry.approvedAt && <> · {new Date(entry.approvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} {fmtThreadTime(entry.approvedAt)}</>}
                                      </div>
                                    )}
                                    {entry.status === "declined" && entry.declinedReason && (
                                      <div style={{ fontSize: 11, color: "#9F1239", borderTop: "1px solid #FECDD3", paddingTop: 8, marginTop: 2 }}>
                                        <strong>Reason for Decline:</strong> {entry.declinedReason}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            const isFM = entry.author === "facility_manager";
                            return (
                              <div key={entry.id} style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: isFM ? "flex-end" : "flex-start" }}>
                                <div style={{
                                  maxWidth: "82%",
                                  padding: "9px 13px",
                                  borderRadius: isFM ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                                  fontSize: 13,
                                  lineHeight: 1.55,
                                  background: isFM ? "#FF5000" : "#F5F4F1",
                                  color: isFM ? "#FFFFFF" : "#1A1A1A",
                                }}>
                                  {entry.body}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, flexDirection: isFM ? "row-reverse" : "row" }}>
                                  <span style={{ fontSize: 10, color: "#9A9790", fontWeight: 500 }}>
                                    {isFM ? "You" : "Landlord"}
                                  </span>
                                  <span style={{ fontSize: 10, color: "#D5D2CD" }}>·</span>
                                  <span style={{ fontSize: 10, color: "#B0ADA8" }}>{fmtThreadTime(entry.timestamp)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Composer */}
                  <div style={{ marginTop: 12 }}>
                    {/* Request Payment secondary action */}
                    <div style={{ marginBottom: 8, display: "flex", justifyContent: "flex-start" }}>
                      <button
                        type="button"
                        onClick={() => setPayModalOpen(true)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#6B7280",
                          background: "#F5F4F1",
                          border: "1px solid #E2E0DC",
                          borderRadius: 8,
                          padding: "5px 11px",
                          cursor: "pointer",
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/>
                        </svg>
                        Request Payment
                      </button>
                    </div>
                    {/* Text input */}
                    <div style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 8,
                      border: "1px solid #E2E0DC",
                      borderRadius: 12,
                      padding: "8px 10px 8px 14px",
                      background: "#FAFAF8",
                    }}>
                      <textarea
                        ref={textareaRef}
                        value={threadInput}
                        rows={1}
                        onChange={(e) => { setThreadInput(e.target.value); autoResize(); }}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Add an update…"
                        style={{
                          flex: 1,
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          fontSize: 13,
                          color: "#1A1A1A",
                          resize: "none",
                          lineHeight: 1.5,
                          maxHeight: 120,
                          overflowY: "auto",
                          fontFamily: "inherit",
                          padding: 0,
                        }}
                      />
                      <button
                        type="button"
                        onClick={sendMessage}
                        disabled={!threadInput.trim()}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          border: "none",
                          background: threadInput.trim() ? "#FF5000" : "#E2E0DC",
                          cursor: threadInput.trim() ? "pointer" : "default",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "background 0.15s",
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Resolution Summary ────────────────────────────────── */}
            {issue.resolutions && issue.resolutions.length > 0 && (
              <div style={{ marginTop: 24 }}>
                {/* Section label */}
                <div style={{ fontSize: 11, fontWeight: 600, color: "#B0ADA8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
                  Resolution Summary
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[...issue.resolutions].reverse().map((attempt, revIdx) => {
                    const origIdx = issue.resolutions!.length - 1 - revIdx;
                    const attemptNum = origIdx + 1;
                    const isLatest = revIdx === 0;
                    return (
                      <div key={origIdx}>
                        <div style={{ borderRadius: 12, border: "1px solid #D1FAE5", background: "#F0FDF4", overflow: "hidden" }}>
                          {/* Card header */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 16px", borderBottom: "1px solid #D1FAE5", background: "#DCFCE7" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                Resolution Attempt {attemptNum}
                              </span>
                            </div>
                            {attempt.rejectedByTenant && (
                              <span style={{ fontSize: 10, fontWeight: 600, color: "#991B1B", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 20, padding: "2px 8px", letterSpacing: "0.04em" }}>
                                Rejected by tenant
                              </span>
                            )}
                          </div>
                          {/* Card body */}
                          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                            <div>
                              <span style={{ fontSize: 11, color: "#6B7280", display: "block", marginBottom: 3 }}>Resolution Summary</span>
                              <p style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{attempt.summary}</p>
                            </div>
                            {attempt.resolvedBy && <ResRow label="Resolved by" value={attempt.resolvedBy} />}
                            {attempt.resolvedAt && (
                              <ResRow label="Resolution Date & Time" value={
                                new Date(attempt.resolvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) +
                                " · " +
                                new Date(attempt.resolvedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                              } />
                            )}
                            <ResRow label="Job category" value={attempt.category} />
                            {attempt.hadCost && attempt.costAmount
                              ? <ResRow label="Cost amount" value={attempt.costAmount} />
                              : <ResRow label="Cost amount" value="No cost" />
                            }
                            {attempt.artisanName && <ResRow label="Artisan name" value={attempt.artisanName} />}
                            {attempt.artisanPhone && <ResRow label="Phone number" value={attempt.artisanPhone} />}
                          </div>
                        </div>
                        {/* Rejected feedback */}
                        {attempt.rejectedByTenant && attempt.tenantFeedback && (
                          <div style={{ marginTop: 6, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px" }}>
                            <span style={{ fontSize: 12, color: "#92400E", fontStyle: "italic" }}>"{attempt.tenantFeedback}"</span>
                          </div>
                        )}
                        {/* Awaiting confirmation note */}
                        {isLatest && !attempt.rejectedByTenant && (
                          <div style={{ marginTop: 6, background: "#F3F4F6", borderRadius: 8, padding: "6px 12px" }}>
                            <span style={{ fontSize: 11, color: "#6B7280", fontStyle: "italic" }}>Awaiting tenant confirmation</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {(isPending || isResolved) && (
            <div
              style={{
                padding: `12px ${px}px`,
                borderTop: "1px solid #EDECEA",
                flexShrink: 0,
                background: "#FFFFFF",
              }}
            >
              {isPending && (
                <button
                  onClick={() => setResolveOpen(true)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    border: "none",
                    background: "#176B3A",
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Mark as resolved
                </button>
              )}
              {isResolved && (
                <button
                  onClick={() => {
                    onStatusChange(issue.id, "open");
                    appendThreadEntry(issue.id, { id: makeMsgId(), type: "event", body: "Task reopened", timestamp: new Date().toISOString() });
                  }}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #E2E0DC",
                    background: "#F5F4F1",
                    color: "#374151",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Reopen issue
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* ── Payment Request Modal ───────────────────────────────────────── */}
      {payModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) resetPayModal(); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div style={{ background: "#FFFFFF", borderRadius: 16, width: "100%", maxWidth: 440, boxShadow: "0 12px 48px rgba(0,0,0,.22)", overflow: "hidden" }}>
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #EDECEA" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/>
                </svg>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>Request Payment</span>
              </div>
              <button onClick={resetPayModal} style={{ background: "none", border: "none", cursor: "pointer", color: "#9A9790", display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Amount */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Amount <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#6B7280", fontWeight: 500 }}>₦</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payAmount ? Number(payAmount.replace(/[^\d]/g, "")).toLocaleString("en-NG") : ""}
                    onChange={e => setPayAmount(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="0"
                    style={{ width: "100%", padding: "9px 12px 9px 26px", border: "1px solid #E2E0DC", borderRadius: 8, fontSize: 14, color: "#1A1A1A", outline: "none", boxSizing: "border-box", background: "#FAFAF8", fontFamily: "inherit" }}
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Reason <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  value={payReason}
                  onChange={e => setPayReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this payment is required."
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #E2E0DC", borderRadius: 8, fontSize: 13, color: "#1A1A1A", outline: "none", resize: "vertical", boxSizing: "border-box", background: "#FAFAF8", fontFamily: "inherit", lineHeight: 1.55 }}
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Category <span style={{ color: "#B0ADA8", fontWeight: 400 }}>(Optional)</span></label>
                <select
                  value={payCategory}
                  onChange={e => setPayCategory(e.target.value as PaymentRequestCategory | "")}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #E2E0DC", borderRadius: 8, fontSize: 13, color: payCategory ? "#1A1A1A" : "#9A9790", outline: "none", background: "#FAFAF8", fontFamily: "inherit", cursor: "pointer" }}
                >
                  <option value="">Select category</option>
                  {(["Materials", "Labour", "Transport", "Equipment", "Miscellaneous"] as PaymentRequestCategory[]).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Attachment */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Attachment <span style={{ color: "#B0ADA8", fontWeight: 400 }}>(Optional)</span></label>
                <input
                  ref={payFileRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png"
                  style={{ display: "none" }}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setPayAttachmentName(f.name);
                  }}
                />
                {payAttachmentName ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", border: "1px solid #D1FAE5", borderRadius: 8, background: "#F0FDF4" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    <span style={{ fontSize: 12, color: "#166534", flex: 1 }}>{payAttachmentName}</span>
                    <button onClick={() => { setPayAttachmentName(undefined); if (payFileRef.current) payFileRef.current.value = ""; }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9A9790", display: "flex" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => payFileRef.current?.click()}
                    style={{ width: "100%", padding: "9px 12px", border: "1px dashed #D5D2CD", borderRadius: 8, background: "#FAFAF8", fontSize: 12, color: "#9A9790", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Upload quote, invoice, receipt or image (PDF, JPG, PNG)
                  </button>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ display: "flex", gap: 10, padding: "16px 20px 20px", justifyContent: "flex-end" }}>
              <button
                onClick={resetPayModal}
                style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E2E0DC", background: "#FFFFFF", fontSize: 13, fontWeight: 500, color: "#374151", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={submitPaymentRequest}
                disabled={!payAmount || !payReason.trim()}
                style={{
                  padding: "9px 20px", borderRadius: 8, border: "none",
                  background: payAmount && payReason.trim() ? "#FF5000" : "#E2E0DC",
                  fontSize: 13, fontWeight: 600, color: "#FFFFFF",
                  cursor: payAmount && payReason.trim() ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {resolveOpen && (
        <ResolutionModal
          issue={issue}
          onClose={() => setResolveOpen(false)}
          onConfirm={(resolution) => {
            onStatusChange(issue.id, "resolved", resolution);
            appendThreadEntry(issue.id, {
              id: makeMsgId(),
              type: "resolution",
              resolvedBy: resolution.resolvedBy || "Facility Manager",
              summary: resolution.summary,
              timestamp: resolution.resolvedAt || new Date().toISOString(),
            });
          }}
        />
      )}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1200,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "none", border: "none", cursor: "pointer",
              color: "white", display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Left arrow */}
          {lightbox.items.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, index: (lb.index - 1 + lb.items.length) % lb.items.length } : null); }}
              style={{
                position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer",
                width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Current item */}
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {lightbox.items[lightbox.index].type === "image" ? (
              <img
                src={lightbox.items[lightbox.index].url}
                alt=""
                style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }}
              />
            ) : (
              <video
                src={lightbox.items[lightbox.index].url}
                controls
                style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }}
              />
            )}
          </div>

          {/* Right arrow */}
          {lightbox.items.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, index: (lb.index + 1) % lb.items.length } : null); }}
              style={{
                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer",
                width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Counter */}
          <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
            {lightbox.index + 1} / {lightbox.items.length}
          </div>
        </div>
      )}
    </>
  );
}
