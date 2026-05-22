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
  const [threadInput, setThreadInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

                  {/* Input */}
                  <div style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                    marginTop: 12,
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
              );
            })()}

            {/* ── Resolution History ────────────────────────────────── */}
            {issue.resolutions && issue.resolutions.length > 0 && (
              <div style={{ marginTop: 24 }}>
                {/* Section label */}
                <div style={{ fontSize: 11, fontWeight: 600, color: "#B0ADA8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
                  Resolution History
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
                            {attempt.resolvedAt && (
                              <ResRow label="Resolved on" value={
                                new Date(attempt.resolvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) +
                                " · " +
                                new Date(attempt.resolvedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                              } />
                            )}
                            <ResRow label="Job category" value={attempt.category} />
                            <div>
                              <span style={{ fontSize: 11, color: "#6B7280", display: "block", marginBottom: 3 }}>Description</span>
                              <p style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.6, margin: 0 }}>{attempt.summary}</p>
                            </div>
                            {attempt.hadCost && attempt.costAmount
                              ? <ResRow label="Cost amount" value={attempt.costAmount} />
                              : <ResRow label="Cost amount" value="No cost" />
                            }
                            {attempt.artisanName && <ResRow label="Artisan name" value={attempt.artisanName} />}
                            {attempt.artisanPhone && <ResRow label="Phone number" value={attempt.artisanPhone} />}
                            {attempt.resolvedBy && <ResRow label="Resolved by" value={attempt.resolvedBy} />}
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
      {resolveOpen && (
        <ResolutionModal
          issue={issue}
          onClose={() => setResolveOpen(false)}
          onConfirm={(resolution) => {
            onStatusChange(issue.id, "resolved", resolution);
            appendThreadEntry(issue.id, { id: makeMsgId(), type: "event", body: "Marked as resolved", timestamp: new Date().toISOString() });
          }}
        />
      )}
    </>
  );
}
