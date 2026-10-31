// The hero's photo (assets-src/ai/hero-porto.webp) and how it covers the screen: the full frame (3840×1645,
// object-position 68% 55%) on wide screens, a portrait crop (760×1645, centred) on phones.
export const HERO_PHOTO = {
  wide: { w: 3840, h: 1645, px: 0.68, py: 0.55 },
  phone: { w: 760, h: 1645, px: 0.5, py: 0.5 },
};
// In the full frame's fractions: the deck (the scroll pushes in on it), and the sky's edges (the map stays above
// the ship's bridge and left of the cranes).
export const PHOTO_MARKS = { deck: { x: 0.7, y: 0.5 }, bridgeTop: 0.26, cranesLeft: 0.64 };
// The deck in the phone crop's own fractions.
export const PHONE_DECK = { x: 0.35, y: 0.55 };

// A point of the photo (fractions of the variant shown) on a W×H screen.
export function photoToScreen(W: number, H: number, x: number, y: number) {
  const v = W < 768 ? HERO_PHOTO.phone : HERO_PHOTO.wide;
  const c = Math.max(W / v.w, H / v.h);
  return { x: (W - v.w * c) * v.px + x * v.w * c, y: (H - v.h * c) * v.py + y * v.h * c };
}
