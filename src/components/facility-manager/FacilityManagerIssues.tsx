"use client";
import { FacilityManagerHeader } from "./FacilityManagerHeader";
import { useIsMobile, fmtDate } from "./helpers";
import { useFmContext } from "./FacilityManagerProvider";

export default function FacilityManagerIssues() {
  const isMobile = useIsMobile();
  const { issues, openIssueDetail } = useFmContext();
  const pending = issues
    .filter((i) => i.status === "open")
    .sort((a, b) => b.time - a.time);

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
          padding: "20px 16px 32px",
        }}
      >
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
        <div style={{ height: 1, background: "#F0EEE9", marginBottom: 16 }} />
        {pending.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              paddingTop: 48,
              color: "#B0ADA8",
              fontSize: 13,
            }}
          >
            No pending tasks
          </div>
        ) : (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              boxShadow:
                "0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.03)",
              overflow: "hidden",
            }}
          >
            {pending.map((issue, i) => (
              <div
                key={issue.id}
                className="fm-list-row"
                onClick={() => openIssueDetail(issue)}
                style={{
                  padding: "16px 20px",
                  borderBottom:
                    i < pending.length - 1 ? "1px solid #F0EEEA" : "none",
                  cursor: "pointer",
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
                  {issue.tenant && (
                    <span style={{ color: "#D5D2CD" }}>·</span>
                  )}
                  <span>{fmtDate(issue.time)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
