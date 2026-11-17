// Single source of truth for every BioXar number shown on the site.
// Prototype values: change them here and the whole site follows.

// ---- Carbon logic (from the team's CO2 calculator, BioXar_CO2_calculations.xlsx) ----
export interface CarbonAssumptions {
  /** Mass of one block, kg. */
  massKg: number;
  /** Nominal density, kg/m3. */
  densityKgM3: number;
  /** kg CO2 not emitted per kg of block material. */
  co2PerKg: number;
  /** Share of block mass that is biochar, 0 to 1. */
  biocharShare: number;
  /** kg biochar per kg of dry crop waste, 0 to 1. */
  pyrolysisYield: number;
  /** EUR per carbon certificate (1 certificate = 1 t CO2e). */
  pricePerTonne: number;
  /** Average car emissions, kg CO2 per km. */
  carKgPerKm: number;
  /** Average km driven by car per year. */
  carKmPerYear: number;
}

export const CARBON_DEFAULTS: CarbonAssumptions = {
  massKg: 7,
  densityKgM3: 85,
  co2PerKg: 0.412,
  biocharShare: 0.6,
  pyrolysisYield: 0.25,
  pricePerTonne: 130,
  carKgPerKm: 0.12,
  carKmPerYear: 12000,
};

/** Months of average car driving that emit the same CO2. */
export function carMonths(co2Kg: number, a: CarbonAssumptions = CARBON_DEFAULTS) {
  const perMonth = (a.carKgPerKm * a.carKmPerYear) / 12;
  return perMonth > 0 ? co2Kg / perMonth : 0;
}

/** "13 days", "2.4 months", "1.1 years" of average car driving. */
export function carTime(co2Kg: number, a: CarbonAssumptions = CARBON_DEFAULTS) {
  const m = carMonths(co2Kg, a);
  if (m < 1) {
    const d = Math.max(1, Math.round(m * 30));
    return `${d} day${d === 1 ? "" : "s"}`;
  }
  if (m < 12) return `${m.toFixed(1)} months`;
  return `${(m / 12).toFixed(1)} years`;
}

/** Everything the calculator derives for a number of blocks. Unrounded. */
export function calculateCarbon(blocks: number, a: CarbonAssumptions = CARBON_DEFAULTS) {
  const totalMass = blocks * a.massKg;
  const volumePerBlockM3 = a.densityKgM3 > 0 ? a.massKg / a.densityKgM3 : 0;
  const biochar = totalMass * a.biocharShare;
  const cropWaste = a.pyrolysisYield > 0 ? biochar / a.pyrolysisYield : 0;
  const co2PerBlockKg = a.massKg * a.co2PerKg;
  const co2AvoidedKg = totalMass * a.co2PerKg;
  const certificates = co2AvoidedKg / 1000;
  return {
    blocks,
    totalMass,
    volumePerBlockM3,
    volumePerBlockL: volumePerBlockM3 * 1000,
    totalVolumeM3: volumePerBlockM3 * blocks,
    biochar,
    cropWaste,
    co2PerBlockKg,
    co2AvoidedKg,
    certificates,
    blocksPerCertificate: co2PerBlockKg > 0 ? Math.ceil(1000 / co2PerBlockKg) : 0,
    value: certificates * a.pricePerTonne,
    carKm: a.carKgPerKm > 0 ? co2AvoidedKg / a.carKgPerKm : 0,
    carMonths: carMonths(co2AvoidedKg, a),
  };
}

const r1 = (v: number) => Math.round(v * 10) / 10;
const ONE = calculateCarbon(1);

export const BLOCK = {
  sizeCm: { w: 50, d: 50, h: 60 },
  holeCm: { w: 24, h: 36 },
  weightKg: CARBON_DEFAULTS.massKg,
  composition: {
    biocharKg: r1(ONE.biochar),
    biocharPct: Math.round(CARBON_DEFAULTS.biocharShare * 100),
    binderKg: r1(CARBON_DEFAULTS.massKg - ONE.biochar),
    binderPct: Math.round((1 - CARBON_DEFAULTS.biocharShare) * 100),
  },
  material: "Biochar foam",
  origin: "Crop residues",
  /** kg CO2e per block, 2.884 with the defaults. */
  carbonKgPerBlock: Math.round(ONE.co2PerBlockKg * 1000) / 1000,
  /** kg of dry crop waste behind one block, 16.8 with the defaults. */
  cropWasteKgPerBlock: r1(ONE.cropWaste),
  endOfLife: "Back to soil",
  priceEur: 200,
} as const;

export type ColourId = "sage" | "charcoal" | "cream" | "terracotta";
export const COLOURS: { id: ColourId; name: string; hex: string }[] = [
  { id: "sage", name: "Sage", hex: "#96A078" },
  { id: "charcoal", name: "Charcoal", hex: "#2B2B2B" },
  { id: "cream", name: "Cream", hex: "#EDE6D3" },
  { id: "terracotta", name: "Terracotta", hex: "#8C5A55" },
];
export const colourHex = (id: ColourId) => COLOURS.find((c) => c.id === id)!.hex;

export type Orientation = "standing" | "side";

/** A block in the room. Metres. x/z = footprint centre, y = bottom height. rotY in degrees. */
export interface PlacedBlock {
  id: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  orientation: Orientation;
  colour: ColourId;
  seat?: boolean;
}

export const M = { w: BLOCK.sizeCm.w / 100, d: BLOCK.sizeCm.d / 100, h: BLOCK.sizeCm.h / 100 };

/** Footprint (local x by local z) and height in metres. Lying on its side, the 60 cm edge runs along x. */
export function blockDims(o: Orientation) {
  return o === "standing" ? { fx: M.w, fz: M.d, h: M.h } : { fx: M.h, fz: M.d, h: M.w };
}

export const passportId = (n: number) => `#${String(n).padStart(4, "0")}`;

type Spec = Omit<PlacedBlock, "id">;
const withIds = (specs: Spec[]): PlacedBlock[] => specs.map((s, i) => ({ ...s, id: passportId(i + 1) }));
const r3 = (v: number) => Math.round(v * 1000) / 1000;

function listeningCircle(): PlacedBlock[] {
  const specs: Spec[] = [];
  const radius = 1.9;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    // Long edge tangent to the ring, openings facing the centre.
    specs.push({ x: r3(Math.cos(a) * radius), y: 0, z: r3(Math.sin(a) * radius), rotY: r3(90 - (a * 180) / Math.PI), orientation: "side", colour: "terracotta", seat: true });
  }
  specs.push({ x: 0, y: 0, z: 0, rotY: 0, orientation: "standing", colour: "charcoal" });
  specs.push({ x: 0, y: M.h, z: 0, rotY: 0, orientation: "standing", colour: "charcoal" });
  return withIds(specs);
}

function talkPanel(): PlacedBlock[] {
  const specs: Spec[] = [];
  for (let i = 0; i < 4; i++) specs.push({ x: r3((i - 1.5) * M.w), y: 0, z: -2.2, rotY: 0, orientation: "standing", colour: "charcoal" });
  for (let row = 0; row < 4; row++)
    for (let c = 0; c < 5; c++)
      specs.push({ x: r3((c - 2) * 0.9), y: 0, z: r3(-0.6 + row * 1.1), rotY: 0, orientation: "side", colour: "sage", seat: true });
  return withIds(specs);
}

function djStage(): PlacedBlock[] {
  const specs: Spec[] = [];
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 3; r++)
      specs.push({ x: r3((c - 1.5) * M.h), y: 0, z: r3((r - 1) * M.d), rotY: 0, orientation: "side", colour: "charcoal" });
  return withIds(specs);
}

function barCounter(): PlacedBlock[] {
  const specs: Spec[] = [];
  for (let level = 0; level < 2; level++)
    for (let c = 0; c < 5; c++)
      specs.push({ x: r3((c - 2) * M.w), y: r3(level * M.h), z: 0, rotY: 0, orientation: "standing", colour: level === 0 ? "terracotta" : "cream" });
  return withIds(specs);
}

function shelvingWall(): PlacedBlock[] {
  const specs: Spec[] = [];
  for (let level = 0; level < 4; level++)
    for (let c = 0; c < 5; c++)
      specs.push({ x: r3((c - 2) * M.w), y: r3(level * M.h), z: 0, rotY: 0, orientation: "standing", colour: (c + level) % 2 === 0 ? "cream" : "sage" });
  return withIds(specs);
}

export type LayoutId = "listening-circle" | "talk-panel" | "dj-stage" | "bar-counter" | "shelving-wall";
export interface Layout { id: LayoutId; name: string; summary: string; build: () => PlacedBlock[] }

export const LAYOUTS: Layout[] = [
  { id: "listening-circle", name: "Listening circle", summary: "16 seats in a ring around a DJ booth.", build: listeningCircle },
  { id: "talk-panel", name: "Talk & panel", summary: "20 seats in rows facing a panel table.", build: talkPanel },
  { id: "dj-stage", name: "DJ stage", summary: "A raised platform, 4 by 3 blocks.", build: djStage },
  { id: "bar-counter", name: "Bar counter", summary: "Two levels of five, 120 cm high.", build: barCounter },
  { id: "shelving-wall", name: "Shelving wall", summary: "5 wide by 4 high, openings to the front.", build: shelvingWall },
];
export const getLayout = (id: LayoutId) => LAYOUTS.find((l) => l.id === id)!;

/** Real-life pieces: small presets made of blocks. Positions relative to the piece centre. */
export type PieceId = "stool" | "side-table" | "bench" | "low-table" | "bar-table" | "lounge-corner" | "plinth" | "reception-desk";
export interface Piece { id: PieceId; name: string; use: string; build: () => Spec[] }
const side = (x: number, z: number, colour: ColourId = "sage", seat = true): Spec => ({ x: r3(x), y: 0, z: r3(z), rotY: 0, orientation: "side", colour, seat });
const stand = (x: number, y: number, z: number, colour: ColourId = "cream"): Spec => ({ x: r3(x), y: r3(y), z: r3(z), rotY: 0, orientation: "standing", colour });

export const PIECES: Piece[] = [
  { id: "stool", name: "Stool", use: "Extra seat at a talk", build: () => [side(0, 0, "terracotta")] },
  { id: "side-table", name: "Side table", use: "Next to a sofa", build: () => [stand(0, 0, 0, "charcoal")] },
  { id: "bench", name: "Bench", use: "Hallway, waiting area", build: () => [-1, 0, 1].map((i) => side(i * M.h, 0, "sage")) },
  { id: "low-table", name: "Low table", use: "Lounge, listening bar", build: () => [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([a, b]) => side(a! * M.h, b! * M.d, "cream", false)) },
  { id: "bar-table", name: "Bar table", use: "Standing table, 120 cm", build: () => [0, 1].flatMap((l) => [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([a, b]) => stand(a! * M.w, l * M.h, b! * M.d, l ? "cream" : "terracotta"))) },
  { id: "lounge-corner", name: "Lounge corner", use: "Corner of a coworking", build: () => [...[0, 1, 2, 3].map((i) => side(i * M.h, 0, "sage")), ...[1, 2, 3].map((i) => ({ ...side(-M.h / 2 + M.d / 2, M.d / 2 + (i - 0.5) * M.h, "sage"), rotY: 90 }))] },
  { id: "plinth", name: "Plinth", use: "Exhibition display", build: () => [stand(0, 0, 0, "cream"), stand(0, M.h, 0, "cream")] },
  { id: "reception-desk", name: "Reception desk", use: "Pop-up entrance", build: () => [0, 1].flatMap((l) => [-1, 0, 1].map((i) => stand(i * M.w, l * M.h, 0, l ? "cream" : "charcoal"))) },
];

export const KITS = [
  { id: "starter", name: "Starter kit", blocks: 20, rental: false },
  { id: "expansion", name: "Expansion pack", blocks: 5, rental: false },
  { id: "rental", name: "Event rental", blocks: null, rental: true },
] as const;

export interface Stats {
  count: number;
  perColour: Record<ColourId, number>;
  seats: number;
  weightKg: number;
  carbonKg: number;
  cropWasteKg: number;
  carKm: number;
  carMonths: number;
  priceEur: number;
}

/** Site-wide totals for a number of blocks, from calculateCarbon with the default assumptions. */
export function statsForCount(count: number) {
  const c = calculateCarbon(count);
  return {
    count,
    weightKg: r1(c.totalMass),
    carbonKg: r1(c.co2AvoidedKg),
    cropWasteKg: r1(c.cropWaste),
    carKm: Math.round(c.carKm),
    carMonths: c.carMonths,
    priceEur: count * BLOCK.priceEur,
  };
}

export function computeStats(blocks: Pick<PlacedBlock, "colour" | "seat">[]): Stats {
  const perColour = { sage: 0, charcoal: 0, cream: 0, terracotta: 0 } as Record<ColourId, number>;
  for (const b of blocks) perColour[b.colour]++;
  return { ...statsForCount(blocks.length), perColour, seats: blocks.filter((b) => b.seat).length };
}

/** Rounded display: "52" for 51.9, "430" for 433 km. */
export const fmtKg = (kg: number) => (kg >= 20 ? String(Math.round(kg)) : String(Math.round(kg * 10) / 10));
export const fmtEur = (n: number) => `${n.toLocaleString("en-US")} EUR`;
export const fmtKm = (km: number) => String(Math.round(km / 10) * 10);

// ---- Geometry checks (used by tests and by the twin) ----
function corners(b: PlacedBlock) {
  const { fx, fz } = blockDims(b.orientation);
  const t = (b.rotY * Math.PI) / 180;
  const c = Math.cos(t), s = Math.sin(t);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => {
    const lx = (i! * fx) / 2, lz = (j! * fz) / 2;
    return [b.x + lx * c + lz * s, b.z - lx * s + lz * c] as [number, number];
  });
}
function axes(p: [number, number][]) {
  return [0, 1].map((k) => { const a = p[k]!, b = p[k + 1]!; return [b[0] - a[0], b[1] - a[1]] as [number, number]; });
}
/** True when the two footprints overlap by more than a hair (touching is fine). */
export function footprintsOverlap(a: PlacedBlock, b: PlacedBlock, eps = 0.005) {
  const pa = corners(a), pb = corners(b);
  for (const [ax, az] of [...axes(pa), ...axes(pb)]) {
    const len = Math.hypot(ax, az), nx = ax / len, nz = az / len;
    const proj = (p: [number, number][]) => p.map(([x, z]) => x * nx + z * nz);
    const A = proj(pa), B = proj(pb);
    if (Math.min(Math.max(...A), Math.max(...B)) - Math.max(Math.min(...A), Math.min(...B)) <= eps) return false;
  }
  return true;
}
export const blockTop = (b: PlacedBlock) => b.y + blockDims(b.orientation).h;
export function blocksCollide(a: PlacedBlock, b: PlacedBlock) {
  const vertical = Math.min(blockTop(a), blockTop(b)) - Math.max(a.y, b.y) > 0.005;
  return vertical && footprintsOverlap(a, b);
}
/** Every block rests on the floor or on top of another block. */
export function isSupported(b: PlacedBlock, all: PlacedBlock[]) {
  if (b.y < 0.001) return true;
  return all.some((o) => o !== b && Math.abs(blockTop(o) - b.y) < 0.005 && footprintsOverlap(o, b));
}

/** Default room for the digital twin, metres. */
export const DEFAULT_ROOM = { w: 10, d: 9 };

/** Furniture for the /carbon room builder. Block counts estimated from the Verdelime brochure photos: update with real counts. */
export type FurnitureId = "sofa" | "armchair" | "sideShelf" | "lounge" | "stool" | "bookshelf";
export const FURNITURE: { id: FurnitureId; name: string; blocks: number }[] = [
  { id: "sofa", name: "Two-seat sofa", blocks: 20 },
  { id: "armchair", name: "Armchair", blocks: 6 },
  { id: "sideShelf", name: "Side shelf", blocks: 2 },
  { id: "lounge", name: "Lounge chair", blocks: 8 },
  { id: "stool", name: "Stool", blocks: 5 },
  { id: "bookshelf", name: "Bookshelf wall", blocks: 24 },
];
export const getFurniture = (id: FurnitureId) => FURNITURE.find((f) => f.id === id)!;

export interface RoomSet { id: string; name: string; items: { piece: FurnitureId; qty: number }[] }
export const ROOM_SETS: RoomSet[] = [
  { id: "living", name: "Living room", items: [{ piece: "sofa", qty: 1 }, { piece: "armchair", qty: 2 }, { piece: "sideShelf", qty: 1 }] },
  { id: "conference", name: "Conference room", items: [{ piece: "lounge", qty: 6 }, { piece: "stool", qty: 4 }, { piece: "sideShelf", qty: 2 }] },
  { id: "shelf", name: "Shelf", items: [{ piece: "bookshelf", qty: 1 }, { piece: "sideShelf", qty: 1 }] },
];
export const roomSetBlocks = (r: RoomSet) => r.items.reduce((s, i) => s + getFurniture(i.piece).blocks * i.qty, 0);

export const CARBON_EXAMPLES = [20, 50, 100];
export const LAB_PASSPORT = passportId(42);
/** Take-apart view, in order: whole block, exploded, raw materials. */
export const TAKE_APART_STAGES = [
  { name: "Whole block", text: "One piece, compression moulded. No screws, no glue, no hardware to lose." },
  { name: "Exploded", text: "The shell lifts away. Inside, the material is the same all the way through." },
  { name: "Raw materials", text: "Two ingredients. Biochar from crop residues, bound with kraft lignin from wood." },
] as const;
export const MAKING_STEPS = [
  { name: "Crop residues", text: "What fields leave behind becomes our starting material." },
  { name: "Biochar", text: "Heating the residues with little oxygen creates a carbon-rich material." },
  { name: "Milling and mixing", text: "Biochar is milled and mixed with kraft lignin, a plant-based binder." },
  { name: "Compression moulding", text: "The mixture is pressed into one hollow, repeatable shape." },
  { name: "Finishing", text: "Edges are finished. Each block receives its colour and passport." },
];
export const LIFE_CYCLE = ["Crop residues", "Biochar", "Furniture", "Rearrange & reuse", "Back to soil"];
export const TEAM = [
  { name: "Giulia Bacigalupi", role: "Design" },
  { name: "Leonie Pohl", role: "Sales" },
  { name: "Chang Liu", role: "Finance" },
  { name: "Margot Dehaene", role: "Sustainability compliance" },
  { name: "Hugues de Thoisy", role: "CFO" },
  { name: "Helmut Witten", role: "Chemical engineering" },
];
export const PROJECTS: { name: string; image: "festival" | "talk" | "exhibition" | "coworking"; layout: LayoutId; text: string }[] = [
  { name: "Outdoor festival", image: "festival", layout: "bar-counter", text: "A bar today. Seats for the next event." },
  { name: "Talk & panel", image: "talk", layout: "talk-panel", text: "A place to listen, meet and exchange ideas." },
  { name: "Exhibition opening", image: "exhibition", layout: "shelving-wall", text: "Display objects without building something disposable." },
  { name: "Coworking", image: "coworking", layout: "shelving-wall", text: "A room that changes with the people using it." },
];

/** Quantities for a kit are generated from the same reusable block specifications. */
export function kitBlocks(count: number): PlacedBlock[] {
  return Array.from({ length: count }, (_, i) => ({ ...side((i % 5 - 2) * M.h, Math.floor(i / 5) * M.d), id: passportId(i + 1) }));
}
