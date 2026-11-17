import { BLOCK } from "@/data/bioxar";

export function SpecTable() {
  const c = BLOCK.composition;
  const rows: [string, string][] = [
    ["Outer size", `${BLOCK.sizeCm.w} x ${BLOCK.sizeCm.d} x ${BLOCK.sizeCm.h} cm`],
    ["Hole (narrowest)", `${BLOCK.holeCm.w} x ${BLOCK.holeCm.h} cm`],
    ["Weight", `${BLOCK.weightKg} kg`],
    ["Composition", `Biochar ${c.biocharKg} kg (${c.biocharPct}%), binder ${c.binderKg} kg (${c.binderPct}%)`],
    ["Material", BLOCK.material],
    ["Origin", BLOCK.origin],
    ["Carbon stored", `${BLOCK.carbonKgPerBlock} kg CO2e per block`],
    ["End of life", BLOCK.endOfLife],
    ["Price", `${BLOCK.priceEur} EUR per block`],
  ];
  return (
    <dl className="panel divide-y divide-border">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[1fr_1.4fr] gap-4 px-5 py-4 text-base">
          <dt className="font-label text-sm text-primary">{k}</dt>
          <dd className="text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
