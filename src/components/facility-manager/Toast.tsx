"use client";
import { useEffect, useState } from "react";

export function Toast({
  msg,
  onDone,
}: {
  msg: string;
  onDone: () => void;
}) {
  const [exit, setExit] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setExit(true);
      setTimeout(onDone, 250);
    }, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={exit ? "fm-toast-out" : "fm-toast-in"}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 500,
        background: "#FFFFFF",
        border: "1px solid #E2E0DC",
        borderRadius: 10,
        padding: "11px 16px",
        display: "flex",
        alignItems: "center",
        gap: 9,
        boxShadow: "0 6px 24px rgba(0,0,0,.08)",
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#4ADE80",
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 14, color: "#2A2A2A", fontWeight: 500 }}>
        {msg}
      </span>
    </div>
  );
}
