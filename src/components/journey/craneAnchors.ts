// Scene 2's gantry crane (public/images/journey/porteiner-*.webp, cut by scripts/build-crane-layers.mjs), in pixels
// of the crane image (4488×5608, the 4× upscale): the 1122 px measurements ×4, checked on crops saved with sharp.
export const CRANE = { width: 4488, height: 5608 };
// The crane itself within the image (its opaque pixels).
export const CRANE_BOUNDS = { x0: 64, y0: 324, x1: 4420, y1: 5068 };
// Where the hoist hangs from the trolley: the centre of the head block's underside.
export const HOIST = { x: 2328, y: 2176 };
// The spreader layer's box in the crane image; the spreader itself spans x 1956–2692 within it, its top (the
// sheaves) at y 2704.
export const SPREADER_BOX = { x: 1936, y: 2680, w: 776, h: 336 };
export const SPREADER = { x: 1956, w: 736, top: 2704, bottom: 2992 };
// The four hoist ropes: from the trolley (or its head block) down to where they enter the spreader's layer; about
// 10 px thick.
export const ROPES = [
  { x: 2148, top: 2120 },
  { x: 2264, top: 2176 },
  { x: 2380, top: 2176 },
  { x: 2496, top: 2120 },
];
export const ROPE_WIDTH = 10;
// The feet on the ground (y), and the two legs' span (x), for the contact shadow.
export const GROUND = { y: 5068, x0: 2512, x1: 4248 };

// Scene 3's trucks (carreta-lado and carreta-lado-vazia, 1672×941, aligned to the pixel by the same script), and the
// container cut from the loaded one: its box in the truck image.
export const TRUCK = { width: 1672, height: 941 };
// The tyres' contact line (the road), in the truck image.
export const TRUCK_ROAD_Y = 700;
// The top of scene 2's boom (its walkway), for the crane's height (crane px).
export const BOOM_TOP = 1768;
export const CONTAINER_BOX = { x: 370, y: 265, w: 1266, h: 293 };
// The twist locks the container sits on: four along its bottom rail.
export const TWIST_LOCKS = [404, 691, 1126, 1579].map((x) => ({ x, y: 552 }));
