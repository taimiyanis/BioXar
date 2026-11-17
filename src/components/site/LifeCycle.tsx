import { ArrowRight } from "lucide-react";
import { LIFE_CYCLE } from "@/data/bioxar";
export function LifeCycle() {
  return (
    <ol className="grid gap-4 sm:grid-cols-5">
      {LIFE_CYCLE.map((step, i) => (
        <li key={step} className="border-t border-primary pt-4">
          <span className="font-label text-primary">0{i + 1}</span>
          <p className="mt-3 flex items-center justify-between gap-2 text-lg">
            {step}
            {i < LIFE_CYCLE.length - 1 && <ArrowRight className="size-5 shrink-0 text-primary" />}
          </p>
        </li>
      ))}
    </ol>
  );
}
