"use client";
import { useState } from "react";
import { Ico } from "./Icon";
import { useIsMobile } from "./helpers";
import { JOB_CATEGORIES, FmIssue, FmResolution } from "./mockData";

interface ResolutionModalProps {
  issue: { title?: string; resolution?: FmResolution } | FmIssue | null | undefined;
  onClose: () => void;
  onConfirm: (resolution: FmResolution) => void;
}

export function ResolutionModal({
  issue,
  onClose,
  onConfirm,
}: ResolutionModalProps) {
  const isMobile = useIsMobile();
  const prev = issue?.resolution;
  const [hadCost, setHadCost] = useState<boolean | null>(
    prev ? prev.hadCost : null
  );
  const [costAmount, setCostAmount] = useState(prev?.costAmount || "");
  const [artisanName, setArtisanName] = useState(prev?.artisanName || "");
  const [artisanPhone, setArtisanPhone] = useState(prev?.artisanPhone || "");
  const [summary, setSummary] = useState(prev?.summary || "");
  const [category, setCategory] = useState(prev?.category || "");
  const [busy, setBusy] = useState(false);
  const [showSummaryError, setShowSummaryError] = useState(false);

  const costValid =
    hadCost === false ||
    (hadCost === true && costAmount.trim() && artisanName.trim() && artisanPhone.trim());
  const summaryValid = !!summary.trim();
  const canSubmit =
    summaryValid && category && hadCost !== null && costValid;

  const submit = () => {
    if (!summaryValid) {
      setShowSummaryError(true);
      return;
    }
    if (!canSubmit || busy) return;
    setBusy(true);
    setTimeout(() => {
      onConfirm({
        hadCost, costAmount, artisanName, artisanPhone, summary, category,
        resolvedAt: new Date().toISOString(),
        resolvedBy: "Jide Akinola",
      });
      onClose();
    }, 600);
  };

  const px = isMobile ? 20 : 24;
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
    boxSizing: "border-box",
  };

  const pillBtn = (label: string, selected: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 12px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "'Inter', system-ui, sans-serif",
        background: selected ? "#1A1A1A" : "#F8F7F4",
        color: selected ? "#FFFFFF" : "#6B7280",
        border: `1px solid ${selected ? "#1A1A1A" : "#E2E0DC"}`,
        transition: "all .15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fm-fade-bg"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        background: "rgba(20,18,15,.32)",
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
          maxWidth: isMobile ? "100%" : 460,
          height: isMobile ? "100%" : "auto",
          maxHeight: isMobile ? "100dvh" : "90vh",
          boxShadow: isMobile ? "none" : "0 16px 48px rgba(0,0,0,.12)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: `${isMobile ? 16 : 20}px ${px}px ${isMobile ? 14 : 16}px`,
            borderBottom: "1px solid #EDECEA",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#1A1A1A",
                marginBottom: 3,
              }}
            >
              Resolve issue
            </div>
            {issue?.title && (
              <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.45 }}>
                {issue.title}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9A9790",
              display: "flex",
              padding: 4,
              marginTop: -2,
            }}
          >
            <Ico n="x" s={16} />
          </button>
        </div>

        <div
          style={{
            padding: `${isMobile ? 16 : 20}px ${px}px`,
            flex: 1,
            overflowY: "auto",
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Was there a cost?</label>
            <div style={{ display: "flex", gap: 8 }}>
              {pillBtn("Yes", hadCost === true, () => setHadCost(true))}
              {pillBtn("No", hadCost === false, () => {
                setHadCost(false);
                setCostAmount("");
                setArtisanName("");
                setArtisanPhone("");
              })}
            </div>
          </div>

          {hadCost === true && (
            <>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Cost amount</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={costAmount}
                  onChange={(e) => setCostAmount(e.target.value)}
                  placeholder="e.g. ₦45,000"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Artisan name</label>
                <input
                  type="text"
                  value={artisanName}
                  onChange={(e) => setArtisanName(e.target.value)}
                  placeholder="e.g. Emeka Plumbing Services"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Artisan phone number</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={artisanPhone}
                  onChange={(e) => setArtisanPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <div style={{ height: 1, background: "#F0EEE9", marginBottom: 18 }} />

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Job category</label>
            <div style={{ position: "relative" }}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                  appearance: "none",
                  paddingRight: 34,
                  color: category ? "#1A1A1A" : "#B0ADA8",
                }}
              >
                <option value="" disabled>
                  Select a category…
                </option>
                {JOB_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
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
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              How was this request resolved? <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                if (e.target.value.trim()) setShowSummaryError(false);
              }}
              placeholder="Describe how the issue was diagnosed, what work was carried out, and how the issue was resolved…"
              rows={6}
              style={{
                ...inputStyle,
                resize: "vertical",
                lineHeight: 1.6,
                ...(showSummaryError && !summaryValid ? { borderColor: "#DC2626" } : {}),
              }}
            />
            {showSummaryError && !summaryValid && (
              <p style={{ fontSize: 12, color: "#DC2626", marginTop: 6 }}>
                A resolution summary is required before closing this request.
              </p>
            )}
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
            disabled={!canSubmit || busy}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: canSubmit && !busy ? "pointer" : "not-allowed",
              background: canSubmit ? "#176B3A" : "#F0EEE9",
              color: canSubmit ? "#FFFFFF" : "#C0BDB8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "'Inter', system-ui, sans-serif",
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
                Saving…
              </>
            ) : (
              "Confirm resolution"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
