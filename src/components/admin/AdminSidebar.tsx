"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { id: "overview",       label: "Overview"          },
  { id: "rent-payments",  label: "Rent and Payments" },
  { id: "occupancy",      label: "Occupancy"         },
  { id: "maintenance",    label: "Maintenance"       },
  { id: "communications", label: "Communications"    },
];

export function AdminSidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const currentScreen = pathname.split("/").pop() ?? "overview";

  const initials = user?.name
    ? user.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()
    : "PK";
  const displayName  = user?.name  ?? "Property Kraft";
  const displayEmail = user?.email ?? "";

  return (
    <aside
      className="hidden lg:flex flex-col h-screen shrink-0"
      style={{ width: 248, backgroundColor: "#0E1330", fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      {/* Wordmark */}
      <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={() => router.push("/admin/overview")} className="text-left w-full">
          <div style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.3px", lineHeight: 1 }}>
            lizt
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", lineHeight: 1.2 }}>Property Kraft</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2, letterSpacing: "0.04em" }}>
              Analytics
            </div>
          </div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "12px" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = currentScreen === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => router.push(`/admin/${item.id}`)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    letterSpacing: "-0.1px",
                    color:           active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
                    backgroundColor: active ? "#EA5B25" : "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.07)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
                    }
                  }}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User block */}
      <div style={{ padding: "16px 16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            backgroundColor: "#EA5B25",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#FFFFFF",
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: "#FFFFFF",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {displayName}
            </div>
            {displayEmail && (
              <div style={{
                fontSize: 10, color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {displayEmail}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
