import { RequestDialog } from "@/components/site/RequestDialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BLOCK, CARBON_EXAMPLES, carTime, COLOURS, computeStats, fmtEur, fmtKg, fmtKm, LAYOUTS, PIECES, statsForCount } from "@/data/bioxar";
import { outsideRoom } from "@/lib/twin/placement";
import { useTwin } from "@/lib/twin/store";
import { DECOR } from "@/lib/twin/decor";
import { cn } from "@/lib/utils";

const label = "font-label text-sm text-primary";

/** A number that counts to its new value with a small pulse. Instant when the user prefers reduced motion. */
export function CountUp({ value, format = (n) => String(Math.round(n)), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const [shown, setShown] = useState(value);
  const [pulse, setPulse] = useState(0);
  const current = useRef(value);
  useEffect(() => {
    const start = current.current;
    if (start === value) return;
    setPulse((p) => p + 1);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 500);
      const v = k === 1 ? value : start + (value - start) * (1 - (1 - k) ** 3);
      current.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span key={pulse} className={cn("inline-block tabular-nums", pulse > 0 && "count-pulse", className)}>{format(shown)}</span>;
}

const eur = (n: number) => fmtEur(Math.round(n));
const kg = (n: number) => fmtKg(n);

/** Compact totals for presentation mode: big enough to read from the back of a room. */
export function TotalsBar() {
  const blocks = useTwin((s) => s.blocks);
  const s = computeStats(blocks);
  const items: [string, number, (n: number) => string, string?][] = [
    ["Blocks", s.count, (n) => String(Math.round(n))],
    ["Seats", s.seats, (n) => String(Math.round(n))],
    ["Price to buy", s.priceEur, eur],
    ["Carbon stored", s.carbonKg, (n) => `≈${kg(n)}`, "kg CO2e"],
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([name, value, format, unit], i) => (
        <div key={name} className={cn("rounded-2xl px-4 py-2", i === 3 ? "bg-primary text-primary-foreground" : "panel")}>
          <dt className={cn("font-label text-xs sm:text-sm", i === 3 ? "text-primary-foreground/85" : "text-primary")}>{name}</dt>
          <dd className="whitespace-nowrap font-headline text-xl sm:text-4xl"><CountUp value={value} format={format} />{unit && <span className="ml-1 text-xs sm:ml-1.5 sm:text-xl">{unit}</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LeftPanel() {
  const { layoutId, mode, colour, orientation, tool, addKind, loadLayout, addPiece, set, recolourSelected, toggleOrientation, clear } = useTwin();
  const tab = mode === "play" ? "play" : "scenarios";
  return (
    <Tabs defaultValue={tab} key={tab} className="panel p-4" onValueChange={(v) => v === "play" && set({ mode: "play" })}>
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-full bg-secondary p-1">
        <TabsTrigger value="scenarios" className="min-w-0 rounded-full px-1 py-2 font-label text-xs tracking-normal text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Scenarios</TabsTrigger>
        <TabsTrigger value="pieces" className="min-w-0 rounded-full px-1 py-2 font-label text-xs tracking-normal text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Pieces</TabsTrigger>
        <TabsTrigger value="play" className="min-w-0 rounded-full px-1 py-2 font-label text-xs tracking-normal text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Play</TabsTrigger>
      </TabsList>
      <TabsContent value="scenarios" className="mt-4 space-y-2">
        {LAYOUTS.map((l) => {
          const s = computeStats(l.build());
          const active = layoutId === l.id;
          return (
            <button key={l.id} onClick={() => loadLayout(l.id)} className={cn("w-full rounded-2xl border p-3 text-left transition-colors", active ? "border-primary bg-primary/15" : "border-border hover:bg-secondary")}>
              <span className="block font-label text-sm text-foreground">{l.name}</span>
              <span className="block text-base text-foreground/90">{s.count} blocks{s.seats ? ` · ${s.seats} seats` : ""}</span>
              <span className="block text-sm text-foreground/80">{l.summary}</span>
            </button>
          );
        })}
      </TabsContent>
      <TabsContent value="pieces" className="mt-4 space-y-2">
        <p className="text-base text-foreground/90">What can I build? Add a ready piece to your room.</p>
        {PIECES.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
            <div className="min-w-0 flex-1">
              <span className="block font-label text-sm text-foreground">{p.name}</span>
              <span className="block text-sm text-foreground/85">{p.build().length} {p.build().length === 1 ? "block" : "blocks"} · {p.use}</span>
            </div>
            <Button size="sm" className="font-label rounded-full" onClick={() => addPiece(p.id)}>Add</Button>
          </div>
        ))}
      </TabsContent>
      <TabsContent value="play" className="mt-4 space-y-5">
        <div>
          <p className={label}>Tool</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["add", "select"] as const).map((t) => (
              <Button key={t} variant={tool === t && (t === "select" || addKind === "block") ? "default" : "secondary"} className="font-label rounded-full" onClick={() => set({ tool: t, mode: "play", ...(t === "add" ? { addKind: "block" as const } : {}) })}>{t === "add" ? "Add block" : "Select"}</Button>
            ))}
          </div>
          <p className="mt-2 text-sm text-foreground/85">{tool === "add" && addKind !== "block" ? "Click the floor or the top of a block to place it. R turns it." : tool === "add" ? "Move over the floor and click to place. Aim at the top or a side of a block to line up with its edge or centre." : "Click a block to see its passport, then edit it."}</p>
        </div>
        <div>
          <p className={label}>Colour</p>
          <div className="mt-2 flex gap-2">
            {COLOURS.map((c) => (
              <button key={c.id} aria-label={c.name} title={c.name} onClick={() => recolourSelected(c.id)} className={cn("size-10 rounded-full border-2", colour === c.id ? "border-primary ring-2 ring-primary/40" : "border-border")} style={{ background: c.hex }} />
            ))}
          </div>
        </div>
        <div>
          <p className={label}>Position</p>
          <Button variant="secondary" className="mt-2 w-full font-label rounded-full" onClick={toggleOrientation}>{orientation === "side" ? "On its side (seat)" : "Standing"}</Button>
        </div>
        <div>
          <p className={label}>Objects for scale</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DECOR.map((d) => (
              <Button key={d.id} size="sm" variant={tool === "add" && addKind === d.id ? "default" : "secondary"} className="font-label rounded-full" onClick={() => set({ tool: "add", addKind: d.id, mode: "play" })}>{d.name}</Button>
            ))}
          </div>
          <p className="mt-2 text-sm text-foreground/85">Not counted in blocks, price or carbon.</p>
        </div>
        <Button variant="outline" className="w-full font-label rounded-full" onClick={clear}>Start from empty</Button>
      </TabsContent>
    </Tabs>
  );
}

export function RoomControls() {
  const room = useTwin((s) => s.room);
  const setRoom = useTwin((s) => s.setRoom);
  const field = (k: "w" | "d", name: string) => (
    <label className="flex items-center gap-2">
      <span className="font-label text-sm text-primary">{name}</span>
      <input type="number" min={2} max={40} step={0.5} value={room[k]} onChange={(e) => { const v = Math.min(40, Math.max(2, Number(e.target.value) || 2)); setRoom({ ...room, [k]: v }); }} className="w-16 rounded-full border border-border bg-background px-2 py-1 text-center text-sm text-foreground" />
      <span className="text-sm text-foreground/85">m</span>
    </label>
  );
  return <div className="flex flex-wrap items-center gap-3">{field("w", "Width")}{field("d", "Depth")}</div>;
}

export function useOutside() {
  const blocks = useTwin((s) => s.blocks);
  const room = useTwin((s) => s.room);
  return useMemo(() => blocks.filter((b) => outsideRoom(b, room)).length, [blocks, room]);
}

export function SetupPanel() {
  const blocks = useTwin((s) => s.blocks);
  const selectedId = useTwin((s) => s.selectedId);
  const s = computeStats(blocks);
  const sel = blocks.find((b) => b.id === selectedId);
  return (
    <aside className="panel space-y-5 p-5">
      <div>
        <p className={label}>Your setup</p>
        <p className="mt-1 font-headline text-4xl"><CountUp value={s.count} /> <span className="text-2xl">blocks</span></p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-base">
          <div><dt className="font-label text-sm text-primary">Seats</dt><dd><CountUp value={s.seats} /></dd></div>
          <div><dt className="font-label text-sm text-primary">Weight</dt><dd><CountUp value={s.weightKg} format={(n) => String(Math.round(n * 10) / 10)} /> kg</dd></div>
          <div className="col-span-2"><dt className="font-label text-sm text-primary">Price to buy</dt><dd><CountUp value={s.priceEur} format={eur} /></dd></div>
          <div className="col-span-2"><dt className="font-label text-sm text-primary">Crop waste used</dt><dd><CountUp value={s.cropWasteKg} format={(n) => String(Math.round(n))} /> kg</dd></div>
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          {COLOURS.filter((c) => s.perColour[c.id]).map((c) => (
            <span key={c.id} className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm"><span className="size-3 rounded-full" style={{ background: c.hex }} />{c.name} {s.perColour[c.id]}</span>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
        <p className="font-label text-sm text-primary-foreground/85">Carbon stored</p>
        <p className="mt-1 font-headline text-3xl">≈<CountUp value={s.carbonKg} format={kg} /> kg CO2e</p>
        <p className="text-base">Like an average car not driving for {s.count ? carTime(s.carbonKg) : "0 days"} (<CountUp value={s.carKm} format={fmtKm} /> km).</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {CARBON_EXAMPLES.map((n) => { const t = statsForCount(n); return (
          <div key={n} className="rounded-2xl border border-border p-2"><p className="font-headline text-xl">{n}</p><p className="text-sm">{fmtKg(t.carbonKg)} kg</p><p className="text-sm text-foreground/85">{fmtKm(t.carKm)} km</p></div>
        ); })}
      </div>
      <div className="rounded-2xl border border-border p-4">
        <p className={label}>Block passport</p>
        {sel ? (
          <dl className="mt-2 space-y-1 text-base">
            <div className="flex justify-between"><dt>ID</dt><dd className="font-label">{sel.id}</dd></div>
            <div className="flex justify-between"><dt>Colour</dt><dd>{COLOURS.find((c) => c.id === sel.colour)?.name ?? sel.colour}</dd></div>
            <div className="flex justify-between"><dt>Position</dt><dd>{sel.orientation === "side" ? "On its side" : "Standing"}</dd></div>
            <div className="flex justify-between"><dt>Material</dt><dd>{BLOCK.material}</dd></div>
            <div className="flex justify-between"><dt>Origin</dt><dd>{BLOCK.origin}</dd></div>
            <div className="flex justify-between"><dt>Carbon stored</dt><dd>{BLOCK.carbonKgPerBlock} kg CO2e</dd></div>
            <div className="flex justify-between"><dt>Weight</dt><dd>{BLOCK.weightKg} kg</dd></div>
            <div className="flex justify-between"><dt>End of life</dt><dd>{BLOCK.endOfLife}</dd></div>
          </dl>
        ) : <p className="mt-2 text-base text-foreground/90">Click any block to open its passport.</p>}
      </div>
      <div className="grid gap-2">
        <RequestDialog intent="rent"><Button className="font-label rounded-full">Rent for an event</Button></RequestDialog>
        <RequestDialog intent="buy"><Button variant="secondary" className="font-label rounded-full">Buy this set</Button></RequestDialog>
      </div>
    </aside>
  );
}
