import { TRUCK, TRUCK_ROAD_Y } from "./craneAnchors";

// The side-view truck's contact shadow, drawn (the cut-outs have none): a soft ellipse along the tyres' line, in
// the truck's own box.
export function TruckShadow() {
  return (
    <div
      aria-hidden="true"
      className="absolute rounded-[50%] bg-[radial-gradient(closest-side,rgb(10_19_56/0.18),transparent)]"
      style={{ left: "-2%", width: "104%", top: `${((TRUCK_ROAD_Y - 22) / TRUCK.height) * 100}%`, height: `${(44 / TRUCK.height) * 100}%` }}
    />
  );
}
