import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/site/Section";

import { LifeCycle } from "@/components/site/LifeCycle";
import { TEAM } from "@/data/bioxar";
export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | BioXar" },
      {
        name: "description",
        content:
          "BioXar Design Studio in Berlin makes carbon-negative furniture blocks from crop residues.",
      },
      { property: "og:title", content: "About | BioXar" },
      {
        property: "og:description",
        content:
          "BioXar Design Studio in Berlin makes carbon-negative furniture blocks from crop residues.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title="Furniture that" accent="stores carbon." />
      <Section title="Mission">
        <p className="max-w-3xl text-2xl">
          We turn crop residues into furniture that stores carbon. Designed in Berlin. Made to move,
          rearrange and be useful again.
        </p>
      </Section>
      <Section title="A circular life">
        <LifeCycle />
      </Section>
      <Section title="Why now">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="border-t border-primary pt-5">
            <h3 className="font-label text-xl text-primary">Know the object.</h3>
            <p className="mt-4 text-lg">
              The EU’s Digital Product Passport framework moves products toward transparent material
              and lifecycle information. Each BioXar block has a prototype passport.
            </p>
          </div>
          <div className="border-t border-primary pt-5">
            <h3 className="font-label text-xl text-primary">Make carbon useful.</h3>
            <p className="mt-4 text-lg">
              The EU carbon removal certification framework creates a path toward credible carbon
              accounting. Our prototype figures are not a certification.
            </p>
          </div>
        </div>
      </Section>
      <Section title="The team">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((p) => (
            <div key={p.name} className="border-t border-border pt-5">
              <h3 className="text-xl">{p.name}</h3>
              <p className="mt-2 font-label text-base text-primary">{p.role}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Stay connected">
        <div className="flex flex-wrap gap-6 text-lg">
          <a
            href="https://www.instagram.com/bioxardesign/"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            Instagram @bioxardesign
          </a>
          <a
            href="https://www.linkedin.com/company/bioxar/"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            LinkedIn @bioxar
          </a>
        </div>
      </Section>
    </>
  );
}
