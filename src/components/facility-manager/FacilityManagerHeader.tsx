"use client";
import { usePathname } from "next/navigation";
import { Ico } from "./Icon";
import { useIsMobile } from "./helpers";
import { useFmContext } from "./FacilityManagerProvider";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  issues: "Tasks",
  properties: "Properties",
  "common-areas": "Common Areas",
};

const HIDE_REPORT_ON: string[] = ["properties", "common-areas"];

export function FacilityManagerHeader({
  onNotifClick,
  notifCount = 0,
}: {
  onNotifClick?: () => void;
  notifCount?: number;
}) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { openReportModal, setMobileSidebarOpen } = useFmContext();

  const segments = pathname.split("/").filter(Boolean);
  const screen = segments[1] || "dashboard";
  const title = PAGE_TITLES[screen] ?? "Dashboard";
  const showReport = !HIDE_REPORT_ON.includes(screen);
  const showNotif = !!onNotifClick;

  return (
    <header
      style={{
        height: 52,
        display: "flex",
        alignItems: "center",
        padding: isMobile ? "0 12px" : "0 20px",
        borderBottom: "1px solid #EDECEA",
        background: "#FFFFFF",
        gap: isMobile ? 8 : 14,
        flexShrink: 0,
      }}
    >
      {isMobile && (
        <button
          onClick={() => setMobileSidebarOpen(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6B7280",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: 0,
            marginLeft: -4,
          }}
        >
          <Ico n="menu" s={18} c="currentColor" />
        </button>
      )}
      <h1
        style={{
          fontSize: isMobile ? 16 : 20,
          fontWeight: 600,
          color: "#1A1A1A",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </h1>

      {/* Notifications bell — dashboard only */}
      {showNotif && (
        <button
          onClick={onNotifClick}
          style={{
            position: "relative",
            background: "none",
            border: "1px solid #EDECEA",
            borderRadius: 8,
            cursor: "pointer",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "#6B7280",
          }}
          aria-label="Activity notifications"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          {notifCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#FF5000",
                border: "1.5px solid #FFFFFF",
              }}
            />
          )}
        </button>
      )}

      {showReport && (
        <button
          onClick={() => openReportModal()}
          className="fm-btn-cta"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: isMobile ? "0" : "8px 15px",
            width: isMobile ? 36 : "auto",
            height: isMobile ? 36 : "auto",
            justifyContent: "center",
            background: "#FF5000",
            border: "none",
            borderRadius: 8,
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            flexShrink: 0,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <Ico n="plus" s={isMobile ? 15 : 14} c="#fff" />
          {!isMobile && "Report Issue"}
        </button>
      )}
    </header>
  );
}
