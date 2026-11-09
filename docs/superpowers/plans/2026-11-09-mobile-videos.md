# M3: the journey on a phone as short videos

**Goal:** On a phone (width < 768 px or a coarse pointer), the journey becomes short hardware-decoded clips under native scroll. The desktop stays as it is.

**Architecture:**
- `lib/phoneLayout` decides once on the client: phone or not, plus `?record` to force the desktop journey.
- `JourneyScenes` uses that decision to dynamically import one of two chunks. Before the decision, a placeholder of the right height shows.
  - **`DesktopScenes`:** scenes 1–5 and the index, unchanged.
  - **`MobileJourney`:** five `<video>` sections, the SVG distribution map, and HTML copy with a one-shot entry animation.
- The clips are recorded from the desktop journey at 390×844 by a Playwright script and encoded with ffmpeg-static.

**Tech:** Next 16, Tailwind v4 (`phone:` and `desk:` variants), Playwright, ffmpeg-static, sharp, Vitest.

## Global constraints

- **Desktop:** identical. The desktop screenshots show no difference.
- **Phone:**
  - no pin-spacer, no scrub, no Lenis, no ScrollTrigger in the journey;
  - at most 2 `<video>` elements with a `src` at once.
- **Clips:**
  - H.264 High, yuv420p, 720 px wide, CRF 26–28, faststart, no audio;
  - each clip ≤ 1.2 MB, ≤ 6 MB in total;
  - posters and last frames in AVIF and WebP, ≤ 60 KB each.
- **Phone targets:**
  - p95 frame time ≤ 20 ms at 4× CPU slowdown;
  - no long task over 50 ms;
  - ≤ 15 MP of decoded images;
  - LCP no worse than before.
- All text comes from `src/content/site.ts`.

## Tasks

1. **`src/lib/phoneLayout.ts`:**
   - `DESKTOP_QUERY`, `isPhoneLayout()` and `usePhoneLayout()`;
   - in `globals.css`, `@custom-variant phone` / `desk`, and the `data-recording` rule that hides text (`[data-rec-hide]` and the header).
2. **`src/components/journey/videoSlots.ts`:** `pickLoaded(clips, max)` keeps the 2 nearest clips within 1 screen. Test-first in `videoSlots.test.ts`.
3. **`JourneyScenes`, `DesktopScenes` and the placeholder:**
   - `Journey.tsx` uses them;
   - each chunk fires `journey:mounted` once it has mounted;
   - `HeroStage` and `Header` listen for it: HeroStage builds its triggers, Header rescans the header tones and refreshes ScrollTrigger.
4. **Hero on a phone:** `phone:h-svh`, no dive and no ArrivalFrame. The SVG map is animated and unmounted when off screen.
5. **The rest of the Home on a phone:**
   - ServicesTrack, FinalCta and Parallax are gated on `desk`;
   - ServicesTrack loses its negative margin on a phone.
6. **`scripts/record-mobile-clips.mjs` (`npm run clips`):**
   - steps the frames: scroll, 2 rAF, screenshot;
   - then encodes with ffmpeg, and writes posters and last frames with sharp;
   - outputs to `public/video/jornada/`.
7. **`MobileJourney`:**
   - sections for navio, porteiner, carga, estrada-a and estrada-b (the chapters and scoreboard sit below estrada-b), plus the distribution;
   - each video plays at 60 % visible, pauses off screen, and restarts when entered from above;
   - a played clip's poster becomes its last frame;
   - fallback image when `play()` is refused or reduced motion is on.
8. **e2e:**
   - the desktop-journey specs skip the phone layout;
   - new `mobile-journey.spec`;
   - `memory.spec` and `smoothness.spec` get the new targets.
9. **Screenshots and a whole-Home phone video;** then lint, typecheck, test and e2e; commit; push `fix/mobile-videos`.
