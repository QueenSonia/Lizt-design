"use client";
import { useState } from "react";
import { Ico } from "./Icon";
import { FacilityManagerHeader } from "./FacilityManagerHeader";
import { useIsMobile, fmtDate } from "./helpers";
import { useFmContext } from "./FacilityManagerProvider";
import { ResolutionModal } from "./ResolutionModal";
import {
  FmIssue,
  FmProperty,
  FmResolution,
  ISSUES,
  PROPS_DATA,
  PROP_STATUS_CONFIG,
  TENANTS_DATA,
} from "./mockData";

function PropertyDetail({
  prop,
  onBack,
}: {
  prop: FmProperty;
  onBack: () => void;
}) {
  const isMobile = useIsMobile();
  const tenant = TENANTS_DATA.find((t) => t.property === prop.name) || null;
  const { openReportModal, openIssueDetail } = useFmContext();
  const [issues, setIssues] = useState<FmIssue[]>(() =>
    ISSUES.filter((i) => i.propertyId === prop.id).sort((a, b) => {
      const rank: Record<string, number> = {
        open: 0,
        in_progress: 1,
        resolved: 2,
      };
      const ra = rank[a.status] ?? 99;
      const rb = rank[b.status] ?? 99;
      if (ra !== rb) return ra - rb;
      return b.time - a.time;
    })
  );
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const updateStatus = (
    id: string,
    status: string,
    resolution?: FmResolution
  ) => {
    setIssues((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const next: FmIssue = { ...i, status: status as FmIssue["status"] };
        if (resolution !== undefined) next.resolution = resolution;
        return next;
      })
    );
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "#B0ADA8",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 10,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#F5F4F1",
      }}
    >
      <div
        style={{
          padding: "14px 16px 16px",
          borderBottom: "1px solid #EDECEA",
          background: "#FFFFFF",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={onBack}
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
            <span style={{ display: "flex", transform: "rotate(90deg)" }}>
              <Ico n="chev" s={16} c="currentColor" />
            </span>
          </button>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#1A1A1A",
              flex: 1,
            }}
          >
            {prop.name}
          </span>
          <button
            onClick={() => openReportModal({ initialProp: prop.id })}
            className="fm-btn-cta"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: isMobile ? "0" : "7px 13px",
              width: isMobile ? 34 : "auto",
              height: isMobile ? 34 : "auto",
              justifyContent: "center",
              background: "#FF5000",
              border: "none",
              borderRadius: 8,
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            <Ico n="plus" s={isMobile ? 14 : 13} c="#fff" />
            {!isMobile && "Report Issue"}
          </button>
        </div>
        {tenant && (
          <>
            <div
              style={{
                borderTop: "1px solid #F0EEEA",
                margin: "12px 0",
              }}
            />
            <div style={{ paddingLeft: 4 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: 2,
                }}
              >
                {tenant.name}
              </div>
              <div style={{ fontSize: 12, color: "#9A9790" }}>
                {tenant.phone}
              </div>
            </div>
          </>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px 32px",
          width: "100%",
        }}
      >
        <div>
          <div style={sectionLabel}>Service Requests</div>
          {issues.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                paddingTop: 36,
                color: "#B0ADA8",
                fontSize: 13,
              }}
            >
              No service requests
            </div>
          ) : (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #EDECEA",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {issues.map((issue, i) => {
                const st =
                  PROP_STATUS_CONFIG[issue.status] || PROP_STATUS_CONFIG.open;
                const isResolved = issue.status === "resolved";
                return (
                  <div
                    key={issue.id}
                    className="fm-feed-row"
                    onClick={() => openIssueDetail(issue)}
                    style={{
                      display: "flex",
                      gap: 14,
                      padding: "16px 20px",
                      borderBottom:
                        i < issues.length - 1 ? "1px solid #F0EEEA" : "none",
                      opacity: isResolved ? 0.5 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: 3,
                        borderRadius: 99,
                        background: isResolved ? "#D5D2CD" : "#DDDBD6",
                        flexShrink: 0,
                        alignSelf: "stretch",
                        marginTop: 2,
                        marginBottom: 2,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: isMobile ? "column" : "row",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: isMobile ? 6 : 10,
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#1A1A1A",
                            lineHeight: 1.4,
                            wordBreak: "break-word",
                          }}
                        >
                          {issue.title}
                        </div>
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 500,
                            color: st.c,
                            background: st.bg,
                            border: `1px solid ${st.bd}`,
                            borderRadius: 99,
                            padding: "2px 8px",
                            lineHeight: 1.6,
                          }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontSize: 12, color: "#B0ADA8" }}>
                          {fmtDate(issue.time)}
                        </span>
                        {issue.status === "open" && (
                          <button
                            className="fm-action-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResolvingId(issue.id);
                            }}
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: "#FF5000",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Mark as resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {resolvingId && (
        <ResolutionModal
          issue={issues.find((i) => i.id === resolvingId) ?? null}
          onClose={() => setResolvingId(null)}
          onConfirm={(resolution) =>
            updateStatus(resolvingId, "resolved", resolution)
          }
        />
      )}
    </div>
  );
}

export default function FacilityManagerProperties() {
  const [activeProp, setActiveProp] = useState<FmProperty | null>(null);

  if (activeProp) {
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
        <div style={{ flex: 1, overflow: "hidden" }}>
          <PropertyDetail
            prop={activeProp}
            onBack={() => setActiveProp(null)}
          />
        </div>
      </div>
    );
  }

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
          padding: "16px 0 32px",
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: "#9A9790",
            lineHeight: 1.55,
            margin: "0 20px 12px",
            maxWidth: 480,
            opacity: 0.85,
          }}
        >
          These are the properties assigned to you. Tap any property to view
          details and manage service requests.
        </p>
        <div
          style={{
            height: 1,
            background: "#F0EEE9",
            marginBottom: 16,
          }}
        />
        {PROPS_DATA.map((p, i) => {
          const hasPending = ISSUES.some(
            (iss) => iss.propertyId === p.id && iss.status === "open"
          );
          return (
            <div
              key={p.id}
              className="fm-list-row"
              onClick={() => setActiveProp(p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 20px",
                borderBottom:
                  i < PROPS_DATA.length - 1 ? "1px solid #F0EEEA" : "none",
              }}
            >
              <div
                className="fm-list-row-bar"
                style={{
                  width: 2,
                  alignSelf: "stretch",
                  background: "#3B4A66",
                  flexShrink: 0,
                  borderRadius: 1,
                  transition: "background .15s",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1A1A1A",
                    lineHeight: 1.45,
                    marginBottom: 3,
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#9A9790",
                    lineHeight: 1.4,
                  }}
                >
                  {p.loc}
                </div>
              </div>
              {hasPending && (
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#FF8C55",
                    flexShrink: 0,
                  }}
                />
              )}
              <span className="fm-row-chev">
                <Ico n="chev" s={14} c="currentColor" />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
