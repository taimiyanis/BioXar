import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ClientStage, StageLoader } from "@/components/three/Stage";
import { computeStats, fmtKg, fmtKm, getLayout } from "@/data/bioxar";
const StoryScene = lazy(() => import("@/components/three/StoryScene"));
export function ScrollStory() {
  const [step, setStep] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const stats = computeStats(getLayout("listening-circle").build());
  const steps = [
    { label: "Shape", title: "Start with one block.", text: "Hollow, simple, open. Everything else is built from it." },
    { label: "Material", title: "Grown, not mined.", text: "Leftover crop residues become biochar. Plant-based lignin holds it together." },
    { label: "Spaces", title: "Rebuild every week.", text: "Coworking on Monday. A bar on Friday. A listening circle on Saturday." },
    { label: "Carbon", title: "Every seat stores carbon.", text: `A ${stats.count}-block circle keeps about ${fmtKg(stats.carbonKg)} kg CO2e out of the air. Like skipping ${fmtKm(stats.carKm)} km by car.` },
  ];
  useEffect(() => {
    const nodes = wrap.current?.querySelectorAll("[data-story-step]");
    if (!nodes) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset["storyStep"]));
      },
      { rootMargin: "-25% 0px -25% 0px", threshold: 0.15 },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={wrap} className="relative mt-16 grid lg:grid-cols-2">
      <div className="story-stage sticky top-4 h-[38vh] min-h-64 self-start lg:top-20 lg:h-[calc(100vh-6rem)]">
        <ClientStage className="h-full">
          <Suspense fallback={<StageLoader />}>
            <StoryScene step={step} />
          </Suspense>
        </ClientStage>
        <ol aria-label="Story progress" className="absolute inset-x-4 bottom-2 z-10 flex gap-1.5 lg:inset-x-8 lg:bottom-4">
          {steps.map((s, i) => (
            <li key={s.label} className="flex-1">
              <button
                type="button"
                aria-label={`Go to step ${i + 1}: ${s.label}`}
                aria-current={i === step ? "step" : undefined}
                onClick={() => wrap.current?.querySelector(`[data-story-step="${i}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="group block w-full py-2 text-left"
              >
                <span className={`block h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-foreground/25"}`} />
                <span className={`mt-2 hidden font-label text-sm lg:block ${i === step ? "text-primary" : "text-foreground"}`}>{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div>
        {steps.map((s, i) => (
          <section
            key={s.title}
            data-story-step={i}
            className="flex min-h-[55vh] flex-col justify-center px-6 py-16 lg:min-h-[90vh] lg:px-12"
          >
            <p className="font-label text-primary">0{i + 1} / 0{steps.length} · {s.label}</p>
            <h2 className="mt-4 font-headline text-4xl sm:text-5xl">{s.title}</h2>
            <p className="mt-5 max-w-lg text-xl">{s.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
