import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/site/Section";

import { Button } from "@/components/ui/button";
import { PROJECTS, computeStats, getLayout } from "@/data/bioxar";
import festival from "@/assets/outdoor-festival.jpg";
import talk from "@/assets/talk-panel.jpg";
import exhibition from "@/assets/exhibition.jpg";
import coworking from "@/assets/coworking.jpg";
const images = { festival, talk, exhibition, coworking };
export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects | BioXar" },
      {
        name: "description",
        content:
          "One block, many spaces: festivals, talks, exhibitions and coworkings built from BioXar blocks.",
      },
      { property: "og:title", content: "Projects | BioXar" },
      {
        property: "og:description",
        content:
          "One block, many spaces: festivals, talks, exhibitions and coworkings built from BioXar blocks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <>
      <PageHeader eyebrow="Projects" title="One block." accent="Many spaces." />
      <Section>
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
          {PROJECTS.map((p) => {
            const l = getLayout(p.layout),
              s = computeStats(l.build());
            return (
              <article key={p.name}>
                <img
                  src={images[p.image]}
                  alt={p.name + " with BioXar blocks"}
                  width={1536}
                  height={1024}
                  loading="lazy"
                  className="aspect-[3/2] w-full rounded-2xl object-cover"
                />
                <h2 className="mt-5 font-headline text-3xl">{p.name}</h2>
                <p className="mt-3 text-lg">{p.text}</p>
                <p className="mt-2 text-primary">
                  {l.name} · {s.count} blocks
                </p>
                <Button asChild className="mt-5 rounded-full">
                  <Link to="/twin" search={{ layout: p.layout }}>
                    Build this
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>
        <p className="mt-8 text-base text-primary">
          Concept visualisations. Not completed installations.
        </p>
      </Section>
    </>
  );
}
