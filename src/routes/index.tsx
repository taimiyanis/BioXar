import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Camera, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/site/Section";
import { ScrollStory } from "@/components/site/ScrollStory";
import { LifeCycle } from "@/components/site/LifeCycle";
import { LAYOUT_THUMBS, LayoutPreview } from "@/components/site/LayoutPreview";
import { computeStats, fmtKg, getLayout, LAYOUTS } from "@/data/bioxar";
import hero from "@/assets/block-hero-transparent.png";
import festival from "@/assets/outdoor-festival.jpg";
import colours from "@/assets/block-colours-transparent.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BioXar | Designed to be rearranged" },
      {
        name: "description",
        content:
          "Carbon-negative, lightweight, reconfigurable furniture blocks made from biochar. Build your space before you buy it.",
      },
      { property: "og:title", content: "BioXar | Designed to be rearranged" },
      {
        property: "og:description",
        content: "Carbon-negative, lightweight, reconfigurable furniture blocks made from biochar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const circle = computeStats(getLayout("listening-circle").build());
  return (
    <>
      <section className="integrated-hero relative flex min-h-[76vh] items-end overflow-hidden">
        <img
          src={hero}
          alt="BioXar hollow furniture blocks"
          className="hero-block absolute object-contain"
          width={962}
          height={1104}
        />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-32 md:px-8">
          <p className="font-label text-primary">Design Studio, Berlin</p>
          <h1 className="mt-3 font-headline text-6xl sm:text-7xl md:text-8xl">BioXar</h1>
          <p className="mt-5 max-w-xl text-2xl">Designed to be rearranged.</p>
          <p className="mt-3 max-w-xl text-lg">
            Carbon-negative furniture blocks made from crop residues. One shape. Many lives.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/twin">
                Build your space
                <ArrowUpRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <Link to="/blocks">Meet the block</Link>
            </Button>
          </div>
        </div>
      </section>
      <Section>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            ["Less waste.", "Events change. Furniture should not become waste every time."],
            [
              "More possibilities.",
              "Seats, bars, stages and shelves. Rebuild instead of replacing.",
            ],
            ["Carbon stored.", "Crop residues become a material that keeps carbon out of the air."],
          ].map(([title, text]) => (
            <div key={title} className="border-t border-primary pt-5">
              <h2 className="font-headline text-2xl">{title}</h2>
              <p className="mt-3 text-lg">{text}</p>
            </div>
          ))}
        </div>
      </Section>
      <ScrollStory />
      <section className="photo-hero relative flex min-h-[60vh] items-end overflow-hidden">
        <img
          src={festival}
          alt="BioXar at an outdoor festival"
          loading="lazy"
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
          <h2 className="max-w-xl font-headline text-4xl sm:text-5xl">
            Real spaces.
            <br />
            New possibilities.
          </h2>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/projects">
              Explore projects
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>
      <Section title="Carbon negative.">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <img
            src={colours}
            alt="Sage, Charcoal, Cream and Terracotta BioXar blocks"
            loading="lazy"
            width={1538}
            height={456}
            className="w-full object-contain"
          />
          <div>
            <p className="font-headline text-5xl text-primary">≈{fmtKg(circle.carbonKg)} kg CO2e</p>
            <p className="mt-4 text-xl">Stored in a {circle.count}-block listening circle.</p>
            <p className="mt-3 text-lg">
              Carbon figures are prototype estimates. Weight, composition and lifecycle figures
              still need validation.
            </p>
            <Button asChild className="mt-6 rounded-full" variant="outline">
              <Link to="/about">Our approach</Link>
            </Button>
          </div>
        </div>
      </Section>
      <Section title="A circular life.">
        <LifeCycle />
      </Section>
      <Section title="Try a space.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LAYOUTS.map((l) => {
            const s = computeStats(l.build());
            return (
              <Link
                key={l.id}
                to="/twin"
                search={{ layout: l.id }}
                className="landing-layout group rounded-lg border border-border p-5 transition-colors hover:bg-secondary"
              >
                <LayoutPreview src={LAYOUT_THUMBS[l.id]} alt={`${l.name} built from BioXar blocks`} />
                <h3 className="mt-4 font-label text-lg text-primary">{l.name}</h3>
                <p className="mt-2">
                  {s.count} blocks{s.seats ? ` · ${s.seats} seats` : ""}
                </p>
                <ArrowUpRight className="mt-4 size-5" />
              </Link>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="rounded-full">
            <Link to="/twin" hash="room">
              See it in your room
              <Camera />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/twin" hash="room">
              Propose a space
              <Sparkles />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
