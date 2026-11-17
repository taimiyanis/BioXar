import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, accent, intro }: { eyebrow: string; title: string; accent?: string; intro?: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-10 md:grid-cols-[2fr_1fr] md:items-end md:px-8 md:pt-14">
      <div>
        <p className="font-label text-sm text-primary">{eyebrow}</p>
        <h1 className="mt-2 font-headline text-4xl sm:text-5xl md:text-6xl">
          {title}
          {accent && <span className="block text-primary">{accent}</span>}
        </h1>
      </div>
      {intro && <p className="text-lg text-foreground/90 md:text-right">{intro}</p>}
    </div>
  );
}

export function Section({ title, children, className, id }: { title?: string; children?: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("mx-auto max-w-7xl px-4 pt-14 md:px-8", className)}>
      {title && <h2 className="mb-5 font-headline text-2xl md:text-3xl">{title}</h2>}
      {children}
    </section>
  );
}

/** Phase 1 placeholder for a section that gets built later. */
export function Placeholder({ label, phase, className }: { label: string; phase: number; className?: string }) {
  return (
    <div className={cn("panel flex min-h-40 flex-col items-center justify-center gap-1 p-6 text-center", className)}>
      <p className="text-lg text-foreground">{label}</p>
      <p className="font-label text-sm text-primary">Built in phase {phase}</p>
    </div>
  );
}
