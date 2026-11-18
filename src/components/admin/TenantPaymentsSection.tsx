"use client";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import {
  getPeriod, getAccountType,
} from "@/lib/analyticsDateStore";
import {
  getTenantPaymentStats, getPaymentReliabilityData, getTenantPeriodLabel,
  type TenantPaymentStats,
} from "@/lib/analytics-mock";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtRate(r: number) {
  return `${r.toFixed(1)}%`;
}

function fmtBalance(n: number): string {
  if (n === 0) return "None";
  if (n >= 1_000_000) return `N${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `N${(n / 1_000).toFixed(0)}K`;
  return `N${n.toLocaleString()}`;
}

// ── Payment reliability card ──────────────────────────────────────────────────

interface PaymentReliabilityCardProps {
  period: ReturnType<typeof getPeriod>;
  filter: ReturnType<typeof getAccountType>;
}

function PaymentReliabilityCard({ period, filter }: PaymentReliabilityCardProps) {
  const data = getPaymentReliabilityData(period, filter);

  const segments = [
    { key: "always",  label: "Always on time",  color: "#3D8A5E", ...data.always  },
    { key: "mostly",  label: "Mostly on time",  color: "#86B99A", ...data.mostly  },
    { key: "often",   label: "Often late",       color: "#C9856A", ...data.often   },
    { key: "chronic", label: "Chronically late", color: "#8B3A3A", ...data.chronic },
  ];

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #E6E8EE",
        borderRadius: 16,
        padding: 28,
        marginBottom: 20,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330", marginBottom: 4 }}>
          Payment reliability
        </div>
        <div style={{ fontSize: 12, color: "#5B6475" }}>
          How consistently tenants pay on or before their due date
        </div>
      </div>

      {/* Large figure */}
      <div style={{ fontSize: 48, fontWeight: 700, color: "#0E1330", lineHeight: 1, marginBottom: 4 }}>
        {fmtRate(data.overallOnTimeRate)}
      </div>
      <div style={{ fontSize: 13, color: "#5B6475", marginBottom: 24 }}>
        overall on-time rate across all tenants
      </div>

      {/* Split bar */}
      <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
        {segments.map((seg, i) => (
          <div
            key={seg.key}
            style={{
              width: `${seg.pct}%`,
              backgroundColor: seg.color,
              borderRadius:
                i === 0 ? "6px 0 0 6px" :
                i === segments.length - 1 ? "0 6px 6px 0" : 0,
            }}
          />
        ))}
      </div>

      {/* Segment labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px 16px" }}>
        {segments.map((seg) => (
          <div key={seg.key}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <div
                style={{
                  width: 10, height: 10, borderRadius: 2,
                  backgroundColor: seg.color, flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: "#5B6475" }}>{seg.label}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1330", paddingLeft: 16 }}>
              {seg.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tenant drawer ─────────────────────────────────────────────────────────────

type DrawerMode = { type: "list"; groupLabel: string; tenants: TenantPaymentStats[] }
               | { type: "detail"; tenant: TenantPaymentStats; fromList: boolean };

interface TenantDrawerProps {
  mode: DrawerMode;
  period: ReturnType<typeof getPeriod>;
  onClose: () => void;
  onOpenDetail: (t: TenantPaymentStats, fromList: boolean) => void;
  onBackToList: () => void;
}

function TenantDrawer({ mode, period, onClose, onOpenDetail, onBackToList }: TenantDrawerProps) {
  const drawerRef  = useRef<HTMLDivElement>(null);
  const closeRef   = useRef<HTMLButtonElement>(null);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(0);
  const PAGE_SIZE = 10;

  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // focus close button on mount
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // focus trap
  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = el.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, []);

  // reset search/page when switching to list mode
  useEffect(() => {
    if (mode.type === "list") {
      setSearch("");
      setPage(0);
    }
  }, [mode.type]);

  const periodLabel = getTenantPeriodLabel(period);

  // ── List mode ──────────────────────────────────────────────────────────────
  function ListContent() {
    if (mode.type !== "list") return null;
    const { groupLabel, tenants } = mode;

    const filtered = tenants.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.property.toLowerCase().includes(search.toLowerCase())
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage   = Math.min(page, totalPages - 1);
    const pageSlice  = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

    const isLate = groupLabel.toLowerCase().includes("late");

    return (
      <>
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", padding: "24px 24px 0",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#0E1330" }}>{groupLabel}</div>
            <div style={{ fontSize: 12, color: "#5B6475", marginTop: 4 }}>
              {tenants.length} tenant{tenants.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 20, color: "#5B6475", lineHeight: 1, padding: 4,
            }}
          >
            x
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "16px 24px 0" }}>
          <input
            type="search"
            placeholder="Search by name or property..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 12px", fontSize: 13,
              border: "1px solid #E6E8EE", borderRadius: 8,
              outline: "none", color: "#0E1330",
              fontFamily: "var(--font-inter), Inter, sans-serif",
            }}
          />
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
          {pageSlice.length === 0 ? (
            <div style={{ padding: "24px", fontSize: 13, color: "#5B6475", textAlign: "center" }}>
              No tenants match your search
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E6E8EE", backgroundColor: "#F6F7F9" }}>
                  <th style={{ padding: "8px 24px", fontSize: 11, fontWeight: 600, color: "#5B6475", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left" }}>
                    Tenant
                  </th>
                  <th style={{ padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#5B6475", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right", whiteSpace: "nowrap" }}>
                    On-time rate
                  </th>
                  {isLate && (
                    <th style={{ padding: "8px 24px 8px 12px", fontSize: 11, fontWeight: 600, color: "#5B6475", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right", whiteSpace: "nowrap" }}>
                      Balance
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((t, idx) => (
                  <tr
                    key={t.id}
                    onClick={() => onOpenDetail(t, true)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenDetail(t, true); } }}
                    tabIndex={0}
                    style={{
                      borderBottom: idx < pageSlice.length - 1 ? "1px solid #F0F1F3" : "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.015)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "11px 24px" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#0E1330" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "#5B6475" }}>{t.property}</div>
                    </td>
                    <td style={{ padding: "11px 12px", fontSize: 12, textAlign: "right", color: isLate ? "#C0392B" : "#1F7A4D", fontWeight: 500 }}>
                      {fmtRate(t.onTimeRate)}
                    </td>
                    {isLate && (
                      <td style={{ padding: "11px 24px 11px 12px", fontSize: 12, textAlign: "right", color: t.balanceOwed > 0 ? "#C0392B" : "#5B6475" }}>
                        {fmtBalance(t.balanceOwed)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 24px", borderTop: "1px solid #E6E8EE",
              fontSize: 12, color: "#5B6475",
            }}
          >
            <span>Page {safePage + 1} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                style={{
                  padding: "5px 12px", fontSize: 12, borderRadius: 6,
                  border: "1px solid #E6E8EE", cursor: safePage === 0 ? "not-allowed" : "pointer",
                  backgroundColor: "transparent", color: safePage === 0 ? "#C9CED8" : "#0E1330",
                }}
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                style={{
                  padding: "5px 12px", fontSize: 12, borderRadius: 6,
                  border: "1px solid #E6E8EE", cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer",
                  backgroundColor: "transparent", color: safePage >= totalPages - 1 ? "#C9CED8" : "#0E1330",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footnote */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid #E6E8EE", fontSize: 11, color: "#5B6475", lineHeight: 1.5 }}>
          On time means paid on or before the due date. On-time rate is the share of a tenant&apos;s payments {periodLabel} that were on time. Balance owed is rent currently unpaid.
        </div>
      </>
    );
  }

  // ── Detail mode ────────────────────────────────────────────────────────────
  function DetailContent() {
    if (mode.type !== "detail") return null;
    const { tenant: t, fromList } = mode;

    return (
      <>
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", padding: "24px 24px 0",
          }}
        >
          <div>
            {fromList && (
              <button
                onClick={onBackToList}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: "#EA5B25", padding: 0, marginBottom: 8,
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  display: "block",
                }}
              >
                Back to list
              </button>
            )}
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0E1330" }}>{t.name}</div>
            <div style={{ fontSize: 13, color: "#5B6475", marginTop: 2 }}>{t.property}</div>
            <div style={{ fontSize: 12, color: "#5B6475", marginTop: 2 }}>Landlord: {t.landlord}</div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 20, color: "#5B6475", lineHeight: 1, padding: 4,
              flexShrink: 0,
            }}
          >
            x
          </button>
        </div>

        {/* 4 stat figures */}
        <div
          style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 12, padding: "20px 24px 0",
          }}
        >
          <div style={{ backgroundColor: "#F6F7F9", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#5B6475", marginBottom: 4 }}>On-time rate</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.onTimeRate >= 70 ? "#1F7A4D" : "#C0392B", lineHeight: 1 }}>
              {fmtRate(t.onTimeRate)}
            </div>
          </div>
          <div style={{ backgroundColor: "#F6F7F9", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#5B6475", marginBottom: 4 }}>Avg days late</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.avgDaysLate === 0 ? "#1F7A4D" : "#C0392B", lineHeight: 1 }}>
              {t.avgDaysLate === 0 ? "0" : `${t.avgDaysLate}`}
            </div>
          </div>
          <div style={{ backgroundColor: "#F6F7F9", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#5B6475", marginBottom: 4 }}>Balance owed</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.balanceOwed > 0 ? "#C0392B" : "#1F7A4D", lineHeight: 1 }}>
              {fmtBalance(t.balanceOwed)}
            </div>
          </div>
          <div style={{ backgroundColor: "#F6F7F9", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#5B6475", marginBottom: 4 }}>Payments tracked</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0E1330", lineHeight: 1 }}>
              {t.paymentsCount}
            </div>
          </div>
        </div>

        {/* Payment history table */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 0 0" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0E1330", padding: "0 24px 10px" }}>
            Payment history
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E6E8EE", backgroundColor: "#F6F7F9" }}>
                <th style={{ padding: "8px 24px", fontSize: 11, fontWeight: 600, color: "#5B6475", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left" }}>
                  Month
                </th>
                <th style={{ padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#5B6475", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left", whiteSpace: "nowrap" }}>
                  Due date
                </th>
                <th style={{ padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#5B6475", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left", whiteSpace: "nowrap" }}>
                  Paid date
                </th>
                <th style={{ padding: "8px 24px 8px 12px", fontSize: 11, fontWeight: 600, color: "#5B6475", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right", whiteSpace: "nowrap" }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {t.payments.map((r, idx) => {
                const dl = r.paidDate
                  ? Math.max(0, Math.round(
                      (new Date(r.paidDate + "T12:00:00Z").getTime() -
                       new Date(r.dueDate  + "T12:00:00Z").getTime()) / 86_400_000
                    ))
                  : null;
                const statusText = r.paidDate === null ? "Unpaid" : dl === 0 ? "On time" : `${dl}d late`;
                const statusColor = r.paidDate === null ? "#C0392B" : dl === 0 ? "#1F7A4D" : "#C0392B";
                return (
                  <tr
                    key={r.month}
                    style={{ borderBottom: idx < t.payments.length - 1 ? "1px solid #F0F1F3" : "none" }}
                  >
                    <td style={{ padding: "10px 24px", fontSize: 12, color: "#0E1330" }}>{r.month}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#5B6475" }}>{r.dueDate}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#5B6475" }}>
                      {r.paidDate ?? "Not paid"}
                    </td>
                    <td style={{ padding: "10px 24px 10px 12px", fontSize: 12, textAlign: "right", color: statusColor, fontWeight: dl === 0 ? 500 : 400 }}>
                      {statusText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footnote */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid #E6E8EE", fontSize: 11, color: "#5B6475", lineHeight: 1.5 }}>
          On time means paid on or before the due date. Balance owed is rent currently unpaid.
        </div>
      </>
    );
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={drawerRef}
        style={{
          position: "relative", zIndex: 10,
          backgroundColor: "#fff",
          width: "min(480px, 100vw)",
          height: "100%",
          display: "flex", flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
          fontFamily: "var(--font-inter), Inter, sans-serif",
          overflowY: "hidden",
        }}
      >
        {mode.type === "list"   ? <ListContent   /> : null}
        {mode.type === "detail" ? <DetailContent /> : null}
      </div>
    </div>
  );
}

// ── Ranked card ────────────────────────────────────────────────────────────────

interface TenantRankedCardProps {
  title: string;
  subtitle: string;
  tenants: TenantPaymentStats[];
  rateColor: string;
  showBalance: boolean;
  onViewAll: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onSelect: (t: TenantPaymentStats) => void;
}

function TenantRankedCard({ title, subtitle, tenants, rateColor, showBalance, onViewAll, onSelect }: TenantRankedCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #E6E8EE",
        borderRadius: 16,
        padding: 28,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1330", marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 12, color: "#5B6475" }}>{subtitle}</div>
        </div>
        <button
          onClick={onViewAll}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12, color: "#EA5B25", padding: 0, flexShrink: 0, marginLeft: 12,
            fontFamily: "var(--font-inter), Inter, sans-serif",
          }}
        >
          View all
        </button>
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {tenants.map((t, idx) => (
          <div
            key={t.id}
            onClick={() => onSelect(t)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(t); } }}
            tabIndex={0}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: idx < tenants.length - 1 ? "1px solid #F0F1F3" : "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.015)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "#C9CED8", fontWeight: 600, minWidth: 16 }}>
                {idx + 1}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#0E1330" }}>{t.name}</div>
                <div style={{ fontSize: 11, color: "#5B6475" }}>{t.property}</div>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: rateColor }}>{fmtRate(t.onTimeRate)}</div>
              {showBalance && t.balanceOwed > 0 && (
                <div style={{ fontSize: 11, color: "#C0392B" }}>{fmtBalance(t.balanceOwed)} owed</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main exported section ─────────────────────────────────────────────────────

export default function TenantPaymentsSection() {
  const period = getPeriod();
  const filter = getAccountType();
  const [mounted, setMounted]     = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const allStats = getTenantPaymentStats(period, filter);

  const mostReliable = [...allStats]
    .sort((a, b) => b.onTimeRate - a.onTimeRate)
    .slice(0, 5);

  const mostLate = [...allStats]
    .sort((a, b) => {
      if (a.onTimeRate !== b.onTimeRate) return a.onTimeRate - b.onTimeRate;
      return b.balanceOwed - a.balanceOwed;
    })
    .slice(0, 5);

  function openListDrawer(group: "reliable" | "late", fromEl?: HTMLButtonElement | null) {
    if (fromEl) triggerRef.current = fromEl;
    if (group === "reliable") {
      const sorted = [...allStats].sort((a, b) => b.onTimeRate - a.onTimeRate);
      setDrawerMode({ type: "list", groupLabel: "Most reliable tenants", tenants: sorted });
    } else {
      const sorted = [...allStats].sort((a, b) => {
        if (a.onTimeRate !== b.onTimeRate) return a.onTimeRate - b.onTimeRate;
        return b.balanceOwed - a.balanceOwed;
      });
      setDrawerMode({ type: "list", groupLabel: "Most frequently late tenants", tenants: sorted });
    }
  }

  function openDetailDrawer(t: TenantPaymentStats, fromList: boolean) {
    setDrawerMode({ type: "detail", tenant: t, fromList });
  }

  function closeDrawer() {
    setDrawerMode(null);
    if (triggerRef.current && "focus" in triggerRef.current) {
      (triggerRef.current as HTMLElement).focus();
    }
  }

  function backToList() {
    if (drawerMode?.type === "detail" && drawerMode.fromList) {
      const isLate = drawerMode.tenant.onTimeRate < 70;
      openListDrawer(isLate ? "late" : "reliable");
    }
  }

  return (
    <div style={{ marginTop: 48 }}>
      {/* Section heading */}
      <div style={{ fontSize: 18, fontWeight: 600, color: "#0E1330", marginBottom: 4 }}>
        Tenant payments
      </div>
      <div style={{ fontSize: 13, color: "#5B6475", marginBottom: 20 }}>
        On-time rates and outstanding balances across your tenancies
      </div>

      {/* Full-width reliability card */}
      <PaymentReliabilityCard period={period} filter={filter} />

      {/* Two ranked cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 20,
        }}
        className="grid-cols-1 md:grid-cols-2"
      >
        <TenantRankedCard
          title="Most reliable"
          subtitle="Highest on-time payment rates"
          tenants={mostReliable}
          rateColor="#1F7A4D"
          showBalance={false}
          onViewAll={(e) => openListDrawer("reliable", e.currentTarget)}
          onSelect={(t) => openDetailDrawer(t, false)}
        />
        <TenantRankedCard
          title="Most frequently late"
          subtitle="Lowest on-time rates with outstanding balances"
          tenants={mostLate}
          rateColor="#C0392B"
          showBalance={true}
          onViewAll={(e) => openListDrawer("late", e.currentTarget)}
          onSelect={(t) => openDetailDrawer(t, false)}
        />
      </div>

      {/* Footnote */}
      <div style={{ marginTop: 12, fontSize: 11, color: "#5B6475", lineHeight: 1.5 }}>
        On time means paid on or before the due date. On-time rate is the share of a tenant&apos;s payments {getTenantPeriodLabel(period)} that were on time. Balance owed is rent currently unpaid.
      </div>

      {/* Drawer portal */}
      {mounted && drawerMode && createPortal(
        <TenantDrawer
          mode={drawerMode}
          period={period}
          onClose={closeDrawer}
          onOpenDetail={openDetailDrawer}
          onBackToList={backToList}
        />,
        document.body
      )}
    </div>
  );
}
