"use client";

import { Line } from "@react-three/drei";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { type ComponentRef, Suspense, useEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  FileLoader,
  type Group,
  LineBasicMaterial,
  MathUtils,
  type Mesh,
  MeshBasicMaterial,
  type PerspectiveCamera,
  PointsMaterial,
  RingGeometry,
  Vector3,
} from "three";
import { MAP_INTRO_MS, introBridge } from "@/components/intro/bridge";
import { site } from "@/content/site";
import { HERO_ROUTES, SALVADOR_HERO, buildDots, parseStates, toHero } from "../models/heroMapLayout";
import { journeyProgress } from "../progress";
import { STAGE_CAMERAS } from "./cameras";

export const keys = STAGE_CAMERAS.hero;

const SAND = "#f3efe7";
// Red-500, pushed past 1 so the bloom picks up the travelling glow (and only that).
const RED = "#e31e24";
const RED_HOT = new Color(3.2, 0.42, 0.45);

const easeOut = (x: number) => 1 - (1 - x) ** 3;
const clamp01 = (x: number) => MathUtils.clamp(x, 0, 1);

// Where the entrance is (spec §5): outlines drawing and the dot wave over 0–900 ms, the five routes from 300 ms
// (600 ms each, 150 ms apart), Suape beating once the first one lands, the labels after. Written by intro(t),
// applied to the scene in the frame loop. Complete by default (no intro: reduced motion, ?p, ?debug).
const ROUTE = { from: 300, each: 600, stagger: 150 };
const state = { outline: 1, dots: 1, routes: HERO_ROUTES.map(() => 1), arrived: true, labels: 1 };

// The hero map's entrance at t (0–1 over MAP_INTRO_MS), called by the intro timeline through introBridge.
export function intro(t: number) {
  const ms = t * MAP_INTRO_MS;
  state.outline = easeOut(clamp01(ms / 900));
  state.dots = easeOut(clamp01(ms / 900));
  state.routes = HERO_ROUTES.map((_, i) => easeOut(clamp01((ms - ROUTE.from - i * ROUTE.stagger) / ROUTE.each)));
  state.arrived = ms >= ROUTE.from + ROUTE.each;
  state.labels = clamp01((ms - 900) / 400);
}

const outlineMaterial = new LineBasicMaterial({ color: SAND, transparent: true, opacity: 0.35, depthWrite: false });

// Dots sized in the map's own units (a third of the 0.7 grid step), so they never merge on small screens. The
// attenuated size ignores the fov, so the frame divides it back in (DOT / tan(fov / 2)). Round (discarded past
// the radius, with a soft edge), and revealed in a wave out from Suape (uReveal, a radius in map units).
// smoothstep edges always in order: reversed ones are undefined in GLSL.
const DOT = 0.24;
const REVEAL_MAX = 95;
const dotUniforms = { uReveal: { value: REVEAL_MAX } };
const dotMaterial = new PointsMaterial({ size: DOT, vertexColors: true, transparent: true, depthWrite: false });
dotMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uReveal = dotUniforms.uReveal;
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nuniform float uReveal;\nvarying float vReveal;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvReveal = 1.0 - smoothstep(uReveal - 4.0, uReveal, length(position.xz));");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying float vReveal;")
    .replace(
      "#include <color_fragment>",
      "#include <color_fragment>\nfloat r = length(gl_PointCoord - 0.5);\nif (r > 0.5) discard;\ndiffuseColor.a *= (1.0 - smoothstep(0.38, 0.5, r)) * vReveal;",
    );
};

// Set by Northeast once its geometry exists: the outline is drawn by draw range, nearest Suape first.
const outline = { geometry: null as BufferGeometry | null, segments: 0 };

function Northeast() {
  const svg = useLoader(FileLoader, "/images/map/nordeste.svg") as string;
  const { outlines, dots, segments } = useMemo(() => {
    const states = parseStates(svg);
    // Outlines as line segments, sorted by distance from Suape so the drawing spreads out from it.
    const list: [number, number, number, number, number][] = [];
    for (const rings of Object.values(states))
      for (const ring of rings)
        for (let i = 0; i < ring.length; i++) {
          const a = toHero(...ring[i]);
          const b = toHero(...ring[(i + 1) % ring.length]);
          list.push([Math.hypot((a.x + b.x) / 2, (a.z + b.z) / 2), a.x, a.z, b.x, b.z]);
        }
    list.sort((p, q) => p[0] - q[0]);
    const flat = new Float32Array(list.length * 6);
    list.forEach(([, ax, az, bx, bz], i) => flat.set([ax, 0, az, bx, 0, bz], i * 6));
    const outlines = new BufferGeometry().setAttribute("position", new BufferAttribute(flat, 3));
    const grid = buildDots(states);
    const dots = new BufferGeometry()
      .setAttribute("position", new BufferAttribute(grid.positions, 3))
      .setAttribute("color", new BufferAttribute(grid.colors, 3));
    return { outlines, dots, segments: list.length };
  }, [svg]);

  // Under the loader the canvas renders on demand: ask for the frame that shows the map.
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [invalidate]);

  useEffect(() => {
    outline.geometry = outlines;
    outline.segments = segments;
    return () => {
      outline.geometry = null;
    };
  }, [outlines, segments]);

  // The loader's last signal: the map is on screen.
  useFrame(() => {
    introBridge.frame = true;
  });

  return (
    <>
      <lineSegments geometry={outlines} material={outlineMaterial} />
      <points geometry={dots} material={dotMaterial} />
    </>
  );
}

const ROUTE_POINTS = HERO_ROUTES.map((r) => r.getPoints(64));
const ROUTE_LENGTHS = HERO_ROUTES.map((r) => r.getLength());
// The glow: one dash a sixth of the route long, crossing it every 3.2 s, the routes out of step.
const GLOW = { share: 0.16, period: 3.2 };

// Suape's beat: a ring that grows and fades every 2.4 s, from the first route's arrival.
const PULSE = 2.4;
const ringMaterial = new MeshBasicMaterial({ color: RED, transparent: true, depthWrite: false });
const ringGeometry = new RingGeometry(0.55, 0.75, 48).rotateX(-Math.PI / 2);
const coreGeometry = new CircleGeometry(0.45, 32).rotateX(-Math.PI / 2);
const coreMaterial = new MeshBasicMaterial({ color: RED, transparent: true });

// Pointer parallax: up to ±2° of tilt, damped. Only with a fine pointer and without reduced motion.
const PARALLAX = MathUtils.degToRad(2);
// The labels fade out as the dive begins.
const DIVE_FADE = [0.002, 0.012] as const;
// The map itself fades before the camera gets close (its dots would fill the screen as huge squares), then the
// routes and Suape; the crane stage builds from 0.03.
const MAP_FADE = [0.01, 0.03] as const;
const ROUTE_FADE = [0.02, 0.04] as const;
// Hover radius around Suape, in px.
const HOVER_PX = 28;

const SUAPE = new Vector3();
const ORIGIN = new Vector3();
const screen = new Vector3();

// Screen-space labels: plain DOM over the canvas, placed each frame by projecting their point, so they keep a
// fixed size in px. Created imperatively (no React root per label). Where each sits, in map units.
const LABELS = [
  { at: new Vector3(1.4, 0.6, -1.2), text: site.journeyScene.mapLabels.suape },
  { at: new Vector3(SALVADOR_HERO.x + 1.2, 0.6, SALVADOR_HERO.z), text: site.journeyScene.mapLabels.salvador },
];
const LABEL_CLASS =
  "pointer-events-none absolute top-0 left-0 font-mono text-[11px] tracking-[0.18em] whitespace-nowrap text-sand-50/85";
const HOVER_CLASS =
  "pointer-events-none absolute top-0 left-0 border border-sand-50/15 bg-navy-900/85 px-3 py-2 font-mono text-[11px] tracking-[0.12em] whitespace-nowrap text-sand-50 opacity-0 transition-opacity duration-150 ease-out data-on:opacity-100";

// Chapter 0: the Northeast coast as a tilted map of lines and dots, cabotage routes arcing in from the sea onto
// Suape, which beats.
export function HeroMapStage({ reducedMotion }: { reducedMotion: boolean }) {
  const map = useRef<Group>(null);
  const bases = useRef<(ComponentRef<typeof Line> | null)[]>([]);
  const glows = useRef<(ComponentRef<typeof Line> | null)[]>([]);
  const ring = useRef<Mesh>(null);
  const core = useRef<Mesh>(null);
  const labels = useRef<HTMLDivElement[]>([]);
  const hoverLabel = useRef<HTMLDivElement | null>(null);
  const pointer = useRef({ x: 0, y: 0, inside: false, fine: false });
  const pulseFrom = useRef<number | null>(null);
  const getState = useThree((s) => s.get);

  // The timeline drives the entrance through the bridge; pick up wherever it already is.
  useEffect(() => {
    introBridge.map.run = intro;
    intro(introBridge.map.t);
    return () => {
      introBridge.map.run = null;
    };
  }, []);

  // The labels live next to the canvas (inside the aria-hidden stage layer).
  useEffect(() => {
    const host = getState().gl.domElement.parentElement!;
    const make = (text: string, className: string) => {
      const el = document.createElement("div");
      el.className = className;
      el.textContent = text;
      el.style.opacity = "0";
      host.appendChild(el);
      return el;
    };
    labels.current = LABELS.map(({ text }) => make(text, LABEL_CLASS));
    const hover = make(site.journeyScene.suapeHover, HOVER_CLASS);
    hover.style.removeProperty("opacity");
    hoverLabel.current = hover;
    return () => {
      for (const el of [...labels.current, hover]) el.remove();
      labels.current = [];
      hoverLabel.current = null;
    };
  }, [getState]);

  // Parallax and the Suape hover follow the window's pointer: the hero's copy sits above the canvas.
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const onMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY, inside: true, fine: fine.matches };
    };
    const onLeave = () => (pointer.current.inside = false);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // e2e only (dev builds): the map's projected box on screen, from every outline vertex and route point.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const point = new Vector3();
    (window as unknown as { __heroMapRect: () => object | null }).__heroMapRect = () => {
      const { camera } = getState();
      const { width, height } = getState().size;
      const group = map.current;
      const positions = outline.geometry?.getAttribute("position");
      if (!group || !positions) return null;
      const rect = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
      const add = (v: Vector3) => {
        v.applyMatrix4(group.matrixWorld).project(camera);
        const x = ((v.x + 1) / 2) * width;
        const y = ((1 - v.y) / 2) * height;
        rect.left = Math.min(rect.left, x);
        rect.right = Math.max(rect.right, x);
        rect.top = Math.min(rect.top, y);
        rect.bottom = Math.max(rect.bottom, y);
      };
      for (let i = 0; i < positions.count; i++) add(point.fromBufferAttribute(positions, i));
      for (const points of ROUTE_POINTS) for (const p of points) add(point.copy(p));
      return rect;
    };
  }, [getState]);

  useFrame(({ camera, clock, size }, delta) => {
    const p = journeyProgress.value;
    dotMaterial.size = DOT / Math.tan(MathUtils.degToRad((camera as PerspectiveCamera).fov) / 2);

    const mapFade = 1 - MathUtils.smoothstep(p, ...MAP_FADE);
    const routeFade = 1 - MathUtils.smoothstep(p, ...ROUTE_FADE);
    outlineMaterial.opacity = 0.35 * mapFade;
    dotMaterial.opacity = mapFade;
    outlineMaterial.visible = dotMaterial.visible = mapFade > 0;

    // The entrance.
    if (outline.geometry) outline.geometry.setDrawRange(0, Math.round(state.outline * outline.segments) * 2);
    dotUniforms.uReveal.value = state.dots * REVEAL_MAX;
    state.routes.forEach((f, i) => {
      const base = bases.current[i];
      if (base) {
        base.material.dashOffset = ROUTE_LENGTHS[i] * (1 - f);
        base.material.opacity = 0.55 * routeFade;
      }
      const glow = glows.current[i];
      if (glow) glow.visible = f >= 1 && routeFade > 0.5;
    });
    if (!state.arrived) pulseFrom.current = null;
    else if (pulseFrom.current === null) pulseFrom.current = clock.elapsedTime;
    const since = pulseFrom.current === null ? -1 : clock.elapsedTime - pulseFrom.current;
    const coreIn = since < 0 ? 0 : easeOut(clamp01(since / 0.25));
    core.current!.scale.setScalar(0.6 + 0.4 * coreIn);
    coreMaterial.opacity = coreIn * routeFade;

    const dive = 1 - MathUtils.smoothstep(p, ...DIVE_FADE);
    const place = (el: HTMLElement, at: Vector3, dx: number, shift: string) => {
      screen.copy(at).applyMatrix4(map.current!.matrixWorld).project(camera);
      const sx = ((screen.x + 1) / 2) * size.width;
      const sy = ((1 - screen.y) / 2) * size.height;
      el.style.transform = `translate3d(${(sx + dx).toFixed(1)}px, ${sy.toFixed(1)}px, 0) ${shift}`;
    };
    labels.current.forEach((label, i) => {
      // Salvador with the outlines, Suape once its first route has landed.
      const opacity = (i === 0 ? coreIn : 1) * state.labels * dive;
      label.style.opacity = String(opacity);
      if (opacity > 0) place(label, LABELS[i].at, 0, "translateY(-50%)");
    });

    // Pointer: parallax tilt and the Suape hover, both only in the hero.
    const { x, y, inside, fine } = pointer.current;
    const live = fine && inside && !reducedMotion && dive > 0;
    const tiltX = live ? ((y / size.height) * 2 - 1) * PARALLAX : 0;
    const tiltZ = live ? -((x / size.width) * 2 - 1) * PARALLAX : 0;
    map.current!.rotation.x = MathUtils.damp(map.current!.rotation.x, tiltX, 4, delta);
    map.current!.rotation.z = MathUtils.damp(map.current!.rotation.z, tiltZ, 4, delta);
    let hover = false;
    if (fine && inside && dive > 0 && coreIn > 0) {
      core.current!.getWorldPosition(SUAPE);
      screen.copy(SUAPE).project(camera);
      const sx = ((screen.x + 1) / 2) * size.width;
      const sy = ((1 - screen.y) / 2) * size.height;
      hover = Math.hypot(sx - x, sy - y) < HOVER_PX;
    }
    if (hoverLabel.current) {
      hoverLabel.current.toggleAttribute("data-on", hover);
      // Suape is on the east coast, near the frame's edge: the tooltip opens to its left.
      if (hover) place(hoverLabel.current, ORIGIN, -16, "translate(-100%, 12px)");
    }

    if (reducedMotion) return;
    const t = clock.elapsedTime;
    glows.current.forEach((line, i) => {
      if (!line) return;
      const length = ROUTE_LENGTHS[i];
      const dash = length * GLOW.share;
      // From just before the start to the end, then again.
      const travel = ((t / GLOW.period + i * 0.23) % 1) * (length + dash) - dash;
      line.material.dashOffset = -travel;
    });
    const phase = since < 0 ? 0 : (since % PULSE) / PULSE;
    ring.current!.scale.setScalar(1 + 4 * phase);
    ringMaterial.opacity = since < 0 ? 0 : (1 - phase) * routeFade;
  });

  return (
    <group ref={map}>
      <Suspense fallback={null}>
        <Northeast />
      </Suspense>
      {ROUTE_POINTS.map((points, i) => (
        <group key={i}>
          {/* Drawn from the sea onto Suape: one dash the route's length, slid in by dashOffset. */}
          <Line
            ref={(l) => {
              bases.current[i] = l;
            }}
            points={points}
            color={RED}
            lineWidth={1.4}
            transparent
            opacity={0.55}
            dashed
            dashSize={ROUTE_LENGTHS[i]}
            gapSize={ROUTE_LENGTHS[i]}
          />
          {!reducedMotion && (
            <Line
              ref={(l) => {
                glows.current[i] = l;
              }}
              points={points}
              color={RED_HOT}
              lineWidth={2.6}
              dashed
              dashSize={ROUTE_LENGTHS[i] * GLOW.share}
              gapSize={ROUTE_LENGTHS[i]}
              dashOffset={ROUTE_LENGTHS[i] * GLOW.share}
            />
          )}
        </group>
      ))}
      <mesh ref={core} geometry={coreGeometry} material={coreMaterial} position-y={0.02} />
      <mesh ref={ring} geometry={ringGeometry} material={ringMaterial} position-y={0.02} visible={!reducedMotion} />
    </group>
  );
}
