"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Ico, FmIconName } from "./Icon";
import { useIsMobile } from "./helpers";
import { useFmContext } from "./FacilityManagerProvider";
import { useAuth } from "@/contexts/AuthContext";

const LOGO_FULL = (
  <svg
    width="68"
    height="30"
    viewBox="0 0 2091 930"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M537.747 114C561.095 114 583.466 123.377 599.836 140.024L757.915 300.783C773.93 317.069 782.904 338.996 782.904 361.837V631.68C782.904 679.772 743.918 718.758 695.826 718.758H627.238L676.854 659.244C681.581 653.574 677.551 644.964 670.169 644.961L559.826 644.916C550.211 644.912 542.418 637.116 542.418 627.5V358.743C542.418 329.15 529.87 300.944 507.89 281.13L415.493 197.839C409.891 192.789 400.954 196.764 400.954 204.307V621.053C400.954 647.191 413.986 671.61 435.701 686.159C437.13 687.117 437.277 689.163 435.999 690.314L404.437 718.758H251.078C202.986 718.758 164 679.772 164 631.68V361.837C164 338.996 172.975 317.069 188.989 300.783L347.068 140.024C363.439 123.377 385.809 114 409.157 114H537.747Z"
      fill="#FE5001"
    />
    <path
      d="M1853.73 678.361C1811.3 678.361 1779.72 668.987 1759 650.239C1738.77 631.49 1728.66 602.134 1728.66 562.17V374.93V295.742V184.731H1818.95V295.742H1925.52V374.93H1818.95V550.328C1818.95 567.597 1823.14 579.931 1831.53 587.332C1839.92 594.239 1853.73 597.693 1872.97 597.693C1891.72 597.693 1909.73 595.72 1927 591.773V668C1904.3 674.908 1879.88 678.361 1853.73 678.361Z"
      fill="#1A1A1A"
    />
    <path
      d="M1673.85 594.734V672.442H1364.5V609.535L1557.66 373.451H1370.42V295.743H1671.63V358.649L1478.47 594.734H1673.85Z"
      fill="#1A1A1A"
    />
    <path
      d="M1253.94 232.838C1236.67 232.838 1222.61 227.658 1211.76 217.297C1201.4 206.442 1196.22 192.874 1196.22 176.592C1196.22 160.311 1201.4 146.989 1211.76 136.628C1222.61 125.774 1236.67 120.347 1253.94 120.347C1270.72 120.347 1284.28 125.774 1294.65 136.628C1305.5 146.989 1310.93 160.311 1310.93 176.592C1310.93 192.874 1305.5 206.442 1294.65 217.297C1284.28 227.658 1270.72 232.838 1253.94 232.838ZM1208.8 295.745H1299.09V672.443H1208.8V295.745Z"
      fill="#1A1A1A"
    />
    <path
      d="M1136.5 585.112V672.441H1004.94C967.558 672.441 937.255 642.138 937.255 604.758V154.388H1031.25V568.191C1031.25 577.537 1038.82 585.112 1048.17 585.112H1136.5Z"
      fill="#1A1A1A"
    />
  </svg>
);

const NAV_ITEMS: { id: string; ico: FmIconName; lbl: string }[] = [
  { id: "dashboard", ico: "grid", lbl: "Dashboard" },
  { id: "issues", ico: "alert", lbl: "Issues" },
  { id: "properties", ico: "home", lbl: "Properties" },
  { id: "common-areas", ico: "pin", lbl: "Common Areas" },
];

function SidebarInner({
  active,
  onNav,
  col,
  setCol,
  mobile,
  search,
  onSearch,
  issuesBadge,
  user,
  onLogout,
}: {
  active: string;
  onNav: (id: string) => void;
  col: boolean;
  setCol: (next: boolean) => void;
  mobile: boolean;
  search: string;
  onSearch: (q: string) => void;
  issuesBadge: boolean;
  user: { name: string; initials: string } | null;
  onLogout: () => void;
}) {
  const showLabel = !col;
  return (
    <aside
      style={{
        width: col ? 54 : mobile ? 248 : 218,
        minWidth: col ? 54 : mobile ? 248 : 218,
        height: "100vh",
        background: "#FFFFFF",
        borderRight: "1px solid #EDECEA",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        flexShrink: 0,
        transition: mobile
          ? "none"
          : "width .2s cubic-bezier(.4,0,.2,1), min-width .2s cubic-bezier(.4,0,.2,1)",
      }}
    >
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          padding: showLabel ? "0 13px" : 0,
          justifyContent: showLabel ? "flex-start" : "center",
          gap: 10,
          borderBottom: "1px solid #EDECEA",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setCol(!col)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6B7280",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: 0,
          }}
        >
          <Ico n="menu" s={16} c="currentColor" />
        </button>
        {showLabel && LOGO_FULL}
      </div>

      {showLabel && (
        <div style={{ padding: "10px 10px 2px", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 9,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#C8C5C0",
                pointerEvents: "none",
              }}
            >
              <Ico n="search" s={13} />
            </div>
            <input
              className="fm-search-input"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search activity…"
              style={{
                width: "100%",
                padding: "8px 10px 8px 28px",
                background: "#F5F4F1",
                border: "1px solid #E2E0DC",
                borderRadius: 8,
                color: "#2A2A2A",
                fontSize: 13,
                transition: "all .15s",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      )}

      <nav style={{ flex: 1, padding: "10px 7px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          const showBadge = item.id === "issues" && issuesBadge;
          return (
            <div
              key={item.id}
              className={`fm-nav-btn${isActive ? " fm-active" : ""}`}
              onClick={() => onNav(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: showLabel ? "11px 10px" : "11px",
                marginBottom: 2,
                justifyContent: showLabel ? "flex-start" : "center",
                minHeight: 44,
                position: "relative",
              }}
            >
              <span
                className="fm-nav-ico"
                style={{
                  color: isActive ? "#FF5000" : "#C0BDB8",
                  display: "flex",
                  position: "relative",
                }}
              >
                <Ico n={item.ico} s={15} c="currentColor" />
                {showBadge && !showLabel && (
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#FF8C55",
                      border: "2px solid #FFFFFF",
                    }}
                  />
                )}
              </span>
              {showLabel && (
                <>
                  <span
                    className="fm-nav-lbl"
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? "#FF5000" : "#6B7280",
                    }}
                  >
                    {item.lbl}
                  </span>
                  {showBadge && (
                    <span
                      style={{
                        marginLeft: "auto",
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#FF8C55",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </nav>

      <div
        style={{
          padding: showLabel ? "12px 13px" : "12px 7px",
          borderTop: "1px solid #EDECEA",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
          justifyContent: showLabel ? "flex-start" : "center",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "#E8E6E1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            color: "#6B6863",
            flexShrink: 0,
          }}
        >
          {user?.initials ?? "FM"}
        </div>
        {showLabel && (
          <div
            style={{
              minWidth: 0,
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#1A1A1A",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name ?? "Facility Manager"}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>Facility Manager</div>
          </div>
        )}
        {showLabel && (
          <button
            onClick={onLogout}
            aria-label="Sign out"
            className="fm-icon-btn"
            style={{
              background: "transparent",
              border: "none",
              borderRadius: 8,
              padding: 6,
              cursor: "pointer",
              color: "#9A9790",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Ico n="logout" s={15} />
          </button>
        )}
      </div>
    </aside>
  );
}

export function FacilityManagerSidebar() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const {
    search,
    setSearch,
    hasUnseenIssues,
    markIssuesSeen,
    sidebarCollapsed,
    setSidebarCollapsed,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
  } = useFmContext();

  // Initialize collapsed state for mobile
  useEffect(() => {
    if (isMobile && !isMobileSidebarOpen) {
      setSidebarCollapsed(true);
    } else if (!isMobile) {
      // On desktop, never auto-close; respect user toggle
    }
  }, [isMobile, isMobileSidebarOpen, setSidebarCollapsed]);

  const segments = pathname.split("/").filter(Boolean);
  const active = segments[1] || "dashboard";

  const handleNav = (id: string) => {
    if (id === "issues") markIssuesSeen();
    if (isMobile) setMobileSidebarOpen(false);
    router.push(`/facility-manager/${id}`);
  };

  const fmUser = user
    ? {
        name: user.name ?? user.email,
        initials: (user.name ?? user.email)
          .split(" ")
          .map((p) => p[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase(),
      }
    : null;

  if (isMobile) {
    if (!isMobileSidebarOpen) return null;
    return (
      <>
        <div
          className="fm-fade-bg"
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.4)",
            zIndex: 200,
          }}
        />
        <div
          className="fm-mob-drawer"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            zIndex: 201,
          }}
        >
          <SidebarInner
            active={active}
            onNav={handleNav}
            col={false}
            setCol={() => setMobileSidebarOpen(false)}
            mobile
            search={search}
            onSearch={setSearch}
            issuesBadge={hasUnseenIssues}
            user={fmUser}
            onLogout={logout}
          />
        </div>
      </>
    );
  }

  return (
    <SidebarInner
      active={active}
      onNav={handleNav}
      col={sidebarCollapsed}
      setCol={(next) => setSidebarCollapsed(next)}
      mobile={false}
      search={search}
      onSearch={setSearch}
      issuesBadge={hasUnseenIssues}
      user={fmUser}
      onLogout={logout}
    />
  );
}
