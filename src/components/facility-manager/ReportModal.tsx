"use client";
import { useState, useRef, useEffect } from "react";
import { Ico } from "./Icon";
import { useIsMobile } from "./helpers";
import { COMMON_AREAS, PROPS_DATA, FmProperty } from "./mockData";

// ── Custom property dropdown ──────────────────────────────────────────────────

function PropertyDropdown({
  value,
  onChange,
  inputStyle,
}: {
  value: string;
  onChange: (id: string) => void;
  inputStyle: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = PROPS_DATA.find((p) => p.id === value) as FmProperty | undefined;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...inputStyle,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          textAlign: "left",
          paddingRight: 34,
          border: open ? "1px solid #B0ADA8" : (inputStyle.border as string),
        }}
      >
        {selected ? (
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ fontWeight: 500, color: "#1A1A1A" }}>{selected.name}</span>
            <span style={{ fontWeight: 400, color: "#1A1A1A" }}> · {selected.tenant || "Vacant"}</span>
          </span>
        ) : (
          <span style={{ flex: 1, color: "#B0ADA8" }}>Select a property…</span>
        )}
        <span
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? "180deg" : "0deg"})`,
            transition: "transform .15s",
            color: "#B0ADA8",
            pointerEvents: "none",
          }}
        >
          <Ico n="chev" s={14} />
        </span>
      </button>

      {/* Dropdown list */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#FFFFFF",
            border: "1px solid #E2E0DC",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,.10)",
            zIndex: 200,
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {PROPS_DATA.map((p, i) => {
            const isSelected = p.id === value;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange(p.id); setOpen(false); }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  padding: "10px 14px",
                  background: isSelected ? "#F5F4F1" : "transparent",
                  border: "none",
                  borderBottom: i < PROPS_DATA.length - 1 ? "1px solid #F0EEEA" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  gap: 1,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  transition: "background .1s",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#F8F7F4"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: "#1A1A1A", lineHeight: 1.4 }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 12, fontWeight: 400, color: "#1A1A1A", lineHeight: 1.4 }}>
                  {p.tenant || "Vacant"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface ReportSubmitPayload {
  desc: string;
  prop: string;
  commonArea: string;
}

interface ReportModalProps {
  onClose: () => void;
  onSubmit: (payload: ReportSubmitPayload) => void;
  initialProp?: string;
  initialArea?: string;
}

export function ReportModal({
  onClose,
  onSubmit,
  initialProp = "",
  initialArea = "",
}: ReportModalProps) {
  const isMobile = useIsMobile();
  const propLocked = !!initialProp;
  const areaLocked = !!initialArea;
  const [mode, setMode] = useState<"property" | "area" | null>(
    propLocked ? "property" : areaLocked ? "area" : null
  );
  const [desc, setDesc] = useState("");
  const [prop, setProp] = useState(initialProp);
  const [commonArea, setCommonArea] = useState(initialArea);
  const [busy, setBusy] = useState(false);

  const canGoBack = !propLocked && !areaLocked;
  const ok =
    desc.trim().length > 0 &&
    ((mode === "property" && prop) || (mode === "area" && commonArea));

  const submit = () => {
    if (!ok || busy) return;
    setBusy(true);
    setTimeout(() => {
      onSubmit({ desc, prop, commonArea });
      onClose();
    }, 750);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: "#6B7280",
    display: "block",
    marginBottom: 7,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "#F8F7F4",
    border: "1px solid #E2E0DC",
    borderRadius: 8,
    color: "#1A1A1A",
    fontSize: 14,
    transition: "all .15s",
  };

  const shell = (children: React.ReactNode) => (
    <div
      className="fm-fade-bg"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(20,18,15,.22)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 16,
      }}
    >
      <div
        className="fm-modal-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          border: isMobile ? "none" : "1px solid #E8E6E1",
          borderRadius: isMobile ? 0 : 14,
          width: "100%",
          maxWidth: isMobile ? "100%" : 420,
          height: isMobile ? "100%" : "auto",
          maxHeight: isMobile ? "100dvh" : "90vh",
          boxShadow: isMobile ? "none" : "0 16px 48px rgba(0,0,0,.09)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );

  if (mode === null) {
    const choiceCard = (
      id: "property" | "area",
      ico: "home" | "pin",
      title: string,
      description: string
    ) => (
      <button
        onClick={() => setMode(id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          width: "100%",
          padding: "14px 16px",
          background: "#F8F7F4",
          border: "1px solid #E2E0DC",
          borderRadius: 10,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "'Inter', system-ui, sans-serif",
          transition: "all .12s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#F0EEE9";
          e.currentTarget.style.borderColor = "#D5D2CD";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#F8F7F4";
          e.currentTarget.style.borderColor = "#E2E0DC";
        }}
      >
        <span style={{ display: "flex", color: "#6B7280", flexShrink: 0 }}>
          <Ico n={ico} s={18} c="currentColor" />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#1A1A1A",
              marginBottom: 2,
            }}
          >
            {title}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 12,
              color: "#9A9790",
              lineHeight: 1.45,
            }}
          >
            {description}
          </span>
        </span>
        <span
          style={{
            display: "flex",
            color: "#C0BDB8",
            transform: "rotate(-90deg)",
          }}
        >
          <Ico n="chev" s={14} c="currentColor" />
        </span>
      </button>
    );

    return shell(
      <div style={{ padding: isMobile ? 20 : 24, flex: 1, overflowY: "auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#1A1A1A",
                marginBottom: 4,
              }}
            >
              Report Issue
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "#6B7280",
                lineHeight: 1.5,
              }}
            >
              Do you want to report an issue for a property or a common area?
            </div>
          </div>
          <button
            className="fm-icon-btn"
            onClick={onClose}
            style={{
              background: "#F5F4F1",
              border: "1px solid #E8E6E1",
              borderRadius: 8,
              padding: 7,
              cursor: "pointer",
              color: "#9A9790",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <Ico n="x" s={14} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {choiceCard(
            "property",
            "home",
            "Property",
            "Report an issue at a specific property"
          )}
          {choiceCard(
            "area",
            "pin",
            "Common Area",
            "Report an issue in a shared common area"
          )}
        </div>
      </div>
    );
  }

  const isProperty = mode === "property";
  const px = isMobile ? 20 : 24;

  return shell(
    <>
      <div
        style={{
          padding: `${isMobile ? 18 : 22}px ${px}px ${isMobile ? 14 : 18}px`,
          borderBottom: isMobile ? "1px solid #EDECEA" : "none",
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {canGoBack && (
          <button
            onClick={() => setMode(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9A9790",
              display: "flex",
              padding: 4,
              marginLeft: -4,
              marginTop: -2,
            }}
          >
            <span style={{ display: "flex", transform: "rotate(90deg)" }}>
              <Ico n="chev" s={16} c="currentColor" />
            </span>
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#1A1A1A",
              marginBottom: 3,
            }}
          >
            Report Issue
          </div>
          <div style={{ fontSize: 13, fontWeight: 400, color: "#6B7280" }}>
            {isProperty ? "Reporting at a property" : "Reporting at a common area"}
          </div>
        </div>
        <button
          className="fm-icon-btn"
          onClick={onClose}
          style={{
            background: "#F5F4F1",
            border: "1px solid #E8E6E1",
            borderRadius: 8,
            padding: 7,
            cursor: "pointer",
            color: "#9A9790",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Ico n="x" s={14} />
        </button>
      </div>

      <div style={{ padding: `${isMobile ? 18 : 22}px ${px}px`, flex: 1, overflowY: "auto" }}>
        {isProperty && (
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              Please select the property this is for
            </label>
            <div style={{ position: "relative" }}>
              {propLocked ? (
                <div
                  style={{
                    ...inputStyle,
                    color: "#1A1A1A",
                    background: "#F5F4F1",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {(() => {
                    const p = PROPS_DATA.find((x) => x.id === initialProp);
                    return p ? `${p.name} · ${p.tenant || "Vacant"}` : "";
                  })()}
                </div>
              ) : (
                <PropertyDropdown value={prop} onChange={setProp} inputStyle={inputStyle} />
              )}
            </div>
          </div>
        )}

        {!isProperty && (
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Common Area</label>
            <div style={{ position: "relative" }}>
              {areaLocked ? (
                <div
                  style={{
                    ...inputStyle,
                    color: "#1A1A1A",
                    background: "#F5F4F1",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {initialArea}
                </div>
              ) : (
                <>
                  <select
                    value={commonArea}
                    onChange={(e) => setCommonArea(e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                      appearance: "none",
                      paddingRight: 34,
                      color: commonArea ? "#1A1A1A" : "#B0ADA8",
                    }}
                  >
                    <option value="" disabled>
                      Select a common area…
                    </option>
                    {COMMON_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <div
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "#B0ADA8",
                    }}
                  >
                    <Ico n="chev" s={14} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe what's wrong and where exactly…"
            rows={4}
            style={{ ...inputStyle, resize: "none", lineHeight: 1.65 }}
          />
        </div>
      </div>

      <div
        style={{
          padding: `12px ${px}px`,
          borderTop: "1px solid #EDECEA",
          flexShrink: 0,
          background: "#FFFFFF",
        }}
      >
        <button
          onClick={submit}
          disabled={!ok || busy}
          className="fm-btn-cta"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: ok && !busy ? "pointer" : "not-allowed",
            background: ok ? "#FF5000" : "#F0EEE9",
            color: ok ? "#FFFFFF" : "#C0BDB8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all .15s",
          }}
        >
          {busy ? (
            <>
              <div
                style={{
                  width: 13,
                  height: 13,
                  border: "2px solid rgba(255,255,255,.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "fm-spin .7s linear infinite",
                }}
              />
              Submitting…
            </>
          ) : (
            "Submit Issue"
          )}
        </button>
      </div>
    </>
  );
}
