"use client";

import { type RefObject, useEffect, useState } from "react";

// Whether an element is within `margin` (a screen's share, above and below) of the viewport, kept up to date. The
// journey's big images exist only while near: a phone's memory holds the scenes around the reader, not the page.
export function useNear(ref: RefObject<Element | null>, margin = "200%") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: `${margin} 0px` });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, [ref, margin]);
  return near;
}
