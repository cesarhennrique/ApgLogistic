// Screen-space marks over the journey's pictures (notes, leaders, outlines, dimension lines), drawn with 1 px boxes
// stretched by transform only: nothing is laid out again, and a stroke never thickens with a camera's zoom. 2D
// transforms: a mark is a few px, a layer of its own each (a hundred on a phone) cost more to hand to the compositor
// every frame than painting them all together.

export const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

// A 1 px box (origin top left) at x, y, stretched to w × h.
export const place = (el: HTMLElement, x: number, y: number, w = 1, h = 1) =>
  (el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${w.toFixed(2)}, ${h.toFixed(2)})`);

// A line t px thick from a to b, centred on it: a 1 px box rotated and stretched.
export const leader = (el: HTMLElement, ax: number, ay: number, bx: number, by: number, t = 1) =>
  (el.style.transform = `translate(${ax.toFixed(1)}px, ${ay.toFixed(1)}px) rotate(${Math.atan2(by - ay, bx - ax).toFixed(4)}rad) translate(0, ${(-t / 2).toFixed(1)}px) scale(${Math.hypot(bx - ax, by - ay).toFixed(1)}, ${t})`);

// A leader over its dark halo (halo px each side).
export const guide = (n: { leader: HTMLElement | null; leaderHalo: HTMLElement | null }, ax: number, ay: number, bx: number, by: number, halo = 2) => {
  leader(n.leaderHalo!, ax, ay, bx, by, 1 + 2 * halo);
  leader(n.leader!, ax, ay, bx, by);
};

// A rectangle's four edges ([top, bottom, left, right]), t px thick, inside it, drawn round from its top left,
// clockwise, as far as f (0–1).
export const edges = (bars: HTMLElement[], r: { x: number; y: number; w: number; h: number }, t: number, f = 1) => {
  const [top, bottom, left, right] = bars;
  const s = (k: number) => clamp01(f * 4 - k);
  place(top, r.x, r.y, r.w * s(0), t);
  place(right, r.x + r.w - t, r.y, t, r.h * s(1));
  place(bottom, r.x + r.w * (1 - s(2)), r.y + r.h - t, r.w * s(2), t);
  place(left, r.x, r.y + r.h * (1 - s(3)), t, r.h * s(3));
};
