import { create } from "zustand";
import { getLayout, type ColourId, type LayoutId, type Orientation, type PlacedBlock } from "@/data/bioxar";
import { DEFAULT_ROOM } from "@/data/bioxar";
import { nextId, placePiece, restingY, settle, type Room } from "./placement";
import { PIECES, type PieceId } from "@/data/bioxar";
import { decorRestY, nextDecorId, type DecorItem, type DecorKind } from "./decor";

export type Mode = "scenario" | "play";
export type Tool = "select" | "add";
export type View = "3d" | "top" | "walk";
/** What the Add tool places: a BioXar block or an everyday object. */
export type AddKind = "block" | DecorKind;
type Snapshot = { blocks: PlacedBlock[]; decor: DecorItem[] };

interface TwinState {
  blocks: PlacedBlock[];
  decor: DecorItem[];
  layoutId: LayoutId | null;
  mode: Mode;
  tool: Tool;
  addKind: AddKind;
  colour: ColourId;
  orientation: Orientation;
  ghostRot: number;
  room: Room;
  selectedId: string | null;
  view: View;
  past: Snapshot[];
  future: Snapshot[];
  loadLayout: (id: LayoutId) => void;
  loadDesign: (blocks: PlacedBlock[], room: Room, layoutId?: LayoutId | null, decor?: DecorItem[]) => void;
  set: (p: Partial<Pick<TwinState, "mode" | "tool" | "addKind" | "colour" | "orientation" | "view" | "selectedId">>) => void;
  setRoom: (room: Room) => void;
  addBlock: (b: Omit<PlacedBlock, "id">) => void;
  addDecor: (d: Omit<DecorItem, "id" | "y">) => void;
  addPiece: (id: PieceId) => void;
  deleteSelected: () => void;
  rotate: () => void;
  toggleOrientation: () => void;
  recolourSelected: (c: ColourId) => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
}

/** Objects follow the blocks under them (or drop to the floor when a block is removed). */
const restDecor = (decor: DecorItem[], blocks: PlacedBlock[]) => decor.map((d) => ({ ...d, y: decorRestY(d.x, d.z, blocks) }));
const isDecor = (id: string | null) => !!id && id.startsWith("d");

export const useTwin = create<TwinState>((set, get) => {
  const snap = (): Snapshot => ({ blocks: get().blocks, decor: get().decor });
  const commit = (blocks: PlacedBlock[], extra: Partial<TwinState> = {}, decor = get().decor) =>
    set((s) => ({ blocks, decor: restDecor(decor, blocks), past: [...s.past, snap()].slice(-100), future: [], layoutId: null, mode: "play", ...extra }));
  const editSelected = (fn: (b: PlacedBlock) => PlacedBlock) => {
    const { blocks, selectedId } = get();
    if (!selectedId || isDecor(selectedId)) return false;
    commit(settle(blocks.map((b) => (b.id === selectedId ? fn(b) : b))));
    return true;
  };
  return {
    blocks: getLayout("listening-circle").build(),
    decor: [],
    layoutId: "listening-circle",
    mode: "scenario",
    tool: "select",
    addKind: "block",
    colour: "terracotta",
    orientation: "side",
    ghostRot: 0,
    room: DEFAULT_ROOM,
    selectedId: null,
    view: "3d",
    past: [],
    future: [],
    loadLayout: (id) => set((s) => ({ blocks: getLayout(id).build(), decor: [], layoutId: id, mode: "scenario", selectedId: null, past: [...s.past, snap()].slice(-100), future: [] })),
    loadDesign: (blocks, room, layoutId = null, decor = []) => set({ blocks, decor, room, layoutId, mode: layoutId ? "scenario" : "play", selectedId: null, past: [], future: [] }),
    set: (p) => set(p),
    setRoom: (room) => set({ room }),
    addBlock: (b) => {
      const { blocks } = get();
      const nb = { ...b, id: nextId(blocks) };
      nb.y = restingY(nb, blocks);
      commit([...blocks, nb], { selectedId: nb.id });
    },
    addDecor: (d) => {
      const { blocks, decor } = get();
      const item: DecorItem = { ...d, id: nextDecorId(decor), y: 0 };
      commit(blocks, { selectedId: item.id }, [...decor, item]);
    },
    addPiece: (id) => {
      const { blocks, room } = get();
      const piece = PIECES.find((p) => p.id === id)!;
      const added = placePiece(piece.build(), blocks, room);
      commit(settle([...blocks, ...added]), { selectedId: added[0]?.id ?? null, tool: "select" });
    },
    deleteSelected: () => {
      const { blocks, decor, selectedId } = get();
      if (!selectedId) return;
      if (isDecor(selectedId)) return commit(blocks, { selectedId: null }, decor.filter((d) => d.id !== selectedId));
      commit(settle(blocks.filter((b) => b.id !== selectedId)), { selectedId: null });
    },
    rotate: () => {
      const { tool, blocks, decor, selectedId } = get();
      if (tool === "add") return set((s) => ({ ghostRot: (s.ghostRot + 90) % 360 }));
      if (isDecor(selectedId)) return commit(blocks, {}, decor.map((d) => (d.id === selectedId ? { ...d, rotY: (d.rotY + 90) % 360 } : d)));
      editSelected((b) => ({ ...b, rotY: (b.rotY + 90) % 360 }));
    },
    toggleOrientation: () => {
      if (get().tool === "add") return set((s) => ({ orientation: s.orientation === "side" ? "standing" : "side" }));
      editSelected((b) => {
        const orientation: Orientation = b.orientation === "side" ? "standing" : "side";
        const { seat: _s, ...rest } = b;
        return orientation === "side" ? { ...rest, orientation, seat: true } : { ...rest, orientation };
      });
    },
    recolourSelected: (c) => {
      set({ colour: c });
      editSelected((b) => ({ ...b, colour: c }));
    },
    clear: () => commit([], { selectedId: null, tool: "add", addKind: "block" }, []),
    undo: () => set((s) => (s.past.length ? { ...s.past[s.past.length - 1]!, past: s.past.slice(0, -1), future: [snap(), ...s.future], selectedId: null } : s)),
    redo: () => set((s) => (s.future.length ? { ...s.future[0]!, future: s.future.slice(1), past: [...s.past, snap()], selectedId: null } : s)),
  };
});

export const STORAGE_KEY = "bioxar-twin-v1";
