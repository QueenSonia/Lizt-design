"use client";
import { useState, useEffect } from "react";
import { FacilityManagerHeader } from "./FacilityManagerHeader";
import { useIsMobile, fmtDate } from "./helpers";
import { useFmContext } from "./FacilityManagerProvider";
import { FmIssue } from "./mockData";
import { isTaskPriority, subscribeToThreadStore } from "@/lib/taskThreadStore";

function fmtResolved(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function IssueRow({
  issue,
  isLast,
  isMobile,
  onClick,
}: {
  issue: FmIssue;
  isLast: boolean;
  isMobile: boolean;
  onClick: () => void;
}) {
  const isResolved = issue.status === "resolved";
  const isPriority = !isResolved && isTaskPriority(issue.id);

  return (
    <div
      className="fm-list-row"
      onClick={onClick}
      style={{
        padding: "16px 20px",
        borderBottom: isLast ? "none" : "1px solid #F0EEEA",
        cursor: "pointer",
        opacity: isResolved ? 0.85 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: isMobile ? 6 : 10,
          marginBottom: 7,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: isResolved ? "#6B7280" : "#1A1A1A",
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}
        >
          {issue.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {isPriority && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#C94A00",
                background: "#FFF1EC",
                border: "1px solid #FFD4C2",
                borderRadius: 99,
                padding: "2px 8px",
                lineHeight: 1.6,
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <span style={{ fontSize: 9 }}>▲</span>
              Priority
            </span>
          )}
          {isResolved ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#176B3A",
                background: "#EDFAF3",
                border: "1px solid #A5E5C3",
                borderRadius: 99,
                padding: "2px 8px",
                lineHeight: 1.6,
              }}
            >
              Resolved
            </span>
          ) : (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#7A6A00",
                background: "#FEFBE8",
                border: "1px solid #F0E68A",
                borderRadius: 99,
                padding: "2px 8px",
                lineHeight: 1.6,
              }}
            >
              Pending
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          fontSize: 12,
          color: "#9A9790",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {issue.tenant && <span>{issue.tenant}</span>}
        {issue.tenant && <span style={{ color: "#D5D2CD" }}>·</span>}
        <span>
          {isResolved && issue.resolution?.resolvedAt
            ? fmtResolved(issue.resolution.resolvedAt)
            : fmtDate(issue.time)}
        </span>
      </div>
    </div>
  );
}

export default function FacilityManagerIssues() {
  const isMobile = useIsMobile();
  const { issues, openIssueDetail } = useFmContext();
  const [, tick] = useState(0);

  useEffect(() => {
    return subscribeToThreadStore(() => tick((n) => n + 1));
  }, []);

  const pending = issues
    .filter((i) => i.status === "open" || i.status === "in_progress")
    .sort((a, b) => {
      const pa = isTaskPriority(a.id) ? 0 : 1;
      const pb = isTaskPriority(b.id) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return b.time - a.time;
    });

  const resolved = issues
    .filter((i) => i.status === "resolved")
    .sort((a, b) => {
      const aAt = a.resolution?.resolvedAt ? new Date(a.resolution.resolvedAt).getTime() : a.time;
      const bAt = b.resolution?.resolvedAt ? new Date(b.resolution.resolvedAt).getTime() : b.time;
      return bAt - aAt;
    });

  const IssueList = ({ items }: { items: FmIssue[] }) => (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.03)",
        overflow: "hidden",
      }}
    >
      {items.map((issue, i) => (
        <IssueRow
          key={issue.id}
          issue={issue}
          isLast={i === items.length - 1}
          isMobile={isMobile}
          onClick={() => openIssueDetail(issue)}
        />
      ))}
    </div>
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden",
        background: "#FFFFFF",
      }}
    >
      <FacilityManagerHeader />
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 32px" }}>
        <p
          style={{
            fontSize: 13,
            color: "#9A9790",
            lineHeight: 1.55,
            margin: "0 0 12px",
            maxWidth: 520,
          }}
        >
          View all maintenance requests across your properties and tenants.
          <br />
          Tap any request to see details and take action.
        </p>
        <div style={{ height: 1, background: "#F0EEE9", marginBottom: 20 }} />

        {/* Pending */}
        {pending.length > 0 && (
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
              Active · {pending.length}
            </div>
            <IssueList items={pending} />
          </div>
        )}

        {/* Resolved */}
        {resolved.length > 0 && (
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
              Resolved · {resolved.length}
            </div>
            <IssueList items={resolved} />
          </div>
        )}

        {pending.length === 0 && resolved.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 48, color: "#B0ADA8", fontSize: 13 }}>
            No tasks yet
          </div>
        )}
      </div>
    </div>
  );
}
