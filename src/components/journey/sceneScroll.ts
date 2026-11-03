// A scene's scroll on phones (spec: heights ×0.75): its progress range (vh) scaled, but for a head and a tail that
// stay as they are (a slide in over the scene before, a hold under the next one's slide: a screen each).
export type PhoneScroll = { head?: number; tail?: number; scale: number };

export const phoneLength = (range: number, { head = 0, tail = 0, scale }: PhoneScroll) => head + tail + scale * (range - head - tail);

// The desktop progress (0–1) at a phone's progress p, for a range of `range` vh on desktop.
export function toDesktop(p: number, range: number, phone: PhoneScroll) {
  const { head = 0, tail = 0, scale } = phone;
  const mid = range - head - tail;
  const at = p * phoneLength(range, phone);
  const vh = at < head ? at : at < head + scale * mid ? head + (at - head) / scale : at + (1 - scale) * mid;
  return vh / range;
}

// The phone's progress at a desktop one (toDesktop's inverse).
export function toPhone(p: number, range: number, phone: PhoneScroll) {
  const { head = 0, tail = 0, scale } = phone;
  const mid = range - head - tail;
  const vh = p * range;
  const at = vh < head ? vh : vh < head + mid ? head + (vh - head) * scale : vh - (1 - scale) * mid;
  return at / phoneLength(range, phone);
}
