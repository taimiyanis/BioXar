import type { LayoutId } from "@/data/bioxar";
import listeningCircle from "@/assets/layouts/listening-circle.webp";
import talkPanel from "@/assets/layouts/talk-panel.webp";
import djStage from "@/assets/layouts/dj-stage.webp";
import barCounter from "@/assets/layouts/bar-counter.webp";
import shelvingWall from "@/assets/layouts/shelving-wall.webp";
import kitStarter from "@/assets/layouts/kit-starter.webp";
import kitExpansion from "@/assets/layouts/kit-expansion.webp";

/**
 * Still 3D renders of each layout and kit (one live canvas per screen, so cards use images).
 * Rendered once with Stage + BlockInstances from the layouts in src/data/bioxar.ts.
 * Re-render them if a layout or kit changes there.
 */
export const LAYOUT_THUMBS: Record<LayoutId, string> = {
  "listening-circle": listeningCircle,
  "talk-panel": talkPanel,
  "dj-stage": djStage,
  "bar-counter": barCounter,
  "shelving-wall": shelvingWall,
};
export const KIT_THUMBS: Record<"starter" | "expansion" | "rental", string> = {
  starter: kitStarter,
  expansion: kitExpansion,
  rental: listeningCircle,
};

export function LayoutPreview({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width={960}
      height={720}
      className="mt-4 aspect-[4/3] w-full rounded-lg bg-stage object-contain"
    />
  );
}
