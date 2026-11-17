import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/site/Section";
import { BlockLab } from "@/components/blocks/BlockLab";
import party from "@/assets/blocks-in-use-party.jpg";
import { BLOCK } from "@/data/bioxar";
import { SpecTable } from "@/components/site/SpecTable";

export const Route = createFileRoute("/blocks")({
  head: () => ({
    meta: [
      { title: "The block | BioXar" },
      {
        name: "description",
        content:
          "One hollow biochar block, 50 x 50 x 60 cm. Explore it, take it apart, see how it is made.",
      },
      { property: "og:title", content: "The block | BioXar" },
      {
        property: "og:description",
        content:
          "One hollow biochar block, 50 x 50 x 60 cm. Explore it, take it apart, see how it is made.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlocksPage,
});

function BlocksPage() {
  return (
    <>
      <PageHeader
        eyebrow="Blocks"
        title="Meet the block."
        intro="One shape, four colours. Drag it, open it, take it apart."
      />
      <Section>
        <BlockLab />
      </Section>
      <Section title="In real life">
        <img
          src={party}
          alt="Friends at a Berlin rooftop party, sitting on and gathering around BioXar blocks"
          loading="lazy"
          width={1536}
          height={1024}
          className="w-full rounded-2xl object-cover"
        />
        <p className="mt-4 max-w-2xl text-lg">A seat with a cushion. Two stacked into a bar table. Same blocks, next week a workspace.</p>
      </Section>
      <Section title="End of life">
        <p className="font-headline text-4xl text-primary">{BLOCK.endOfLife}.</p>
        <p className="mt-4 text-xl">The carbon stays stored. A circular end for a useful object.</p>
      </Section>
      <Section title="Specifications">
        <SpecTable />
      </Section>
    </>
  );
}
