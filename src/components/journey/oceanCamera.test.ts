import { describe, expect, it } from "vitest";
import {
  APG_CONTAINERS,
  BOW,
  FOCUS,
  HULL_WIDTH,
  MAX_PIXEL_SCALE,
  SHIP,
  TARGET,
  ZOOM,
  cameraTransform,
  maxZoom,
  sampleOceanCamera,
  toScreen,
} from "./oceanCamera";

const desktop = { width: 1920, height: 1080, dpr: 1 };
const retina = { width: 1440, height: 900, dpr: 2 };
const phone = { width: 390, height: 844, dpr: 3 };

describe("oceanCamera", () => {
  it("starts on the wide framing: the whole photo, the ship at the centre", () => {
    const cam = sampleOceanCamera(0, desktop);
    expect(cam.scale).toBeCloseTo(Math.max(1920 / 6688, 1080 / 3764), 6);
    // 16:9, like the photo: it shows whole, edge to edge, so the ship sits as near the centre as that allows.
    expect(cam.x).toBeLessThanOrEqual(0);
    expect(cam.x + cam.scale * 6688).toBeGreaterThanOrEqual(1920);
    const ship = toScreen(cam, SHIP);
    expect(Math.abs(ship.x - 960)).toBeLessThan(6);
    expect(Math.abs(ship.y - 540)).toBeLessThan(0.05 * 1080);
    // A phone crops the photo's sides: the ship exactly at the centre across (its height fills the screen, as above).
    expect(toScreen(sampleOceanCamera(0, phone), SHIP).x).toBeCloseTo(195, 3);
  });

  it("zooms from the very start: no held stretch before it", () => {
    expect(ZOOM[0]).toBe(0);
    expect(sampleOceanCamera(0.02, desktop).scale).toBeGreaterThan(sampleOceanCamera(0, desktop).scale);
  });

  it("closes on the target container: its centre is the focus, at the centre of the screen, and holds", () => {
    expect(FOCUS.x).toBeCloseTo(TARGET.x + TARGET.w / 2, 6);
    expect(FOCUS.y).toBeCloseTo(TARGET.y + TARGET.h / 2, 6);
    for (const view of [desktop, retina, phone]) {
      for (const p of [ZOOM[1], 1]) {
        const focus = toScreen(sampleOceanCamera(p, view), FOCUS);
        expect(focus.x).toBeCloseTo(view.width / 2, 3);
        expect(focus.y).toBeCloseTo(view.height / 2, 3);
      }
    }
  });

  it("zooms exponentially: equal steps of progress multiply the scale by the same ratio", () => {
    const steps = [0.1, 0.25, 0.4, 0.55, 0.7].map((p) => sampleOceanCamera(p, desktop).scale);
    const ratios = steps.slice(1).map((s, i) => s / steps[i]);
    for (const r of ratios) expect(r).toBeCloseTo(ratios[0], 9);
    expect(ratios[0]).toBeGreaterThan(1);
  });

  it("never magnifies a pixel of the original photo past 1.5 device pixels", () => {
    for (const view of [desktop, retina, phone]) {
      expect(sampleOceanCamera(1, view).scale * view.dpr).toBeLessThanOrEqual(MAX_PIXEL_SCALE + 1e-9);
    }
  });

  it("fills a 1080p desktop with the deck: the hull 90% of the screen's height", () => {
    const cam = sampleOceanCamera(1, desktop);
    expect(HULL_WIDTH * cam.scale).toBeCloseTo(0.9 * 1080, 3);
    expect(maxZoom(desktop)).toBeGreaterThan(4);
  });

  it("maps a photo point to the screen as the photo's transform does, at three scales", () => {
    // The CSS transform (origin top left): translate, then scale.
    const viaTransform = (t: string, p: { x: number; y: number }) => {
      const [, tx, ty, s] = t.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px, 0\) scale\(([-\d.]+)\)/)!.map(Number);
      return { x: tx + s * p.x, y: ty + s * p.y };
    };
    const corner = { x: TARGET.x, y: TARGET.y };
    for (const p of [0, 0.4, 1]) {
      const cam = sampleOceanCamera(p, desktop);
      for (const point of [BOW, corner]) {
        const a = toScreen(cam, point);
        const b = viaTransform(cameraTransform(cam), point);
        // the transform string rounds to 0.01 px and 1e-5 in scale
        expect(Math.abs(a.x - b.x)).toBeLessThan(0.1);
        expect(Math.abs(a.y - b.y)).toBeLessThan(0.1);
      }
      // the bow above the target by the photo distance times the scale
      expect(toScreen(cam, corner).y - toScreen(cam, BOW).y).toBeCloseTo(cam.scale * (TARGET.y - BOW.y), 6);
    }
    // at the close, the target's corner where its centre minus half its size puts it
    const close = sampleOceanCamera(1, desktop);
    expect(toScreen(close, corner).x).toBeCloseTo(960 - (close.scale * TARGET.w) / 2, 3);
    expect(toScreen(close, corner).y).toBeCloseTo(540 - (close.scale * TARGET.h) / 2, 3);
  });

  it("measures 5–8 navy containers with the red stripe, the target among them, all on the deck", () => {
    expect(APG_CONTAINERS.length).toBeGreaterThanOrEqual(5);
    expect(APG_CONTAINERS.length).toBeLessThanOrEqual(8);
    expect(APG_CONTAINERS).toContain(TARGET);
    for (const c of APG_CONTAINERS) {
      expect(Math.abs(c.x + c.w / 2 - SHIP.x)).toBeLessThan(HULL_WIDTH / 2);
      expect(c.y).toBeGreaterThan(BOW.y);
    }
  });
});
