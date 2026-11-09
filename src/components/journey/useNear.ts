"use client";

import { type RefObject, useEffect, useState } from "react";

// Whether an element's scene (its <section>; the element itself outside one) is near the viewport, with hysteresis:
// near from two screens away, far only past four. The journey's big images exist only while near: a phone's memory
// holds the scenes round the reader, not the page; and no source ever changes while a scene is pinned on screen.
// (The section, not the element: an element inside a stage with overflow hidden is clipped out of an observer's view
// whenever the camera takes it off the stage, and its image would be let go mid-scene.)
export function useNear(ref: RefObject<Element | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const target = ref.current!.closest("section") ?? ref.current!;
    const enter = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "200% 0px" });
    const leave = new IntersectionObserver(([e]) => !e.isIntersecting && setNear(false), { rootMargin: "400% 0px" });
    enter.observe(target);
    leave.observe(target);
    return () => {
      enter.disconnect();
      leave.disconnect();
    };
  }, [ref]);
  return near;
}
