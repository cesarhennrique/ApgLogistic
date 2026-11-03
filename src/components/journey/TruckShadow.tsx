import { TRUCK, TRUCK_ROAD_Y } from "./craneAnchors";

// A cut-out's contact shadow, drawn (the cut-outs have none): a soft ellipse along its ground line (y), this deep,
// from left over width, all shares of its own box. By default the side-view truck's, along the tyres' line.
export function TruckShadow({ y = TRUCK_ROAD_Y / TRUCK.height, depth = 44 / TRUCK.height, left = -0.02, width = 1.04 }) {
  return (
    <div
      aria-hidden="true"
      className="absolute rounded-[50%] bg-[radial-gradient(closest-side,rgb(10_19_56/0.18),transparent)]"
      style={{ left: `${left * 100}%`, width: `${width * 100}%`, top: `${(y - depth / 2) * 100}%`, height: `${depth * 100}%` }}
    />
  );
}
