// Scene 2's gantry crane (public/images/journey/porteiner-*.webp, cut by scripts/build-crane-layers.mjs), in pixels
// of the crane image (1122×1402), measured on crops saved with sharp.
export const CRANE = { width: 1122, height: 1402 };
// Where the hoist hangs from the trolley: the centre of the head block's underside.
export const HOIST = { x: 582, y: 544 };
// The spreader layer's box in the crane image; the spreader itself spans x 489–673 within it, its top (the sheaves)
// at y 676.
export const SPREADER_BOX = { x: 484, y: 670, w: 194, h: 84 };
export const SPREADER = { x: 489, w: 184, top: 676, bottom: 748 };
// The four hoist ropes: from the trolley (or its head block) down to where they enter the spreader's layer.
export const ROPES = [
  { x: 537, top: 530 },
  { x: 566, top: 544 },
  { x: 595, top: 544 },
  { x: 624, top: 530 },
];
// The feet on the ground (y), and the two legs' span (x), for the contact shadow.
export const GROUND = { y: 1267, x0: 628, x1: 1062 };

// Scene 3's trucks (carreta-lado and carreta-lado-vazia, 1672×941, aligned to the pixel by the same script), and the
// container cut from the loaded one: its box in the truck image.
export const TRUCK = { width: 1672, height: 941 };
export const CONTAINER_BOX = { x: 370, y: 265, w: 1266, h: 293 };
// The twist locks the container sits on: four along its bottom rail.
export const TWIST_LOCKS = [404, 691, 1126, 1579].map((x) => ({ x, y: 552 }));
