"use client";

import { useEffect, useState } from "react";

/**
 * Persists per-table column visibility to localStorage, keyed by a caller-supplied storage key so
 * each table remembers its own preferences independently. `primaryColumns` are protected — the
 * last one still visible among them cannot be hidden, guaranteeing at least one identifying column
 * always remains on screen.
 */
export function useColumnVisibility<ColumnId extends string>(
  storageKey: string,
  allColumnIds: ColumnId[],
  primaryColumns: ColumnId[]
) {
  const allVisible = Object.fromEntries(allColumnIds.map((id) => [id, true])) as Record<
    ColumnId,
    boolean
  >;

  const [visibility, setVisibility] = useState<Record<ColumnId, boolean>>(allVisible);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoaded(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setVisibility({ ...allVisible, ...parsed });
      }
    } catch {
      // ignore malformed/unavailable storage — fall back to all-visible
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(visibility));
    } catch {
      // localStorage unavailable (private mode, quota, etc.) — visibility just won't persist
    }
  }, [visibility, loaded, storageKey]);

  const toggleColumn = (id: ColumnId) => {
    setVisibility((prev) => {
      const nextValue = !prev[id];
      if (!nextValue) {
        const stillVisiblePrimary = primaryColumns.some((p) => p !== id && prev[p]);
        if (primaryColumns.includes(id) && !stillVisiblePrimary) return prev;
      }
      return { ...prev, [id]: nextValue };
    });
  };

  const visibleCount = allColumnIds.filter((id) => visibility[id]).length;

  return { visibility, toggleColumn, visibleCount, totalCount: allColumnIds.length };
}
