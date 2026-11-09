import { ScrollTrigger } from "@/components/motion/gsap";

// An element's size and offset, measured once and kept until something can change it (a resize, the fonts in, a
// ScrollTrigger refresh). The scroll's per-frame drawing reads these instead of the layout: a layout read after the
// frame's style writes forces a whole layout, every frame.
type Box = { width: number; height: number; top: number; at: number };
const cache = new WeakMap<HTMLElement, Box>();
let epoch = 0;
const stale = () => void epoch++;
if (typeof window !== "undefined") {
  window.addEventListener("resize", stale);
  void document.fonts?.ready.then(stale);
  ScrollTrigger.addEventListener("refresh", stale);
}

export function measure(el: HTMLElement): Box {
  let box = cache.get(el);
  if (!box || box.at !== epoch) {
    box = { width: el.offsetWidth, height: el.offsetHeight, top: el.offsetTop, at: epoch };
    cache.set(el, box);
  }
  return box;
}

// A text set in place: its text node's value changed (only if it differs), never the node replaced, as textContent
// does: a new node every frame is a layout of its own, and with a :has() in the page (globals.css, the intro) a
// style invalidation of the whole document.
export function setText(el: HTMLElement, text: string) {
  const node = el.firstChild;
  if (node && node.nodeType === Node.TEXT_NODE && !node.nextSibling) {
    if (node.nodeValue !== text) node.nodeValue = text;
  } else el.textContent = text;
}

// The viewport's size, kept like a box's (window.innerWidth / innerHeight can lay the page out when read after a
// frame's style writes).
let view: { width: number; height: number; at: number } | null = null;
export function viewport() {
  if (!view || view.at !== epoch) view = { width: window.innerWidth, height: window.innerHeight, at: epoch };
  return view;
}
