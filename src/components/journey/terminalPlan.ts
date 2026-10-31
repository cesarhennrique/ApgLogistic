// Scene 5's plan of the CONE terminal, drawn by hand in plan units (viewBox 0 0 1000 660, ~4.3 units a metre): the
// yard's fence, the container stacks, the cross-docking warehouse with its 46 docks, the gate and the roads, and the
// path the truck drives from the gate to its dock.
export const PLAN = { width: 1000, height: 660, yard: { x0: 60, y0: 60, x1: 940, y1: 600 } };

// Two lanes each; the truck is as wide as one.
export const ROAD_WIDTH = 36;
// Centre lines: the gate road up from outside the fence, the main road along the south, the west, north and
// middle roads round the stacks.
export const ROADS = [
  { x0: 110, y0: 548, x1: 110, y1: 660 },
  { x0: 110, y0: 548, x1: 900, y1: 548 },
  { x0: 110, y0: 108, x1: 110, y1: 548 },
  { x0: 110, y0: 108, x1: 620, y1: 108 },
  { x0: 620, y0: 108, x1: 620, y1: 548 },
];
// The fence, open at the gate (x 92–128 on its south side), and the gate house beside it.
export const FENCE = "M92 600H60V60H940V600H128";
export const GATE = { house: { x: 136, y: 606, w: 24, h: 18 }, x: 110 };
// One-way arrows: where and which way (degrees, 0 = east).
export const ARROWS = [
  { x: 110, y: 628, a: -90 },
  { x: 300, y: 548, a: 0 },
  { x: 480, y: 548, a: 0 },
  { x: 620, y: 330, a: -90 },
  { x: 370, y: 108, a: 180 },
  { x: 110, y: 330, a: 90 },
];

// Eight stack blocks of 20 ft boxes, 500 TEUs each: 4,000 static TEUs.
const BLOCK = { x: 150, y: 150, w: 92.5, h: 162.5, gap: 20, rows: 2, cols: 4 };
export const STACKS = Array.from({ length: BLOCK.rows * BLOCK.cols }, (_, i) => ({
  x: BLOCK.x + (i % BLOCK.cols) * (BLOCK.w + BLOCK.gap),
  y: BLOCK.y + Math.floor(i / BLOCK.cols) * (BLOCK.h + 30),
  w: BLOCK.w,
  h: BLOCK.h,
  teus: 500,
}));
// A block's boxes: three 20 ft boxes across, rows 10 units apart.
export const stackLines = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => {
  let d = "";
  for (let r = y + 10; r < y + h - 1; r += 10) d += `M${x} ${r}H${x + w}`;
  for (const c of [1, 2]) d += `M${x + (w * c) / 3} ${y}V${y + h}`;
  return d;
};

// The warehouse (cross-docking, 5,000 m² covered) and its 46 docks round its west, south and east faces: 17, 12 and
// 17, numbered 01–46 anticlockwise from its north-west corner, 8 units deep.
export const WAREHOUSE = { x: 680, y: 96, w: 240, h: 344 };
const DEPTH = 8;
const west = Array.from({ length: 17 }, (_, i) => {
  const h = WAREHOUSE.h / 17;
  return { x: WAREHOUSE.x - DEPTH, y: WAREHOUSE.y + i * h, w: DEPTH, h };
});
const south = Array.from({ length: 12 }, (_, i) => {
  const w = WAREHOUSE.w / 12;
  return { x: WAREHOUSE.x + i * w, y: WAREHOUSE.y + WAREHOUSE.h, w, h: DEPTH };
});
const east = Array.from({ length: 17 }, (_, i) => {
  const h = WAREHOUSE.h / 17;
  return { x: WAREHOUSE.x + WAREHOUSE.w, y: WAREHOUSE.y + WAREHOUSE.h - (i + 1) * h, w: DEPTH, h };
});
export const DOCKS = [...west, ...south, ...east].map((d, i) => ({ ...d, n: i + 1 }));

// The truck seen from above (carreta-cima, 941×1672, its body 323 px wide and 1516 long, nose up), sized to a lane.
export const TRUCK_SIZE = { width: ROAD_WIDTH / 2, length: ((ROAD_WIDTH / 2) * 1516) / 323 };
export const TRUCK_IMAGE = { width: (TRUCK_SIZE.width * 941) / 323, height: (TRUCK_SIZE.width * 1672) / 323 };
// Its dock: the middle of the south face.
export const TARGET_DOCK = 23;
const dock = DOCKS[TARGET_DOCK - 1];
// The path of the truck's centre: in at the gate, east along the main road, a left turn onto the apron, nose-in to
// the dock (its nose at the dock's outer edge).
export const TRUCK_PATH_END = { x: dock.x + dock.w / 2, y: dock.y + dock.h + TRUCK_SIZE.length / 2 };
export const TRUCK_PATH =
  `M110 700L110 600C110 566 124 548 158 548L${TRUCK_PATH_END.x - 70} 548` +
  `C${TRUCK_PATH_END.x - 20} 548 ${TRUCK_PATH_END.x} 530 ${TRUCK_PATH_END.x} 505L${TRUCK_PATH_END.x} ${TRUCK_PATH_END.y}`;

// The dimensions, drawn as on a plan (a line with end ticks and extension lines), each with its label's anchor: the
// yard, the stacks, the docks (inside the warehouse, along its south docks: the truck parks outside), the covered
// area.
export const DIMENSIONS = [
  { x0: 60, y0: 36, x1: 940, y1: 36, ext: [60, 60] as const, label: { x: 500, y: 36 } },
  { x0: 150, y0: 628, x1: 580, y1: 628, ext: [507.5, 507.5] as const, label: { x: 365, y: 628 } },
  { x0: 680, y0: 424, x1: 920, y1: 424, ext: [440, 440] as const, label: { x: 800, y: 424 } },
  { x0: 680, y0: 78, x1: 920, y1: 78, ext: [96, 96] as const, label: { x: 800, y: 78 } },
];
