"use client";
import { Ico } from "./Icon";
import { FacilityManagerHeader } from "./FacilityManagerHeader";
import { groupByDate, formatTime } from "./helpers";
import { useFmContext } from "./FacilityManagerProvider";
import { EVENT_DEF, FmFeedItem, ISSUES } from "./mockData";

function FeedRow({
  item,
  isNew,
  onClick,
}: {
  item: FmFeedItem;
  isNew: boolean;
  onClick: (item: FmFeedItem) => void;
}) {
  const def = EVENT_DEF[item.type] || EVENT_DEF.issue_reported;
  const issue = ISSUES.find((iss) => iss.id === item.issueId);
  const tenantName = issue?.tenant || null;

  return (
    <div
      className={`fm-feed-row${isNew ? " fm-new-item" : ""}`}
      onClick={() => onClick(item)}
      style={{ padding: "16px 20px", background: "#FFFFFF" }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#1A1A1A",
          marginBottom: 7,
          lineHeight: 1.4,
        }}
      >
        {def.title}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 400,
          color: "#4A4845",
          lineHeight: 1.5,
          marginBottom: 6,
        }}
      >
        “{item.entity}” · {item.property}
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
        {tenantName && <span>{tenantName}</span>}
        {tenantName && <span style={{ color: "#D5D2CD" }}>·</span>}
        <span>{formatTime(item.time)}</span>
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
        boxShadow:
          "0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.03)",
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
            <div
              style={{
                height: 1,
                background: "#F0EEEA",
                marginLeft: 20,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function FacilityManagerDashboard() {
  const { feed, newIds, search, openIssueDetail, issues } = useFmContext();

  const filtered = feed.filter(
    (i) =>
      !search ||
      i.entity.toLowerCase().includes(search.toLowerCase()) ||
      i.property.toLowerCase().includes(search.toLowerCase())
  );
  const groups = groupByDate(filtered);

  const handleItemClick = (item: FmFeedItem) => {
    if (!item.issueId) return;
    const issue = issues.find((iss) => iss.id === item.issueId);
    if (issue) openIssueDetail(issue);
  };

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
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#FFFFFF",
        }}
      >
        <div style={{ padding: "24px 20px 0" }}>
          <p
            style={{
              fontSize: 13,
              color: "#9A9790",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Here you can view what's happening across all properties assigned
            to you.
          </p>
        </div>
        <div
          style={{
            background: "#F5F4F1",
            padding: "24px 20px 28px",
            marginTop: 24,
          }}
        >
          {groups.length === 0 ? (
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
              <span
                style={{ fontSize: 14, fontWeight: 400, color: "#6B7280" }}
              >
                No activity matches your search
              </span>
            </div>
          ) : (
            groups.map((group, gi) => (
              <DateGroup
                key={group.label}
                label={group.label}
                items={group.items}
                newIds={newIds}
                isLast={gi === groups.length - 1}
                onItemClick={handleItemClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
