"use client";
import { useState } from "react";
import { Ico } from "./Icon";
import { FacilityManagerHeader } from "./FacilityManagerHeader";
import { useIsMobile, fmtDate } from "./helpers";
import { useFmContext } from "./FacilityManagerProvider";
import { ResolutionModal } from "./ResolutionModal";
import {
  CA_REQUESTS_SEED,
  CA_STATUS_MAP,
  COMMON_AREAS_DATA,
  FmCaRequest,
  FmCaRequestStatus,
  FmCommonArea,
  FmResolution,
  PROP_STATUS_CONFIG,
} from "./mockData";

function CommonAreaDetail({
  area,
  onBack,
}: {
  area: FmCommonArea;
  onBack: () => void;
}) {
  const isMobile = useIsMobile();
  const { openReportModal, openIssueDetail } = useFmContext();
  const [requests, setRequests] = useState<FmCaRequest[]>(() =>
    CA_REQUESTS_SEED.filter((r) => r.caId === area.id).sort(
      (a, b) => b.time - a.time
    )
  );
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fromIssueStatus = (s: string): FmCaRequestStatus =>
    s === "resolved" ? "resolved" : "pending";

  const updateStatus = (
    id: string,
    status: string,
    resolution?: FmResolution
  ) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next: FmCaRequest = { ...r, status: fromIssueStatus(status) };
        if (resolution !== undefined) next.resolution = resolution;
        return next;
      })
    );
  };

  const adaptToIssue = (r: FmCaRequest) => ({
    id: r.id,
    title: r.title,
    desc: r.desc,
    time: r.time,
    property: area.name,
    status:
      r.status === "resolved"
        ? "resolved"
        : r.status === "approved"
        ? "in_progress"
        : "open",
    resolution: r.resolution,
  });

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
            {area.name}
          </span>
          <button
            onClick={() => openReportModal({ initialArea: area.name })}
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
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px 32px",
          width: "100%",
        }}
      >
        <div style={sectionLabel}>Service Requests</div>
        {requests.length === 0 ? (
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
            {requests.map((r, i) => {
              const stKey = CA_STATUS_MAP[r.status] || "open";
              const st = PROP_STATUS_CONFIG[stKey];
              const isActionable =
                r.status === "pending" || r.status === "not_resolved";
              return (
                <div
                  key={r.id}
                  className="fm-feed-row"
                  onClick={() => openIssueDetail(adaptToIssue(r))}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "16px 20px",
                    borderBottom:
                      i < requests.length - 1 ? "1px solid #F0EEEA" : "none",
                    opacity: r.status === "resolved" ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      borderRadius: 99,
                      background:
                        r.status === "resolved" ? "#D5D2CD" : "#DDDBD6",
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
                        {r.title}
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
                        {fmtDate(r.time)}
                      </span>
                      {isActionable && (
                        <button
                          className="fm-action-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResolvingId(r.id);
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

      {resolvingId && (
        <ResolutionModal
          issue={requests.find((r) => r.id === resolvingId) ?? null}
          onClose={() => setResolvingId(null)}
          onConfirm={(resolution) =>
            updateStatus(resolvingId, "resolved", resolution)
          }
        />
      )}
    </div>
  );
}

export default function FacilityManagerCommonAreas() {
  const [activeArea, setActiveArea] = useState<FmCommonArea | null>(null);

  if (activeArea) {
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
          <CommonAreaDetail
            area={activeArea}
            onBack={() => setActiveArea(null)}
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
          These are the common areas you manage. Tap any area to view details
          and handle service requests.
        </p>
        <div
          style={{ height: 1, background: "#F0EEE9", marginBottom: 16 }}
        />
        {COMMON_AREAS_DATA.map((a, i) => (
          <div
            key={a.id}
            className="fm-list-row"
            onClick={() => setActiveArea(a)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 20px",
              borderBottom:
                i < COMMON_AREAS_DATA.length - 1
                  ? "1px solid #F0EEEA"
                  : "none",
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
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 14,
                fontWeight: 600,
                color: "#1A1A1A",
                lineHeight: 1.45,
              }}
            >
              {a.name}
            </div>
            <span className="fm-row-chev">
              <Ico n="chev" s={14} c="currentColor" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
