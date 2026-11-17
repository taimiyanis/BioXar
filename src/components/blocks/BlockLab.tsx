import { lazy, Suspense, useState } from "react";
import { BadgeCheck, Blend, Check, Flame, Layers, Wheat } from "lucide-react";
const STEP_ICONS = [Wheat, Flame, Blend, Layers, BadgeCheck];
import { ClientStage, StageLoader } from "@/components/three/Stage";
import { Button } from "@/components/ui/button";
import { BLOCK, COLOURS, LAB_PASSPORT, MAKING_STEPS, TAKE_APART_STAGES, fmtKg, statsForCount, type ColourId } from "@/data/bioxar";
import { cn } from "@/lib/utils";
const LabScene = lazy(() => import("./LabScene"));
const swatch = {
  sage: "bg-block-sage hover:bg-block-sage",
  charcoal: "bg-block-charcoal hover:bg-block-charcoal",
  cream: "bg-block-cream hover:bg-block-cream",
  terracotta: "bg-block-terracotta hover:bg-block-terracotta",
};
export function BlockLab() {
  const [colour, setColour] = useState<ColourId>("sage");
  const [apart, setApart] = useState(0);
  const [active, setActive] = useState(0);
  const [found, setFound] = useState<number[]>([]);
  const facts = [
    {
      name: "Dimensions",
      text: "Sized to sit on, carry and stack.",
      details: [
        `${BLOCK.sizeCm.w} × ${BLOCK.sizeCm.d} × ${BLOCK.sizeCm.h} cm outside.`,
        `Hole ${BLOCK.holeCm.w} × ${BLOCK.holeCm.h} cm at its narrowest, opening out at both faces.`,
        `On its side it is ${BLOCK.sizeCm.w} cm high: a seat. Standing it is ${BLOCK.sizeCm.h} cm: a side table.`,
      ],
    },
    {
      name: "Material",
      text: `${BLOCK.material}. Light, matte and speckled, like stone you can lift.`,
      details: [
        `${BLOCK.composition.biocharPct}% biochar and ${BLOCK.composition.binderPct}% kraft lignin binder.`,
        "No synthetic resin. The binder comes from plants.",
        "Each block has its own pattern of light and dark grains.",
      ],
    },
    {
      name: "Origin",
      text: `${BLOCK.origin}. A second life for what fields leave behind.`,
      details: [
        "Stalks, husks and straw are collected after harvest.",
        "They are heated with little oxygen to make biochar.",
        "The carbon the plants pulled from the air stays in the material.",
      ],
    },
    {
      name: "Carbon stored",
      text: `${BLOCK.carbonKgPerBlock} kg CO2e stored in every block.`,
      details: [
        `20 blocks store about ${fmtKg(statsForCount(20).carbonKg)} kg CO2e.`,
        "The carbon stays stored while the block is in use, and after.",
        "Prototype estimate. Lifecycle figures still need validation.",
      ],
    },
    {
      name: "Passport",
      text: `Every block has an ID. This one is ${LAB_PASSPORT}.`,
      details: [
        `${BLOCK.weightKg} kg. ${BLOCK.material}. ${BLOCK.origin}.`,
        "The ID follows the block from event to event.",
        `End of life: ${BLOCK.endOfLife.toLowerCase()}.`,
      ],
    },
  ];
  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative">
          <ClientStage className="h-[420px] sm:h-[520px]">
            <Suspense
              fallback={
                <div className="relative h-[420px] bg-stage">
                  <StageLoader />
                </div>
              }
            >
              <LabScene colour={colour} stage={apart} />
            </Suspense>
          </ClientStage>
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
            {COLOURS.map((c) => (
              <Button
                key={c.id}
                aria-label={c.name}
                title={c.name}
                onClick={() => setColour(c.id)}
                variant="outline"
                className={cn(
                  "size-11 rounded-full p-0",
                  swatch[c.id],
                  colour === c.id && "ring-2 ring-primary ring-offset-2 ring-offset-stage",
                )}
              >
                <span className="sr-only">{c.name}</span>
                {colour === c.id && <Check className="text-stage-foreground" />}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <p className="font-label text-primary">
            {found.length} of {facts.length} discovered
          </p>
          <div className="grid gap-2">
            {facts.map((fact, i) => (
              <Button
                key={fact.name}
                variant={active === i ? "default" : "secondary"}
                className="justify-between rounded-lg text-base"
                onClick={() => {
                  setActive(i);
                  setFound((a) => (a.includes(i) ? a : [...a, i]));
                }}
              >
                {fact.name}
                {found.includes(i) && <Check className="size-4" />}
              </Button>
            ))}
          </div>
          <div className="min-h-40">
            <p className="text-lg">{facts[active]?.text}</p>
            <ul className="mt-3 space-y-2">
              {facts[active]?.details.map((d) => (
                <li key={d} className="border-l-2 border-primary pl-3">{d}</li>
              ))}
            </ul>
          </div>
          {found.length === facts.length && (
            <div className="border-t border-primary pt-4">
              <p className="font-label text-primary">Block passport unlocked</p>
              <p className="mt-2">
                {LAB_PASSPORT} · {BLOCK.material} · {BLOCK.origin}
              </p>
              <p>
                {BLOCK.weightKg} kg · {BLOCK.carbonKgPerBlock} kg CO2e · {BLOCK.endOfLife}
              </p>
            </div>
          )}
          <div className="border-t border-border pt-4">
            <p className="font-label text-primary">Take it apart</p>
            <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Take it apart">
              {TAKE_APART_STAGES.map((t, i) => (
                <Button key={t.name} size="sm" variant={apart === i ? "default" : "secondary"} className="h-auto rounded-lg py-2 whitespace-normal" aria-pressed={apart === i} onClick={() => setApart(i)}>
                  {i + 1}. {t.name}
                </Button>
              ))}
            </div>
            <input aria-label="Take apart progress" type="range" min={0} max={TAKE_APART_STAGES.length - 1} value={apart} onChange={(e) => setApart(Number(e.target.value))} className="mt-3 w-full accent-primary" />
            <p className="mt-2">{TAKE_APART_STAGES[apart]?.text}</p>
            {apart === 2 && <p className="mt-2 text-primary">Biochar {BLOCK.composition.biocharKg} kg plus binder {BLOCK.composition.binderKg} kg make the {BLOCK.weightKg} kg block.</p>}
          </div>
        </div>
      </div>
      <div className="mt-14 border-y border-border py-8">
        <h2 className="font-headline text-3xl">How it’s made</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-5 md:gap-4">
          {MAKING_STEPS.map((s, i) => {
            const Icon = STEP_ICONS[i] ?? Layers;
            return (
              <li key={s.name} className="relative flex gap-4 md:flex-col">
                {i < MAKING_STEPS.length - 1 && (
                  <span aria-hidden className="absolute left-8 top-16 h-[calc(100%-2rem)] w-px bg-primary md:left-16 md:top-8 md:h-px md:w-[calc(100%-2rem)]" />
                )}
                <span className="relative z-10 flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card text-primary">
                  <Icon className="size-7" aria-hidden />
                </span>
                <div>
                  <p className="font-label text-primary">Step {i + 1}</p>
                  <h3 className="mt-1 font-headline text-xl">{s.name}</h3>
                  <p className="mt-2">{s.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
