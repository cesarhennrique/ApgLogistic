import { Color } from "three";
import { describe, expect, it } from "vitest";
import { THEMES, blueprintTheme, lightness } from "./theme";

const close = (a: Color, b: Color) => Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));

describe("blueprint theme", () => {
  it("is the dark theme on navy stages and the light one on sand stages", () => {
    for (const t of [0, 0.5, 1]) expect(close(blueprintTheme(t).stroke, THEMES.dark.stroke)).toBeLessThan(1e-6);
    for (const t of [0.15, 0.3, 0.7]) {
      const theme = blueprintTheme(t);
      expect(close(theme.stroke, THEMES.light.stroke)).toBeLessThan(1e-6);
      expect(close(theme.fill, THEMES.light.fill)).toBeLessThan(1e-6);
      expect(theme.strokeOpacity).toBeCloseTo(THEMES.light.strokeOpacity);
    }
  });

  it("follows the background's transitions without a jump", () => {
    let last = blueprintTheme(0);
    let lastLight = lightness(0);
    for (let t = 0.0005; t <= 1; t += 0.0005) {
      const theme = blueprintTheme(t);
      // The steepest background transition (0.02 of progress) crosses navy → sand in ~40 of these steps.
      expect(close(theme.stroke, last.stroke), `t=${t.toFixed(4)}`).toBeLessThan(0.08);
      expect(close(theme.fill, last.fill), `t=${t.toFixed(4)}`).toBeLessThan(0.08);
      expect(Math.abs(theme.strokeOpacity - last.strokeOpacity)).toBeLessThan(0.02);
      expect(Math.abs(lightness(t) - lastLight)).toBeLessThan(0.1);
      last = theme;
      lastLight = lightness(t);
    }
  });
});
