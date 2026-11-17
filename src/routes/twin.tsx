import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Box,
  Expand,
  Grid2x2,
  MousePointer2,
  Plus,
  Presentation,
  Redo2,
  RotateCw,
  Share2,
  Trash2,
  Undo2,
  RectangleHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section } from "@/components/site/Section";
import { ClientStage, StageLoader } from "@/components/three/Stage";
import { RoomStudio } from "@/components/room/RoomStudio";
import {
  LeftPanel,
  RoomControls,
  SetupPanel,
  TotalsBar,
  useOutside,
} from "@/components/twin/TwinPanels";
import { Button } from "@/components/ui/button";
import { getLayout, LAYOUTS, type LayoutId } from "@/data/bioxar";
import { decodeDesign, encodeDesign } from "@/lib/twin/share";
import { STORAGE_KEY, useTwin } from "@/lib/twin/store";

const TwinScene = lazy(() => import("@/components/twin/TwinScene"));

type Search = { layout?: LayoutId; d?: string };

export const Route = createFileRoute("/twin")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ...(LAYOUTS.some((l) => l.id === s["layout"]) ? { layout: s["layout"] as LayoutId } : {}),
    ...(typeof s["d"] === "string" ? { d: s["d"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Digital twin | BioXar" },
      {
        name: "description",
        content:
          "Build your space before you buy it. Pick a scenario or arrange BioXar blocks yourself.",
      },
      { property: "og:title", content: "Digital twin | BioXar" },
      {
        property: "og:description",
        content:
          "Build your space before you buy it. Pick a scenario or arrange BioXar blocks yourself.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TwinPage,
});

function useTwinBoot() {
  const { layout, d } = Route.useSearch();
  useEffect(() => {
    const st = useTwin.getState();
    const shared = d ? decodeDesign(d) : null;
    if (shared) st.loadDesign(shared.blocks, shared.room, null, shared.decor);
    else if (layout) st.loadLayout(layout);
    else {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
        if (saved?.blocks)
          st.loadDesign(saved.blocks, saved.room, saved.layoutId ?? null, saved.decor ?? []);
      } catch {
        /* ignore broken save */
      }
    }
    return useTwin.subscribe((s) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ blocks: s.blocks, decor: s.decor, room: s.room, layoutId: s.layoutId }),
      );
    });
  }, [layout, d]);
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      const s = useTwin.getState();
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if ((e.ctrlKey || e.metaKey) && k === "y") {
        e.preventDefault();
        s.redo();
      } else if (k === "delete" || k === "backspace") s.deleteSelected();
      else if (k === "r") s.rotate();
      else if (k === "escape") s.set({ tool: "select", selectedId: null });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/** Walk needs a mouse and keyboard, so it is offered on computers only. */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => {
      setFine(mq.matches);
      if (!mq.matches && useTwin.getState().view === "walk") useTwin.getState().set({ view: "3d" });
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

function Tool({
  label,
  icon: Icon,
  onClick,
  active,
  disabled,
}: {
  label: string;
  icon: typeof Box;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      size="sm"
      variant={active ? "default" : "secondary"}
      onClick={onClick}
      disabled={disabled}
      className="font-label h-11 rounded-full px-3 text-sm"
      title={label}
      aria-label={label}
    >
      <Icon className="size-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

function TwinPage() {
  useTwinBoot();
  useShortcuts();
  const wrap = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<"twin" | "room">("twin");
  const [present, setPresent] = useState(false);
  const s = useTwin();
  const outside = useOutside();
  const finePointer = useFinePointer();
  const chip = s.layoutId ? `Scenario · ${getLayout(s.layoutId).name}` : "Play · Your design";

  const share = async () => {
    const url = `${window.location.origin}/twin?d=${encodeDesign(s.blocks, s.room, s.decor)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied. Anyone with it sees this design.");
    } catch {
      toast.message("Copy this link", { description: url });
    }
  };
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void (present ? shell : wrap).current?.requestFullscreen?.();
  };
  const play = s.mode === "play";
  // Presentation mode: the twin fills the screen with a compact totals bar. Esc leaves it.
  useEffect(() => {
    if (!present) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) setPresent(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [present]);
  const stageH = present
    ? "h-[60vh] min-h-[320px] lg:h-[calc(100dvh-18rem)]"
    : "h-[58vh] min-h-[380px]";

  return (
    <>
      <PageHeader
        eyebrow="Digital twin"
        title="Build your space"
        accent="before you buy it."
        intro="Pick a scenario or press Play and arrange the blocks yourself. We count what you need and every block carries its own passport."
      />
      <Section>
        <div
          ref={shell}
          className={
            present
              ? "fixed inset-0 z-50 flex flex-col gap-3 overflow-y-auto bg-background p-3 sm:p-4"
              : ""
          }
        >
          {present && <TotalsBar />}
          <div
            className={
              present
                ? "grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]"
                : "grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]"
            }
          >
            <div
              className={
                present
                  ? "order-2 lg:order-1 lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto"
                  : "order-2 lg:order-1"
              }
            >
              <LeftPanel />
            </div>
            <div
              ref={wrap}
              className="order-1 flex min-w-0 flex-col gap-3 bg-background lg:order-2"
            >
              <div className="relative">
                {scene === "twin" ? (
                  <ClientStage className={stageH}>
                    <Suspense
                      fallback={
                        <div className={`relative rounded-[var(--radius)] bg-stage ${stageH}`}>
                          <StageLoader />
                        </div>
                      }
                    >
                      <TwinScene className={stageH} />
                    </Suspense>
                  </ClientStage>
                ) : (
                  <div
                    className={`flex items-center justify-center rounded-2xl bg-stage ${stageH}`}
                  >
                    <Button className="rounded-full" onClick={() => setScene("twin")}>
                      Return to 3D room
                    </Button>
                  </div>
                )}
                <div className="pointer-events-none absolute left-3 right-32 top-3 flex flex-wrap gap-2">
                  <span className="rounded-2xl bg-card px-3 py-1.5 font-label text-xs text-foreground">
                    {chip}
                    <span className="hidden sm:inline"> · </span>
                    <br className="sm:hidden" />
                    Room {s.room.w} × {s.room.d} m
                  </span>
                </div>
                <div className="absolute right-3 top-3 flex rounded-full bg-card p-1">
                  {(finePointer ? (["3d", "top", "walk"] as const) : (["3d", "top"] as const)).map(
                    (v) => (
                      <button
                        key={v}
                        onClick={() => s.set({ view: v })}
                        className={`rounded-full px-3 py-1.5 font-label text-xs ${s.view === v ? "bg-primary text-primary-foreground" : "text-foreground"}`}
                      >
                        {v === "3d" ? "3D" : v === "top" ? "Top" : "Walk"}
                      </button>
                    ),
                  )}
                </div>
                {s.view === "walk" && scene === "twin" && (
                  <p className="pointer-events-none absolute inset-x-3 bottom-3 mx-auto w-fit rounded-2xl bg-card px-3 py-1.5 text-center text-sm text-foreground">
                    Drag to look around. W A S D or the arrow keys to walk.
                  </p>
                )}
                {outside > 0 && (
                  <div
                    role="alert"
                    className="absolute inset-x-3 bottom-3 rounded-2xl bg-destructive px-4 py-2 text-base text-destructive-foreground"
                  >
                    {outside} {outside === 1 ? "block is" : "blocks are"} outside the room. Move{" "}
                    {outside === 1 ? "it" : "them"} or make the room bigger.
                  </div>
                )}
              </div>
              <div className="panel flex flex-wrap items-center gap-2 p-2">
                {!play && (
                  <Tool
                    label="Play"
                    icon={Plus}
                    onClick={() => s.set({ mode: "play", tool: "add" })}
                    active
                  />
                )}
                {play && (
                  <>
                    <Tool
                      label="Add"
                      icon={Plus}
                      onClick={() => s.set({ tool: "add" })}
                      active={s.tool === "add"}
                    />
                    <Tool
                      label="Select"
                      icon={MousePointer2}
                      onClick={() => s.set({ tool: "select" })}
                      active={s.tool === "select"}
                    />
                  </>
                )}
                <Tool label="Undo" icon={Undo2} onClick={s.undo} disabled={!s.past.length} />
                <Tool label="Redo" icon={Redo2} onClick={s.redo} disabled={!s.future.length} />
                <Tool
                  label="Delete"
                  icon={Trash2}
                  onClick={s.deleteSelected}
                  disabled={!s.selectedId}
                />
                <Tool
                  label="Rotate 90"
                  icon={RotateCw}
                  onClick={s.rotate}
                  disabled={!(s.tool === "add" && play) && !s.selectedId}
                />
                <Tool
                  label={
                    s.tool === "add" && play
                      ? s.orientation === "side"
                        ? "Side"
                        : "Standing"
                      : "Stand / side"
                  }
                  icon={RectangleHorizontal}
                  onClick={s.toggleOrientation}
                  disabled={!(s.tool === "add" && play) && !s.selectedId}
                />
                <span className="flex-1" />
                <Tool label="Share" icon={Share2} onClick={share} />
                <Tool
                  label={present ? "Exit present" : "Present"}
                  icon={Presentation}
                  onClick={() => {
                    if (!present) setScene("twin");
                    setPresent(!present);
                  }}
                  active={present}
                />
                <Tool label="Fullscreen" icon={Expand} onClick={fullscreen} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <RoomControls />
                <p className="text-sm text-foreground/85">
                  <Grid2x2 className="mr-1 inline size-4 text-primary" />
                  Saved on this device. Ctrl+Z to undo, R to rotate.
                </p>
              </div>
            </div>
            {!present && (
              <div className="order-3">
                <SetupPanel />
              </div>
            )}
          </div>
        </div>
      </Section>
      <Section title="See it in your room" id="room">
        <RoomStudio
          active={scene === "room"}
          onActivate={() => setScene("room")}
          onOpenTwin={() => {
            setScene("twin");
            wrap.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      </Section>
    </>
  );
}
