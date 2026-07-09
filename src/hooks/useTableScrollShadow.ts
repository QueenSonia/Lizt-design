"use client";

import { useRef, useState } from "react";

/** Tracks whether a scrollable table container has scrolled past its top, for a sticky-header shadow. */
export function useTableScrollShadow<T extends HTMLElement = HTMLDivElement>() {
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<T>(null);
  const onScroll = () => setScrolled((ref.current?.scrollTop ?? 0) > 0);
  return { ref, scrolled, onScroll };
}
