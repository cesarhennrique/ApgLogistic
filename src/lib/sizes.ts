// An <img sizes> list as if the screen were at most 2× (the 'low' tier, lib/quality: past 2× a phone's eye gains
// little and its memory pays for every pixel): each size scaled by 2/dpr.
export function capSizes(sizes: string, dpr: number): string {
  if (dpr <= 2) return sizes;
  const f = Number((2 / dpr).toFixed(4));
  return sizes
    .split(",")
    .map((part) => {
      const s = part.trim();
      const at = s.lastIndexOf(" ");
      const [media, size] = at < 0 || !s.startsWith("(") ? ["", s] : [s.slice(0, at), s.slice(at + 1)];
      return `${media ? media + " " : ""}calc(${size} * ${f})`;
    })
    .join(", ");
}
