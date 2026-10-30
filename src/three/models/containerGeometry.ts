import { BoxGeometry, type BufferGeometry } from "three";

export type ContainerType = "20" | "40";

// ISO 668 outer dimensions, in meters (1 scene unit = 1 m).
export const CONTAINER: Record<ContainerType, { length: number; width: number; height: number }> = {
  "20": { length: 6.058, width: 2.438, height: 2.591 },
  "40": { length: 12.192, width: 2.438, height: 2.591 },
};

function memo(build: (type: ContainerType) => BufferGeometry) {
  const cache = new Map<ContainerType, BufferGeometry>();
  return (type: ContainerType) => {
    let g = cache.get(type);
    if (!g) cache.set(type, (g = build(type)));
    return g;
  };
}

// The container as the technical drawing shows it: a plain box, origin at the bottom center, length on Z. One
// geometry per type, shared by every instance. (Corrugation would only turn into line noise.)
export const getContainerBox = memo((type) => {
  const { length, width, height } = CONTAINER[type];
  return new BoxGeometry(width, height, length).translate(0, height / 2, 0);
});

// The APG red band: a thin sleeve just proud of the box, around all four sides at 58–70% of its height.
export const getStripeBand = memo((type) => {
  const { length, width, height } = CONTAINER[type];
  const [y0, y1] = [height * 0.58, height * 0.7];
  return new BoxGeometry(width + 0.02, y1 - y0, length + 0.02).translate(0, (y0 + y1) / 2, 0);
});
