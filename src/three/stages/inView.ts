import type { Object3D } from "three";

// Whether an object would be drawn: it and every ancestor visible. Lets per-frame work skip hidden stages.
export function inView(object: Object3D): boolean {
  for (let o: Object3D | null = object; o; o = o.parent) if (!o.visible) return false;
  return true;
}
