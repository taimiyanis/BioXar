import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import armchair from "@/assets/furniture/armchair.jpg";
import bookshelf from "@/assets/furniture/bookshelf.jpg";
import lounge from "@/assets/furniture/lounge-chair.jpg";
import sideShelf from "@/assets/furniture/side-shelf.jpg";
import sofa from "@/assets/furniture/sofa.jpg";
import stool from "@/assets/furniture/stool.jpg";
import { Button } from "@/components/ui/button";
import {
  calculateCarbon,
  carTime,
  FURNITURE,
  getFurniture,
  ROOM_SETS,
  roomSetBlocks,
  type CarbonAssumptions,
  type FurnitureId,
} from "@/data/bioxar";
import { cn } from "@/lib/utils";
import { fmtNum } from "./format";

const PHOTOS: Record<FurnitureId, string> = { sofa, armchair, sideShelf, lounge, stool, bookshelf };

/** Pick furniture made of blocks and see the carbon live. */
export function RoomBuilder({ a }: { a: CarbonAssumptions }) {
  const [qty, setQty] = useState<Partial<Record<FurnitureId, number>>>({});
  const total = FURNITURE.reduce((s, f) => s + f.blocks * (qty[f.id] ?? 0), 0);
  const r = calculateCarbon(total, a);
  const change = (id: FurnitureId, d: number) => setQty((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) + d) }));
  const addSet = (id: string) => {
    const set = ROOM_SETS.find((x) => x.id === id);
    if (!set) return;
    setQty((p) => {
      const n = { ...p };
      for (const i of set.items) n[i.piece] = (n[i.piece] ?? 0) + i.qty;
      return n;
    });
  };

  return (
    <div className="panel p-5 md:p-8">
      <p className="max-w-2xl text-lg">Start from a room, or tap furniture to add it. The carbon updates as you go.</p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {ROOM_SETS.map((set) => (
          <button
            key={set.id}
            type="button"
            onClick={() => addSet(set.id)}
            className="rounded-2xl border border-border p-4 text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="font-label block text-primary">{set.name}</span>
            <span className="mt-1 block text-sm text-foreground/85">
              {set.items.map((i) => `${i.qty} x ${getFurniture(i.piece).name}`).join(", ")}
            </span>
            <span className="mt-2 block">{roomSetBlocks(set)} blocks, tap to add</span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {FURNITURE.map((f) => {
          const q = qty[f.id] ?? 0;
          return (
            <div key={f.id} className={cn("overflow-hidden rounded-2xl border-2", q ? "border-primary" : "border-border")}>
              <button type="button" onClick={() => change(f.id, 1)} className="block w-full bg-stage" aria-label={`Add ${f.name}`}>
                <img src={PHOTOS[f.id]} alt={`${f.name} made of BioXar blocks`} loading="lazy" className="aspect-[4/3] w-full object-contain" />
              </button>
              <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{f.name}</p>
                  <p className="text-sm text-foreground/85">{f.blocks} blocks</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" size="icon" variant="secondary" className="size-8 rounded-full" onClick={() => change(f.id, -1)} disabled={!q} aria-label={`Remove one ${f.name}`}>
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-6 text-center font-semibold" aria-live="polite">{q}</span>
                  <Button type="button" size="icon" className="size-8 rounded-full" onClick={() => change(f.id, 1)} aria-label={`Add one ${f.name}`}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-lg">
          Selected: <span className="font-headline text-2xl">{total}</span> blocks
        </p>
        <Button type="button" variant="secondary" className="rounded-full" onClick={() => setQty({})} disabled={!total}>
          Clear
        </Button>
      </div>

      <dl className="mt-4 grid gap-4 rounded-2xl bg-primary p-5 text-primary-foreground sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">
        <div>
          <dt className="font-label text-sm text-primary-foreground/85">CO2 not emitted</dt>
          <dd className="font-headline text-3xl">{fmtNum(r.co2AvoidedKg)} kg</dd>
        </div>
        <div>
          <dt className="font-label text-sm text-primary-foreground/85">Like not driving</dt>
          <dd className="font-headline text-3xl">{total ? carTime(r.co2AvoidedKg, a) : "0 days"}</dd>
          <dd className="text-sm">≈ {fmtNum(r.carKm, 0)} km by car</dd>
        </div>
        <div>
          <dt className="font-label text-sm text-primary-foreground/85">Certificates</dt>
          <dd className="font-headline text-3xl">{fmtNum(r.certificates, 3)}</dd>
          <dd className="text-sm">≈ {fmtNum(r.value, 2)} EUR</dd>
        </div>
        <div>
          <dt className="font-label text-sm text-primary-foreground/85">One block alone</dt>
          <dd className="font-headline text-3xl">{fmtNum(r.co2PerBlockKg, 2)} kg</dd>
          <dd className="text-sm">≈ {carTime(r.co2PerBlockKg, a)} of driving</dd>
        </div>
      </dl>
    </div>
  );
}
