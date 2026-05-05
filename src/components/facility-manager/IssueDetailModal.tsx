"use client";
import { useState } from "react";
import { Ico } from "./Icon";
import { useIsMobile, fmtDate } from "./helpers";
import { ResolutionModal } from "./ResolutionModal";
import { FmIssue, FmResolution, STATUS_LABEL } from "./mockData";

export interface IssueDetailIssue {
  id: string;
  title: string;
  desc: string;
  time: number;
  property: string;
  tenant?: string;
  status: string;
  ref?: string;
  resolution?: FmResolution;
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

            {issue.resolution && (
              <div style={{ marginBottom: 24 }}>
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
                  Resolution
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "#374151",
                    lineHeight: 1.65,
                    margin: "0 0 12px",
                  }}
                >
                  {issue.resolution.summary}
                </p>
                <div
                  style={{
                    background: "#FAFAF8",
                    border: "1px solid #EDECEA",
                    borderRadius: 10,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", gap: 12 }}>
                    <span
                      style={{
                        width: 80,
                        fontSize: 12,
                        color: "#9A9790",
                        flexShrink: 0,
                      }}
                    >
                      Category
                    </span>
                    <span style={{ fontSize: 13, color: "#374151" }}>
                      {issue.resolution.category}
                    </span>
                  </div>
                  {issue.resolution.hadCost && (
                    <div style={{ display: "flex", gap: 12 }}>
                      <span
                        style={{
                          width: 80,
                          fontSize: 12,
                          color: "#9A9790",
                          flexShrink: 0,
                        }}
                      >
                        Cost
                      </span>
                      <span style={{ fontSize: 13, color: "#374151" }}>
                        {issue.resolution.costAmount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                  onClick={() => onStatusChange(issue.id, "open")}
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
          onConfirm={(resolution) =>
            onStatusChange(issue.id, "resolved", resolution)
          }
        />
      )}
    </>
  );
}
