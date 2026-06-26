"use client";
import { useState, useEffect, useMemo } from "react";
import { FacilityManagerHeader } from "./FacilityManagerHeader";
import { useIsMobile, fmtDate } from "./helpers";
import { useFmContext } from "./FacilityManagerProvider";
import { FmIssue, PROPS_DATA } from "./mockData";
import { isTaskPriority, subscribeToThreadStore } from "@/lib/taskThreadStore";
import { ListFilter, type FilterValues, type FilterGroup } from "@/components/ListFilter";

// ── The logged-in FM's name (mock — in a real app, from auth context) ─────────
const MY_NAME = "Jide Akinola";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtResolved(isoString: string): string {
  const d = new Date(isoString);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

function assignmentLabel(issue: FmIssue): { text: string; mine: boolean; unassigned: boolean } {
  if (!issue.assignedTo) return { text: "Unassigned", mine: false, unassigned: true };
  if (issue.assignedTo === MY_NAME) return { text: "Assigned to You", mine: true, unassigned: false };
  return { text: `Assigned to ${issue.assignedTo.split(" ")[0]}`, mine: false, unassigned: false };
}

// ── Issue Row ─────────────────────────────────────────────────────────────────

function IssueRow({
  issue,
  isLast,
  isMobile,
  showAssignment,
  isReadOnly,
  onClick,
}: {
  issue: FmIssue;
  isLast: boolean;
  isMobile: boolean;
  showAssignment: boolean;
  isReadOnly: boolean;
  onClick: () => void;
}) {
  const isResolved = issue.status === "resolved";
  const isPriority = !isResolved && isTaskPriority(issue.id);
  const assignment = assignmentLabel(issue);

  return (
    <div
      onClick={onClick}
      style={{
        padding: "16px 20px",
        borderBottom: isLast ? "none" : "1px solid #F0EEEA",
        cursor: isReadOnly ? "default" : "pointer",
        opacity: isResolved ? 0.85 : 1,
        background: isReadOnly ? "#FAFAF9" : "#FFFFFF",
      }}
    >
      {/* Property name — top line */}
      <div style={{ fontSize: 12, fontWeight: 600, color: "#9A9790", marginBottom: 4, letterSpacing: "0.01em" }}>
        {issue.property}
      </div>

      {/* Title + badges row */}
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
            color: isResolved ? "#6B7280" : isReadOnly ? "#6B7280" : "#1A1A1A",
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}
        >
          {issue.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
          {isPriority && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#C94A00", background: "#FFF1EC", border: "1px solid #FFD4C2", borderRadius: 99, padding: "2px 8px", lineHeight: 1.6, display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 9 }}>▲</span> Priority
            </span>
          )}
          {isResolved ? (
            <span style={{ fontSize: 11, fontWeight: 500, color: "#176B3A", background: "#EDFAF3", border: "1px solid #A5E5C3", borderRadius: 99, padding: "2px 8px", lineHeight: 1.6 }}>
              Resolved
            </span>
          ) : issue.status === "in_progress" ? (
            <span style={{ fontSize: 11, fontWeight: 500, color: "#1E56A0", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 99, padding: "2px 8px", lineHeight: 1.6 }}>
              In Progress
            </span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 500, color: "#7A6A00", background: "#FEFBE8", border: "1px solid #F0E68A", borderRadius: 99, padding: "2px 8px", lineHeight: 1.6 }}>
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ fontSize: 12, color: "#9A9790", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        {issue.tenant && (
          <>
            <span style={{ color: "#C0BDB8" }}>
              Created by: <span style={{ color: "#9A9790", fontWeight: 500 }}>{issue.tenant}</span>
            </span>
            <span style={{ color: "#D5D2CD" }}>·</span>
          </>
        )}
        <span>
          {isResolved && issue.resolutions?.[issue.resolutions.length - 1]?.resolvedAt
            ? fmtResolved(issue.resolutions[issue.resolutions.length - 1].resolvedAt!)
            : fmtDate(issue.time)}
        </span>
        {issue.attachments && issue.attachments.length > 0 && (
          <>
            <span style={{ color: "#D5D2CD" }}>·</span>
            <span style={{ color: "#C0BDB8", display: "flex", alignItems: "center", gap: 3 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              {issue.attachments.length} attachment{issue.attachments.length !== 1 ? "s" : ""}
            </span>
          </>
        )}
        {showAssignment && issue.assignedTo && (
          <>
            <span style={{ color: "#D5D2CD" }}>·</span>
            <span style={{ color: "#C0BDB8" }}>
              Assigned to: <span style={{ color: issue.assignedTo === MY_NAME ? "#FF5000" : "#9A9790", fontWeight: 500 }}>{issue.assignedTo}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Issue Group List ──────────────────────────────────────────────────────────

function IssueList({ items, showAssignment, isMobile, onOpen }: {
  items: FmIssue[];
  showAssignment: boolean;
  isMobile: boolean;
  onOpen: (i: FmIssue) => void;
}) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.03)", overflow: "hidden" }}>
      {items.map((issue, i) => {
        const isReadOnly = showAssignment && issue.assignedTo !== MY_NAME;
        return (
          <IssueRow
            key={issue.id}
            issue={issue}
            isLast={i === items.length - 1}
            isMobile={isMobile}
            showAssignment={showAssignment}
            isReadOnly={isReadOnly}
            onClick={() => { if (!isReadOnly) onOpen(issue); }}
          />
        );
      })}
    </div>
  );
}

// ── Filter groups ─────────────────────────────────────────────────────────────

const TASK_FILTER_GROUPS_ALL: FilterGroup[] = [
  {
    key: "assignment",
    label: "Assignment",
    options: [
      { value: "me", label: "Assigned to Me" },
      { value: "others", label: "Assigned to Others" },
      { value: "unassigned", label: "Unassigned" },
    ],
  },
  {
    key: "status",
    label: "Status",
    options: [
      { value: "open", label: "Pending" },
      { value: "in_progress", label: "In Progress" },
      { value: "resolved", label: "Resolved" },
    ],
    multi: true,
  },
  {
    key: "priority",
    label: "Priority",
    options: [
      { value: "high", label: "High Priority" },
    ],
  },
  {
    key: "property",
    label: "Property",
    options: PROPS_DATA.map((p) => ({ value: p.id, label: p.name })),
    multi: true,
  },
];

const TASK_FILTER_GROUPS_MINE: FilterGroup[] = TASK_FILTER_GROUPS_ALL.filter(
  (g) => g.key !== "assignment"
);

const EMPTY_FILTERS: FilterValues = {};

// ── Search + Filter bar ───────────────────────────────────────────────────────

function SearchBar({
  value,
  onChange,
  filterGroups,
  filterValues,
  onFilterChange,
  onFilterClear,
}: {
  value: string;
  onChange: (v: string) => void;
  filterGroups: FilterGroup[];
  filterValues: FilterValues;
  onFilterChange: (v: FilterValues) => void;
  onFilterClear: () => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        {/* Search input */}
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9A9790", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search tasks..."
            style={{ width: "100%", paddingLeft: 32, paddingRight: 10, height: 36, border: "1px solid #E5E3DF", borderRadius: 8, fontSize: 13, color: "#1A1A1A", background: "#FAFAF9", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        {/* Filter button — uses ListFilter which handles chips internally */}
        <ListFilter
          groups={filterGroups}
          values={filterValues}
          onChange={onFilterChange}
          onClear={onFilterClear}
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type Tab = "mine" | "all";

export default function FacilityManagerIssues() {
  const isMobile = useIsMobile();
  const { issues, openIssueDetail } = useFmContext();
  const [, tick] = useState(0);
  const [tab, setTab] = useState<Tab>("mine");
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>(EMPTY_FILTERS);

  useEffect(() => {
    return subscribeToThreadStore(() => tick((n) => n + 1));
  }, []);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setSearch("");
    setFilterValues(EMPTY_FILTERS);
  };

  const myIssues = useMemo(() => issues.filter((i) => i.assignedTo === MY_NAME), [issues]);
  const allIssues = useMemo(() => issues, [issues]);

  const filterIssues = (pool: FmIssue[]) => {
    const q = search.toLowerCase().trim();
    let result = q
      ? pool.filter((i) =>
          i.title.toLowerCase().includes(q) ||
          i.property.toLowerCase().includes(q) ||
          (i.tenant && i.tenant.toLowerCase().includes(q))
        )
      : pool;

    // Assignment
    const assign = filterValues["assignment"] ?? [];
    if (assign.length > 0) {
      result = result.filter((i) =>
        assign.some((a) => {
          if (a === "me") return i.assignedTo === MY_NAME;
          if (a === "others") return i.assignedTo && i.assignedTo !== MY_NAME;
          if (a === "unassigned") return !i.assignedTo;
          return false;
        })
      );
    }

    // Status
    const statuses = filterValues["status"] ?? [];
    if (statuses.length > 0) {
      result = result.filter((i) => statuses.includes(i.status));
    }

    // Priority
    const priority = filterValues["priority"] ?? [];
    if (priority.includes("high")) {
      result = result.filter((i) => isTaskPriority(i.id));
    }

    // Property
    const props = filterValues["property"] ?? [];
    if (props.length > 0) {
      result = result.filter((i) => props.includes(i.propertyId));
    }

    return result;
  };

  const source = tab === "mine" ? myIssues : allIssues;
  const visible = filterIssues(source);

  const pending = visible
    .filter((i) => i.status === "open" || i.status === "in_progress")
    .sort((a, b) => {
      const pa = isTaskPriority(a.id) ? 0 : 1;
      const pb = isTaskPriority(b.id) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return b.time - a.time;
    });

  const resolved = visible
    .filter((i) => i.status === "resolved")
    .sort((a, b) => {
      const aAt = a.resolutions?.[a.resolutions.length - 1]?.resolvedAt
        ? new Date(a.resolutions[a.resolutions.length - 1].resolvedAt!).getTime()
        : a.time;
      const bAt = b.resolutions?.[b.resolutions.length - 1]?.resolvedAt
        ? new Date(b.resolutions[b.resolutions.length - 1].resolvedAt!).getTime()
        : b.time;
      return bAt - aAt;
    });

  const showAssignment = tab === "all";

  const SectionLabel = ({ label, count }: { label: string; count: number }) => (
    <div style={{ fontSize: 11, fontWeight: 600, color: "#B0ADA8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
      {label} · {count}
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden", background: "#FFFFFF" }}>
      <FacilityManagerHeader />

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #EDECEA", background: "#FFFFFF", flexShrink: 0 }}>
        <div style={{ display: "flex", padding: isMobile ? "0 12px" : "0 20px", gap: 0 }}>
          {(["mine", "all"] as Tab[]).map((t) => {
            const label = t === "mine" ? "My Tasks" : "All Tasks";
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                style={{
                  padding: "12px 16px",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#FF5000" : "#6B7280",
                  background: "none",
                  border: "none",
                  borderBottom: active ? "2px solid #FF5000" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  flexShrink: 0,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 12px 32px" : "20px 20px 32px" }}>

        {/* Subtitle */}
        <p style={{ fontSize: 13, color: "#9A9790", lineHeight: 1.55, margin: "0 0 12px", maxWidth: 520 }}>
          {tab === "mine"
            ? "Maintenance requests assigned to you. Tap any request to view details and take action."
            : "All maintenance requests across the portfolio. You can view all tasks but can only action your own."}
        </p>
        <div style={{ height: 1, background: "#F0EEE9", marginBottom: 20 }} />

        {/* Search + filter */}
        <SearchBar
          value={search}
          onChange={setSearch}
          filterGroups={tab === "all" ? TASK_FILTER_GROUPS_ALL : TASK_FILTER_GROUPS_MINE}
          filterValues={filterValues}
          onFilterChange={setFilterValues}
          onFilterClear={() => setFilterValues(EMPTY_FILTERS)}
        />

        {/* Empty state — no assigned tasks */}
        {tab === "mine" && myIssues.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 48, paddingBottom: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>You don't have any assigned tasks yet.</p>
            <p style={{ fontSize: 13, color: "#9A9790", marginBottom: 20 }}>Tasks assigned to you will appear here.</p>
            <button
              onClick={() => handleTabChange("all")}
              style={{ fontSize: 13, fontWeight: 600, color: "#FF5000", background: "#FFF3EB", border: "1px solid #FFD4C2", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              View All Tasks
            </button>
          </div>
        )}

        {/* Empty state — filters / search */}
        {(tab === "mine" ? myIssues.length > 0 : true) && pending.length === 0 && resolved.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 48, color: "#B0ADA8", fontSize: 13 }}>
            {search || Object.values(filterValues).some((v) => v.length > 0) ? "No tasks match your search or filters." : "No tasks yet."}
          </div>
        )}

        {/* Pending / Active */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionLabel label="Active" count={pending.length} />
            <IssueList items={pending} showAssignment={showAssignment} isMobile={isMobile} onOpen={openIssueDetail} />
          </div>
        )}

        {/* Resolved */}
        {resolved.length > 0 && (
          <div>
            <SectionLabel label="Resolved" count={resolved.length} />
            <IssueList items={resolved} showAssignment={showAssignment} isMobile={isMobile} onOpen={openIssueDetail} />
          </div>
        )}
      </div>
    </div>
  );
}
