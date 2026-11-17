import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Section } from "@/components/site/Section";
import { RoomBuilder } from "@/components/carbon/RoomBuilder";
import { fmtNum } from "@/components/carbon/format";
import { Button } from "@/components/ui/button";
import { CARBON_DEFAULTS, calculateCarbon, carTime, type CarbonAssumptions } from "@/data/bioxar";

const description =
  "Pick 1 to 100 BioXar blocks and see the volume, crop waste, CO2 not emitted and carbon certificates they add up to.";

export const Route = createFileRoute("/carbon")({
  head: () => ({
    meta: [
      { title: "How we count carbon | BioXar" },
      { name: "description", content: description },
      { property: "og:title", content: "How we count carbon | BioXar" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CarbonPage,
});

const PRESETS = [1, 10, 18, 20, 50, 100];
const TABLE_COUNTS = [1, 10, 20, 50, 100];

function CarbonPage() {
  const [blocks, setBlocks] = useState(18);
  const [a, setA] = useState<CarbonAssumptions>(CARBON_DEFAULTS);
  const r = useMemo(() => calculateCarbon(blocks, a), [blocks, a]);
  const table = useMemo(() => TABLE_COUNTS.map((n) => calculateCarbon(n, a)), [a]);
  const set = (k: keyof CarbonAssumptions, v: number) => setA((p) => ({ ...p, [k]: v }));

  return (
    <>
      <PageHeader
        eyebrow="Carbon"
        title="How we count carbon."
        intro="Pick 1 to 100 blocks. See the crop waste turned into biochar, the CO2 not emitted and the certificates it adds up to."
      />

      <Section>
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="panel p-5 md:p-8">
            <p className="font-label text-sm text-primary">Number of blocks</p>
            <p className="mt-2 flex items-end gap-3">
              <span className="font-headline text-7xl md:text-8xl">{blocks}</span>
              <span className="mb-2 text-lg">BioXar blocks</span>
            </p>
            <input
              aria-label="Number of blocks"
              type="range"
              min={1}
              max={100}
              value={blocks}
              onChange={(e) => setBlocks(Number(e.target.value))}
              className="mt-4 w-full accent-primary"
            />
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Presets">
              {PRESETS.map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant={n === blocks ? "default" : "secondary"}
                  className="rounded-full px-4"
                  aria-pressed={n === blocks}
                  onClick={() => setBlocks(n)}
                >
                  {n}
                </Button>
              ))}
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
              <Stat label="Total mass" value={`${fmtNum(r.totalMass, 0)} kg`} />
              <Stat label="Volume per block" value={`${fmtNum(r.volumePerBlockL)} L`} sub={`${fmtNum(r.volumePerBlockM3, 3)} m³`} />
              <Stat label="Total volume" value={`${fmtNum(r.totalVolumeM3, 2)} m³`} />
              <Stat label="Biochar in blocks" value={`${fmtNum(r.biochar)} kg`} />
              <Stat label="Crop waste used" value={`${fmtNum(r.cropWaste)} kg`} sub="dry crop residues" />
              <Stat label="CO2 per block" value={`${fmtNum(r.co2PerBlockKg, 2)} kg`} />
            </dl>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-[var(--radius)] bg-primary p-5 text-primary-foreground md:p-8">
              <p className="font-label text-sm text-primary-foreground/85">CO2 not emitted</p>
              <p className="mt-2 font-headline text-5xl md:text-6xl">
                ≈{fmtNum(r.co2AvoidedKg)}
                <span className="ml-2 whitespace-nowrap font-sans text-lg font-semibold normal-case md:text-xl">kg CO2e</span>
              </p>
              <p className="mt-3 text-base">
                Like an average car not driving for ≈{carTime(r.co2AvoidedKg, a)} ({fmtNum(r.carKm, 0)} km).
              </p>
              <p className="text-sm text-primary-foreground/85">One block ≈{carTime(r.co2PerBlockKg, a)} of driving.</p>
            </div>
            <div className="panel p-5 md:p-8">
              <p className="font-label text-sm text-primary">Carbon certificates</p>
              <p className="mt-2 font-headline text-5xl">{fmtNum(r.certificates, 3)}</p>
              <p className="text-sm text-foreground/85">certificates (1 = 1 tonne CO2e)</p>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-sm text-foreground/85">Estimated value</dt>
                  <dd className="text-lg font-semibold">{fmtNum(r.value, 2)} EUR</dd>
                </div>
                <div>
                  <dt className="text-sm text-foreground/85">Blocks for 1 certificate</dt>
                  <dd className="text-lg font-semibold">{r.blocksPerCertificate}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
          <div className="panel p-5 md:p-8">
            <h2 className="font-headline text-2xl">Assumptions</h2>
            <p className="mt-2 text-sm text-foreground/85">Edit to adjust. The rest of the site uses the default values.</p>
            <div className="mt-4 space-y-3">
              <Field label="Mass per block (kg)" value={a.massKg} step={0.1} onChange={(v) => set("massKg", v)} />
              <Field label="Nominal density (kg/m³)" value={a.densityKgM3} step={1} onChange={(v) => set("densityKgM3", v)} />
              <Field label="CO2 not emitted per kg (kg)" value={a.co2PerKg} step={0.001} onChange={(v) => set("co2PerKg", v)} />
              <Field label="Biochar share of block (%)" value={+(a.biocharShare * 100).toFixed(1)} step={1} onChange={(v) => set("biocharShare", v / 100)} />
              <Field label="Biochar yield from crop waste (%)" value={+(a.pyrolysisYield * 100).toFixed(1)} step={1} onChange={(v) => set("pyrolysisYield", v / 100)} />
              <Field label="Certificate price (EUR per t)" value={a.pricePerTonne} step={5} onChange={(v) => set("pricePerTonne", v)} />
              <Field label="Car emissions (kg CO2 per km)" value={a.carKgPerKm} step={0.01} onChange={(v) => set("carKgPerKm", v)} />
              <Field label="Car km driven per year" value={a.carKmPerYear} step={500} onChange={(v) => set("carKmPerYear", v)} />
            </div>
          </div>
          <div className="panel min-w-0 p-5 md:p-8">
            <h2 className="font-headline text-2xl">Quick comparison</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-base">
                <thead className="font-label text-sm text-primary">
                  <tr>
                    <th className="py-2 pr-3 font-[inherit]">Blocks</th>
                    <th className="pr-3 font-[inherit]">Volume</th>
                    <th className="pr-3 font-[inherit]">Crop waste</th>
                    <th className="pr-3 font-[inherit]">CO2 not emitted</th>
                    <th className="pr-3 font-[inherit]">Certificates</th>
                    <th className="font-[inherit]">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((t) => (
                    <tr key={t.blocks} className="border-t border-border">
                      <td className="py-2.5 pr-3 font-semibold">{t.blocks}</td>
                      <td className="pr-3">{fmtNum(t.totalVolumeM3, 2)} m³</td>
                      <td className="pr-3">{fmtNum(t.cropWaste, 0)} kg</td>
                      <td className="pr-3 text-primary">{fmtNum(t.co2AvoidedKg)} kg</td>
                      <td className="pr-3">{fmtNum(t.certificates, 3)}</td>
                      <td>{fmtNum(t.value, 2)} EUR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-foreground/85">
              Estimates only. CO2 uses {a.co2PerKg} kg CO2 not emitted per kg of block. Crop waste assumes the block is{" "}
              {fmtNum(a.biocharShare * 100, 0)}% biochar and pyrolysis turns {fmtNum(a.pyrolysisYield * 100, 0)}% of dry crop
              waste into biochar. Certificates follow carbon-removal registries (1 credit = 1 t CO2e). Real certificates need
              verification by a registry such as Puro.earth or EBC.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Build a room" className="pb-16">
        <RoomBuilder a={a} />
      </Section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <dt className="font-label text-xs text-primary">{label}</dt>
      <dd className="mt-1 text-xl font-semibold">{value}</dd>
      {sub && <dd className="text-sm text-foreground/85">{sub}</dd>}
    </div>
  );
}

function Field({ label, value, step, onChange }: { label: string; value: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 border-b border-border pb-3 text-base">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        min={0}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-28 shrink-0 rounded-lg border border-input bg-background px-3 py-1.5 text-right text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
