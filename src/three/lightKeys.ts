import { Color, MathUtils, Vector3 } from "three";

type LightKey = {
  t: number;
  skyTop: Color;
  skyHorizon: Color;
  sunColor: Color;
  sunIntensity: number;
  // Degrees. Elevation above the horizon; azimuth from -Z (the hero's view), negative to the left.
  sunElevation: number;
  sunAzimuth: number;
  // The key (directional) light's azimuth. The sun's at the hero, where the disc is in frame; across the port
  // it swings toward the sea side so the faces the camera sees take the warm light (cinema cheat).
  keyAzimuth: number;
  ambientColor: Color;
  ambientIntensity: number;
  hemiSky: Color;
  hemiGround: Color;
  hemiIntensity: number;
  fogDensity: number;
  exposure: number;
  envIntensity: number;
  stars: number;
  // 0–1: yard lights (emissive lamps, light pools on the concrete). On from dusk.
  lamps: number;
};

// Fog takes the horizon's color, so the sea fades into the sky without a seam.
export type LightSample = Omit<LightKey, "t"> & { fogColor: Color };

const c = (hex: string) => new Color(hex);

// Sunset (hero), the port at golden hour (1–2), late sunset, dusk on the highway (3), night with the lights
// on (4–5).
export const LIGHT_KEYS: LightKey[] = [
  {
    t: 0,
    skyTop: c("#16205a"),
    skyHorizon: c("#f2913d"),
    sunColor: c("#ffc07a"),
    sunIntensity: 2.6,
    sunElevation: 2,
    sunAzimuth: -14,
    keyAzimuth: -14,
    ambientColor: c("#f2c9a0"),
    ambientIntensity: 0.08,
    hemiSky: c("#6b86c9"),
    hemiGround: c("#2b1e1a"),
    hemiIntensity: 0.9,
    fogDensity: 0.007,
    exposure: 1,
    envIntensity: 0.35,
    stars: 0,
    lamps: 0,
  },
  {
    // The port at golden hour: thin haze (the crane shots look ~100 m out), key light raking from the sea side.
    t: 0.2,
    skyTop: c("#141e55"),
    skyHorizon: c("#ea7c3a"),
    sunColor: c("#ffa863"),
    sunIntensity: 2.4,
    sunElevation: 1.5,
    sunAzimuth: -15,
    keyAzimuth: -70,
    ambientColor: c("#f0b890"),
    ambientIntensity: 0.07,
    hemiSky: c("#6580c6"),
    hemiGround: c("#2a1c1a"),
    hemiIntensity: 0.85,
    fogDensity: 0.004,
    exposure: 1,
    envIntensity: 0.3,
    stars: 0,
    lamps: 0,
  },
  {
    t: 0.4,
    skyTop: c("#111a4c"),
    skyHorizon: c("#e0683a"),
    sunColor: c("#ff8e4d"),
    sunIntensity: 2,
    sunElevation: 0.8,
    sunAzimuth: -16,
    keyAzimuth: -80,
    ambientColor: c("#e8a27a"),
    ambientIntensity: 0.07,
    hemiSky: c("#5f78c0"),
    hemiGround: c("#24181a"),
    hemiIntensity: 0.8,
    fogDensity: 0.006,
    exposure: 0.95,
    envIntensity: 0.3,
    stars: 0,
    lamps: 0,
  },
  {
    t: 0.6,
    skyTop: c("#0b1238"),
    skyHorizon: c("#6b4366"),
    sunColor: c("#ff6a4a"),
    sunIntensity: 0.25,
    sunElevation: -3,
    sunAzimuth: -18,
    keyAzimuth: -60,
    ambientColor: c("#7a86b8"),
    ambientIntensity: 0.18,
    hemiSky: c("#4a5a9a"),
    hemiGround: c("#1a1424"),
    hemiIntensity: 0.45,
    fogDensity: 0.006,
    exposure: 0.85,
    envIntensity: 0.2,
    stars: 0,
    lamps: 0.35,
  },
  {
    t: 1,
    skyTop: c("#040820"),
    skyHorizon: c("#18224a"),
    // Past dusk the "sun" light is a cool moonlight from the same side.
    sunColor: c("#9fb4ff"),
    sunIntensity: 0.35,
    sunElevation: -14,
    sunAzimuth: -20,
    keyAzimuth: -40,
    ambientColor: c("#5a6ba8"),
    ambientIntensity: 0.15,
    hemiSky: c("#2a3a78"),
    hemiGround: c("#0a0a14"),
    hemiIntensity: 0.4,
    fogDensity: 0.007,
    exposure: 0.8,
    envIntensity: 0.08,
    stars: 1,
    lamps: 1,
  },
];

const COLORS = ["skyTop", "skyHorizon", "sunColor", "ambientColor", "hemiSky", "hemiGround"] as const;
const NUMBERS = [
  "sunIntensity",
  "sunElevation",
  "sunAzimuth",
  "keyAzimuth",
  "ambientIntensity",
  "hemiIntensity",
  "fogDensity",
  "exposure",
  "envIntensity",
  "stars",
  "lamps",
] as const;

function createSample(): LightSample {
  const s = { fogColor: new Color() } as LightSample;
  for (const k of COLORS) s[k] = new Color();
  return s;
}

// Smootherstep inside each segment: values and their slopes are continuous across keys.
export function sampleLight(t: number, out: LightSample = createSample()): LightSample {
  const p = MathUtils.clamp(t, 0, 1);
  let i = 0;
  while (i < LIGHT_KEYS.length - 2 && p > LIGHT_KEYS[i + 1].t) i++;
  const a = LIGHT_KEYS[i];
  const b = LIGHT_KEYS[i + 1];
  const u = MathUtils.smootherstep(p, a.t, b.t);
  for (const k of COLORS) out[k].lerpColors(a[k], b[k], u);
  for (const k of NUMBERS) out[k] = MathUtils.lerp(a[k], b[k], u);
  out.fogColor.copy(out.skyHorizon);
  return out;
}

// Unit vector toward the sun. Azimuth 0 looks down -Z; negative turns left (-X).
export function sunDirection(azimuth: number, elevation: number, out = new Vector3()): Vector3 {
  const az = MathUtils.degToRad(azimuth);
  const el = MathUtils.degToRad(elevation);
  return out.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
}
