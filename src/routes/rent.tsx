import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/site/Section";

import { Button } from "@/components/ui/button";
import { RequestDialog } from "@/components/site/RequestDialog";
import { DEFAULT_ROOM, KITS, fmtEur, statsForCount, kitBlocks } from "@/data/bioxar";
import { encodeDesign } from "@/lib/twin/share";
import { useTwin } from "@/lib/twin/store";
import { KIT_THUMBS, LayoutPreview } from "@/components/site/LayoutPreview";
export const Route = createFileRoute("/rent")({
  head: () => ({
    meta: [
      { title: "Rent & buy | BioXar" },
      {
        name: "description",
        content: "Buy a starter kit or expansion pack, or rent BioXar blocks for your event.",
      },
      { property: "og:title", content: "Rent & buy | BioXar" },
      {
        property: "og:description",
        content: "Buy a starter kit or expansion pack, or rent BioXar blocks for your event.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RentPage,
});

function RentPage() {
  return (
    <>
      <PageHeader eyebrow="Rent & buy" title="Buy it. Rent it." accent="Return it to soil." />
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {KITS.map((k) => {
            const design = k.blocks === null ? undefined : kitBlocks(k.blocks);
            return (
              <article key={k.id} className="flex flex-col rounded-2xl border border-border p-6">
                <h2 className="font-headline text-2xl">{k.name}</h2>
                <LayoutPreview src={KIT_THUMBS[k.id]} alt={`${k.name} in BioXar blocks`} />
                <p className="mt-5 text-xl text-primary">
                  {k.blocks === null
                    ? "Price on request"
                    : fmtEur(statsForCount(k.blocks).priceEur)}
                </p>
                <p className="mt-3 text-lg">
                  {k.blocks === null
                    ? "A flexible set for your next event."
                    : `${k.blocks} blocks.`}
                </p>
                <div className="mt-6 grid gap-3">
                  <Button
                    asChild
                    variant="secondary"
                    className="h-auto min-h-11 whitespace-normal rounded-full py-3 text-center"
                  >
                    <Link
                      to="/twin"
                      search={design ? { d: encodeDesign(design, DEFAULT_ROOM) } : {}}
                      onClick={() => {
                        if (design) useTwin.getState().loadDesign(design, useTwin.getState().room);
                      }}
                    >
                      Customize in Digital twin
                    </Link>
                  </Button>
                  <RequestDialog intent={k.rental ? "rent" : "buy"} {...(design ? { design } : {})}>
                    <Button className="rounded-full">Request</Button>
                  </RequestDialog>
                </div>
              </article>
            );
          })}
        </div>
      </Section>
      <Section title="Rent for a moment. Buy for many.">
        <p className="max-w-3xl text-xl">
          Rent when the room changes for an event. Buy when the blocks will keep finding a use.
          Every set can be rearranged.
        </p>
      </Section>
    </>
  );
}
