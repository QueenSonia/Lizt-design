"use client";
import { useState, useEffect } from "react";
import { Ico } from "./Icon";
import { FacilityManagerHeader } from "./FacilityManagerHeader";
import { groupByDate, formatTime } from "./helpers";
import { useFmContext } from "./FacilityManagerProvider";
import { EVENT_DEF, FmFeedItem, ISSUES } from "./mockData";
import { isTaskPriority, subscribeToThreadStore } from "@/lib/taskThreadStore";

function FeedRow({
  item,
  isNew,
  onClick,
  pinned,
  isPriority,
}: {
  item: FmFeedItem;
  isNew: boolean;
  onClick: (item: FmFeedItem) => void;
  pinned?: boolean;
  isPriority?: boolean;
}) {
  const issue = ISSUES.find((iss) => iss.id === item.issueId);
  const tenantName = issue?.tenant || null;

  return (
    <div
      className={`fm-feed-row${isNew ? " fm-new-item" : ""}`}
      onClick={() => onClick(item)}
      style={{
        padding: "16px 20px",
        background: pinned ? "#FAFAF9" : "#FFFFFF",
        borderLeft: pinned ? "3px solid #FF5000" : "3px solid transparent",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 5,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#1A1A1A",
            lineHeight: 1.4,
            flex: 1,
            minWidth: 0,
          }}
        >
          {item.entity}
        </span>
        {pinned && (
          <span
            style={{
              flexShrink: 0,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.3,
              color: isPriority ? "#C94A00" : "#7A6A00",
              background: isPriority ? "#FFF1EC" : "#FEFBE8",
              border: `1px solid ${isPriority ? "#FFD4C2" : "#F0E68A"}`,
              borderRadius: 99,
              padding: "2px 7px",
              lineHeight: 1.6,
              textTransform: "uppercase" as const,
            }}
          >
            {isPriority ? "Priority · Pending" : "Pending"}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#9A9790",
          lineHeight: 1.5,
          marginBottom: 4,
        }}
      >
        {item.property}
        {tenantName ? ` · ${tenantName}` : ""}
      </div>
      <div style={{ fontSize: 12, color: "#B0ADA8" }}>
        {formatTime(item.time)}
      </div>
    </div>
  );
}

function DateGroup({
  label,
  items,
  newIds,
  onItemClick,
  isLast,
}: {
  label: string;
  items: FmFeedItem[];
  newIds: Set<string>;
  onItemClick: (item: FmFeedItem) => void;
  isLast: boolean;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.03)",
        marginBottom: isLast ? 0 : 28,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#1A1A1A",
          padding: "16px 20px 12px",
          borderBottom: "1px solid #F0EEE9",
        }}
      >
        {label}
      </div>
      {items.map((item, i) => (
        <div key={item.id}>
          <FeedRow
            item={item}
            isNew={newIds.has(item.id)}
            onClick={onItemClick}
          />
          {i < items.length - 1 && (
            <div style={{ height: 1, background: "#F0EEEA", marginLeft: 23 }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function FacilityManagerDashboard() {
  const { feed, newIds, search, openIssueDetail, issues } = useFmContext();
  const [, tick] = useState(0);

  useEffect(() => {
    return subscribeToThreadStore(() => tick((n) => n + 1));
  }, []);

  const isPending = (item: FmFeedItem) => {
    if (!item.issueId) return false;
    const issue = issues.find((iss) => iss.id === item.issueId);
    return issue?.status === "open";
  };

  const filtered = feed.filter(
    (i) =>
      !search ||
      i.entity.toLowerCase().includes(search.toLowerCase()) ||
      i.property.toLowerCase().includes(search.toLowerCase())
  );

  const pendingItems = filtered
    .filter(isPending)
    .sort((a, b) => {
      const ap = a.issueId && isTaskPriority(a.issueId) ? 0 : 1;
      const bp = b.issueId && isTaskPriority(b.issueId) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return b.time - a.time;
    });

  const pendingIds = new Set(pendingItems.map((i) => i.id));
  const otherItems = filtered.filter((i) => !pendingIds.has(i.id));
  const otherGroups = groupByDate(otherItems);

  const handleItemClick = (item: FmFeedItem) => {
    if (!item.issueId) return;
    const issue = issues.find((iss) => iss.id === item.issueId);
    if (issue) openIssueDetail(issue);
  };

  const isEmpty = pendingItems.length === 0 && otherGroups.length === 0;

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
      <div style={{ flex: 1, overflowY: "auto", background: "#FFFFFF" }}>
        <div style={{ padding: "24px 20px 0" }}>
          <p style={{ fontSize: 13, color: "#9A9790", lineHeight: 1.55, margin: 0 }}>
            Here you can view what's happening across all properties assigned to you.
          </p>
        </div>
        <div style={{ background: "#F5F4F1", padding: "24px 20px 28px", marginTop: 24 }}>
          {isEmpty ? (
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
                No activity matches your search
              </span>
            </div>
          ) : (
            <>
              {pendingItems.length > 0 && (
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.03)",
                    marginBottom: 28,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1A1A1A",
                      padding: "16px 20px 12px",
                      borderBottom: "1px solid #F0EEE9",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Pending
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#FF5000",
                        background: "#FFF1EC",
                        border: "1px solid #FFD4C2",
                        borderRadius: 99,
                        padding: "1px 6px",
                        lineHeight: 1.6,
                      }}
                    >
                      {pendingItems.length}
                    </span>
                  </div>
                  {pendingItems.map((item, i) => {
                    const priority = item.issueId ? isTaskPriority(item.issueId) : false;
                    return (
                      <div key={item.id}>
                        <FeedRow
                          item={item}
                          isNew={newIds.has(item.id)}
                          onClick={handleItemClick}
                          pinned
                          isPriority={priority}
                        />
                        {i < pendingItems.length - 1 && (
                          <div style={{ height: 1, background: "#F0EEEA", marginLeft: 23 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {otherGroups.map((group, gi) => (
                <DateGroup
                  key={group.label}
                  label={group.label}
                  items={group.items}
                  newIds={newIds}
                  isLast={gi === otherGroups.length - 1}
                  onItemClick={handleItemClick}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
