"use client";
import { useState, useEffect } from "react";
import { Ico } from "./Icon";
import { FacilityManagerHeader } from "./FacilityManagerHeader";
import { formatTime, useIsMobile } from "./helpers";
import { useFmContext } from "./FacilityManagerProvider";
import { FmFeedItem, FmIssue, ISSUES, EVENT_DEF } from "./mockData";
import { isTaskPriority, subscribeToThreadStore } from "@/lib/taskThreadStore";

// ── Duration helper ───────────────────────────────────────────────────────────

function pendingDuration(sinceMs: number): string {
  const diff = Date.now() - sinceMs;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days >= 1) return `${days}d`;
  if (hours >= 1) return `${hours}h`;
  return `${mins}m`;
}

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({
  issue,
  onClick,
}: {
  issue: FmIssue;
  onClick: () => void;
}) {
  const isPriority = isTaskPriority(issue.id);
  const duration = pendingDuration(issue.time);

  return (
    <div
      className="fm-feed-row"
      onClick={onClick}
      style={{
        padding: "16px 18px",
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.04)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#1A1A1A",
          lineHeight: 1.4,
          marginBottom: 4,
        }}
      >
        {issue.title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#9A9790",
          lineHeight: 1.5,
          marginBottom: 10,
        }}
      >
        {issue.property}
        {issue.tenant ? ` · ${issue.tenant}` : ""}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 5,
        }}
      >
        {isPriority && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: "#C94A00",
              background: "#FFF1EC",
              border: "1px solid #FFD4C2",
              borderRadius: 99,
              padding: "2px 8px",
              lineHeight: 1.6,
            }}
          >
            Priority
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: "#7A6A00",
            background: "#FEFBE8",
            border: "1px solid #F0E68A",
            borderRadius: 99,
            padding: "2px 8px",
            lineHeight: 1.6,
          }}
        >
          {`Pending · ${duration}`}
        </span>
      </div>
    </div>
  );
}

// ── Notifications slide-in panel ──────────────────────────────────────────────

function NotificationsPanel({
  feed,
  onClose,
}: {
  feed: FmFeedItem[];
  onClose: () => void;
}) {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.18)",
          zIndex: 100,
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: isMobile ? "100vw" : 360,
          background: "#FFFFFF",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.10)",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            borderBottom: "1px solid #EDECEA",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <span
            style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", flex: 1 }}
          >
            Activity
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "#9A9790",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Ico n="x" s={16} c="currentColor" />
          </button>
        </div>

        {/* Feed list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {feed.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 24px",
                gap: 8,
              }}
            >
              <Ico n="wave" s={28} c="#DDDBD6" />
              <span style={{ fontSize: 14, color: "#9A9790" }}>
                No recent activity
              </span>
            </div>
          ) : (
            feed.map((item, i) => {
              const def = EVENT_DEF[item.type] || EVENT_DEF.issue_reported;
              return (
                <div key={item.id}>
                  <div style={{ padding: "14px 20px" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1A1A1A",
                        marginBottom: 3,
                      }}
                    >
                      {def.title}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#9A9790",
                        lineHeight: 1.5,
                        marginBottom: 4,
                      }}
                    >
                      {item.entity} · {item.property}
                    </div>
                    <div style={{ fontSize: 11, color: "#B0ADA8" }}>
                      {formatTime(item.time)}
                    </div>
                  </div>
                  {i < feed.length - 1 && (
                    <div
                      style={{
                        height: 1,
                        background: "#F0EEEA",
                        marginLeft: 20,
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function FacilityManagerDashboard() {
  const { feed, newIds, search, openIssueDetail, issues } = useFmContext();
  const [, tick] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  // Count unread feed items (items added since page load = those in newIds, plus feed length as proxy)
  const unreadCount = feed.filter((f) => newIds.has(f.id)).length;

  useEffect(() => {
    return subscribeToThreadStore(() => tick((n) => n + 1));
  }, []);

  // Task list: open + in_progress only, no resolved
  const activeTasks = issues.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  );

  // Filter by search
  const filtered = activeTasks.filter(
    (i) =>
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.property.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: priority+open first, then open (oldest first), then in_progress
  const sorted = [...filtered].sort((a, b) => {
    const rankA =
      isTaskPriority(a.id) && a.status === "open"
        ? 0
        : a.status === "open"
        ? 1
        : 2;
    const rankB =
      isTaskPriority(b.id) && b.status === "open"
        ? 0
        : b.status === "open"
        ? 1
        : 2;
    if (rankA !== rankB) return rankA - rankB;
    // Within same rank: oldest pending first (smallest time = oldest)
    return a.time - b.time;
  });

  const handleItemClick = (issue: FmIssue) => {
    openIssueDetail(issue);
  };

  return (
    <>
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
        <FacilityManagerHeader
          onNotifClick={() => setNotifOpen(true)}
          notifCount={unreadCount}
        />
        <div style={{ flex: 1, overflowY: "auto", background: "#FFFFFF" }}>
          <div style={{ padding: "24px 20px 0" }}>
            <p
              style={{
                fontSize: 13,
                color: "#9A9790",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              Here you can view and manage all pending maintenance requests
              assigned to you. Tap any request to see details and update
              progress.
            </p>
          </div>

          <div style={{ marginTop: 20, padding: "0 16px 28px" }}>
            {sorted.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 0",
                  gap: 8,
                }}
              >
                <Ico n="wave" s={28} c="#DDDBD6" />
                <span style={{ fontSize: 14, fontWeight: 400, color: "#6B7280" }}>
                  {search
                    ? "No requests match your search"
                    : "No pending tasks — all caught up!"}
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {sorted.map((issue, i) => (
                  <div key={issue.id}>
                    <TaskCard
                      issue={issue}
                      onClick={() => handleItemClick(issue)}
                    />
                    {i < sorted.length - 1 && (
                      <div style={{ height: 1, background: "#F0EEEA", margin: "10px 0" }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {notifOpen && (
        <NotificationsPanel
          feed={feed}
          onClose={() => setNotifOpen(false)}
        />
      )}
    </>
  );
}
