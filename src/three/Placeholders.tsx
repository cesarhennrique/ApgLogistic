import { CHAPTERS, type ChapterId } from "./chapters";
import { SCENE_POSITIONS } from "./camera-path";

// shortcut: colored boxes mark where each scene goes; replaced by the real models in later prompts.
const COLORS: Record<ChapterId, string> = {
  hero: "#f2913d",
  crane: "#e31e24",
  load: "#393185",
  highway: "#8b94a8",
  terminal: "#f3efe7",
  distribution: "#e31e24",
};

const BOXES: [number, number, number, number, number, number][] = [
  // x, y, z offset, then width, height, depth
  [0, 1, 0, 3, 2, 3],
  [-3, 0.6, 1.5, 1.6, 1.2, 1.6],
  [2.6, 0.4, -2, 1.2, 0.8, 2.4],
];

export function Placeholders() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -40]}>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#0a1338" />
      </mesh>
      {CHAPTERS.map(({ id }) => (
        <group key={id} position={SCENE_POSITIONS[id]}>
          {BOXES.map(([x, y, z, w, h, d], i) => (
            <mesh key={i} position={[x, y, z]}>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color={COLORS[id]} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
