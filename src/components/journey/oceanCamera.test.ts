import { describe, expect, it } from "vitest";
import { FOCUS, HULL_WIDTH, MAX_PIXEL_SCALE, SHIP, ZOOM, maxZoom, sampleOceanCamera } from "./oceanCamera";

const desktop = { width: 1920, height: 1080, dpr: 1 };
const retina = { width: 1440, height: 900, dpr: 2 };
const phone = { width: 390, height: 844, dpr: 3 };

// Where a photo point lands on screen.
const onScreen = (cam: { x: number; y: number; scale: number }, point: { x: number; y: number }) => ({
  x: cam.x + cam.scale * point.x,
  y: cam.y + cam.scale * point.y,
});

describe("oceanCamera", () => {
  it("holds the wide framing until the zoom starts: the whole photo, the ship at the centre", () => {
    for (const p of [0, ZOOM[0]]) {
      const cam = sampleOceanCamera(p, desktop);
      expect(cam.scale).toBeCloseTo(Math.max(1920 / 6688, 1080 / 3764), 6);
      // 16:9, like the photo: it shows whole, edge to edge, so the ship sits as near the centre as that allows.
      expect(cam.x).toBeLessThanOrEqual(0);
      expect(cam.x + cam.scale * 6688).toBeGreaterThanOrEqual(1920);
      const ship = onScreen(cam, SHIP);
      expect(Math.abs(ship.x - 960)).toBeLessThan(6);
      expect(Math.abs(ship.y - 540)).toBeLessThan(0.05 * 1080);
    }
    // A phone crops the photo's sides: the ship exactly at the centre across (its height fills the screen, as above).
    const ship = onScreen(sampleOceanCamera(0, phone), SHIP);
    expect(ship.x).toBeCloseTo(195, 3);
  });

  it("puts the focus at the centre of the screen when the zoom ends, and holds it", () => {
    for (const view of [desktop, retina, phone]) {
      for (const p of [ZOOM[1], 1]) {
        const focus = onScreen(sampleOceanCamera(p, view), FOCUS);
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
});
