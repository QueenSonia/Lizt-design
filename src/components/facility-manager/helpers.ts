"use client";

import { useEffect, useState } from "react";

export function useIsMobile(): boolean {
  const [mob, setMob] = useState(false);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 640);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
}

export const startOfDay = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const formatGroupLabel = (ts: number): string => {
  const today = startOfDay(Date.now());
  const yesterday = today - 86400000;
  const day = startOfDay(ts);
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatTime = (ts: number): string =>
  new Date(ts).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

export interface DateGrouped<T extends { time: number }> {
  label: string;
  items: T[];
}

export function groupByDate<T extends { time: number }>(
  items: T[]
): DateGrouped<T>[] {
  const sorted = [...items].sort((a, b) => b.time - a.time);
  const groups: DateGrouped<T>[] = [];
  let currentLabel: string | null = null;
  for (const item of sorted) {
    const label = formatGroupLabel(item.time);
    if (label !== currentLabel) {
      groups.push({ label, items: [item] });
      currentLabel = label;
    } else {
      groups[groups.length - 1].items.push(item);
    }
  }
  return groups;
}

export const agoShort = (ts: number): string => {
  const d = Date.now() - ts;
  if (d < 60000) return `${Math.floor(d / 1000)}s ago`;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
};

export const fmtDate = (ts: number): string =>
  new Date(ts).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
