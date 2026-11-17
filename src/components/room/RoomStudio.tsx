import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Camera,
  Download,
  ImagePlus,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  VideoOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClientStage, StageLoader } from "@/components/three/Stage";
import {
  computeStats,
  fmtEur,
  fmtKg,
  getLayout,
  passportId,
  PIECES,
  type PieceId,
  type PlacedBlock,
} from "@/data/bioxar";
import { useTwin } from "@/lib/twin/store";
import { imageDataUrl } from "@/lib/room/media";
import { proposeRoom } from "@/lib/room/proposal.functions";
import type { RoomProposal } from "@/lib/room/proposal";
import demoRoom from "@/assets/demo-room.jpg";
const RoomScene = lazy(() => import("./RoomScene"));
export function RoomStudio({
  onOpenTwin,
  active = true,
  onActivate,
}: {
  onOpenTwin?: () => void;
  active?: boolean;
  onActivate?: () => void;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");
  const [piece, setPiece] = useState<PieceId | "design">("stool");
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [floor, setFloor] = useState(0);
  const [pos, setPos] = useState({ x: 0.5, y: 0.65 });
  const [proposal, setProposal] = useState<RoomProposal | null>(null);
  const [option, setOption] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [guests, setGuests] = useState(20);
  const [event, setEvent] = useState<"Listening" | "Talk" | "Exhibition" | "Social" | "Work">(
    "Talk",
  );
  const file = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | null>(null);
  const call = useServerFn(proposeRoom);
  const current = useTwin((s) => s.blocks);
  const selectedOption = option === null ? null : proposal?.options[option];
  const blocks: PlacedBlock[] = selectedOption
    ? getLayout(selectedOption.layoutId).build()
    : piece === "design"
      ? current
      : (PIECES.find((p) => p.id === piece)?.build() ?? []).map((b, i) => ({
          ...b,
          id: passportId(i + 1),
        }));
  const stats = computeStats(blocks);
  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setLive(false);
  };
  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  useEffect(() => {
    if (live && video.current && stream.current) {
      video.current.srcObject = stream.current;
      void video.current
        .play()
        .catch(() => setError("Camera playback is unavailable. Upload a photo instead."));
    }
  }, [live]);
  const camera = async () => {
    stop();
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Unavailable");
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setPhoto(null);
      setLive(true);
      onActivate?.();
      setProposal(null);
      setOption(null);
    } catch {
      setError("Camera access was blocked or unavailable. Upload a photo instead.");
    }
  };
  const usePhoto = async (source: File | string) => {
    stop();
    try {
      setPhoto(await imageDataUrl(source));
      onActivate?.();
      setError("");
      setProposal(null);
      setOption(null);
    } catch {
      setError("This image could not be opened. Choose a JPG, PNG or WebP photo.");
    }
  };
  const capture = async () => {
    try {
      const host = surface.current;
      if (!host) return;
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = Math.round((1280 * host.clientHeight) / host.clientWidth);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const bg = live ? video.current : null;
      if (bg && bg.videoWidth) ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
      else if (photo) {
        const img = new Image();
        img.src = photo;
        await img.decode();
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else return;
      const overlay = host.querySelector("canvas");
      const overlayBox = overlay?.getBoundingClientRect();
      const hostBox = host.getBoundingClientRect();
      if (overlay && overlayBox)
        ctx.drawImage(
          overlay,
          ((overlayBox.left - hostBox.left) / hostBox.width) * canvas.width,
          ((overlayBox.top - hostBox.top) / hostBox.height) * canvas.height,
          (overlayBox.width / hostBox.width) * canvas.width,
          (overlayBox.height / hostBox.height) * canvas.height,
        );
      const theme = getComputedStyle(document.documentElement);
      ctx.fillStyle = theme.getPropertyValue("--background").trim();
      ctx.fillRect(0, canvas.height - 94, canvas.width, 94);
      ctx.fillStyle = theme.getPropertyValue("--primary").trim();
      ctx.font = "bold 30px sans-serif";
      ctx.fillText("bioXar | Designed to be rearranged", 28, canvas.height - 52);
      ctx.fillStyle = theme.getPropertyValue("--foreground").trim();
      ctx.font = "24px sans-serif";
      ctx.fillText(
        `${stats.count} ${stats.count === 1 ? "block" : "blocks"} · ${fmtKg(stats.carbonKg)} kg CO2e · Concept placement`,
        28,
        canvas.height - 18,
      );
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "bioxar-in-your-room.png";
      a.click();
      toast.success("Room image captured.");
    } catch {
      setError("Capture failed. Try a photo instead of the camera.");
    }
  };
  const propose = async () => {
    if (!photo || !consent || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await call({ data: { image: photo, event, guests, consent: true } });
      if (result.ok) {
        setProposal(result.proposal);
        setOption(0);
        const first = result.proposal.options[0];
        if (first) {
          setPos({ x: first.x, y: first.y });
          setScale(0.65);
        }
      } else setError(result.message);
    } catch {
      setError("AI is unavailable. Your photo is kept here. Choose a scenario or try again.");
    } finally {
      setBusy(false);
    }
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const box = surface.current?.getBoundingClientRect();
    if (!box) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2 && pts[0] && pts[1]) {
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinch.current)
        setScale((s) => Math.min(2.5, Math.max(0.2, (s * distance) / (pinch.current ?? distance))));
      pinch.current = distance;
    } else
      setPos({
        x: Math.min(0.9, Math.max(0.1, (e.clientX - box.left) / box.width)),
        y: Math.min(0.9, Math.max(0.2, (e.clientY - box.top) / box.height)),
      });
  };
  const release = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
    drag.current = pointers.current.size > 0;
  };
  const source = photo || live;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button className="rounded-full" onClick={camera}>
          <Camera />
          Allow camera
        </Button>
        <Button variant="secondary" className="rounded-full" onClick={() => file.current?.click()}>
          <ImagePlus />
          Upload photo
        </Button>
        <Button variant="outline" className="rounded-full" onClick={() => void usePhoto(demoRoom)}>
          Demo room
        </Button>
        {live && (
          <Button variant="outline" className="rounded-full" onClick={stop}>
            <VideoOff />
            Stop camera
          </Button>
        )}
        <input
          ref={file}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void usePhoto(f);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-primary">
        Camera stays on your device. Nothing is recorded. Placement is an overlay, not floor-tracked
        AR.
      </p>
      {error && (
        <p role="alert" className="border-l-4 border-destructive py-2 pl-4 text-lg">
          {error}
        </p>
      )}
      {source && (
        <>
          {!active && (
            <Button variant="outline" className="rounded-full" onClick={onActivate}>
              Resume room preview
            </Button>
          )}
          <div
            ref={surface}
            className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-stage"
            data-room-surface
          >
            {photo && <img src={photo} alt="Your room" className="h-full w-full object-fill" />}
            {live && <video ref={video} muted playsInline className="h-full w-full object-fill" />}
            <div
              className="absolute inset-0 touch-none"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = true;
                pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                move(e);
              }}
              onPointerMove={move}
              onPointerUp={release}
              onPointerCancel={release}
            >
              <div
                className="room-canvas pointer-events-none absolute h-full w-full"
                style={{ left: `${(pos.x - 0.5) * 100}%`, top: `${(pos.y - 0.5) * 100}%` }}
              >
                {active && (
                  <ClientStage className="h-full">
                    <Suspense fallback={<StageLoader />}>
                      <RoomScene blocks={blocks} scale={scale} rotation={rotation} floor={floor} />
                    </Suspense>
                  </ClientStage>
                )}
              </div>
            </div>
            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-card px-3 py-2 text-base">
              {stats.count} {stats.count === 1 ? "block" : "blocks"} · ≈{fmtKg(stats.carbonKg)} kg
              CO2e
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PIECES.map((p) => (
              <Button
                key={p.id}
                className="rounded-full"
                variant={piece === p.id && option === null ? "default" : "secondary"}
                onClick={() => {
                  setPiece(p.id);
                  setOption(null);
                  setScale(1);
                }}
              >
                {p.name}
              </Button>
            ))}
            <Button
              variant={piece === "design" && option === null ? "default" : "secondary"}
              className="rounded-full"
              onClick={() => {
                setPiece("design");
                setOption(null);
                setScale(0.65);
              }}
            >
              Your setup
            </Button>
          </div>
          <div className="grid items-end gap-4 sm:grid-cols-3">
            {[
              { name: "Scale", value: scale, min: 0.2, max: 2.5, step: 0.05, set: setScale },
              { name: "Rotation", value: rotation, min: 0, max: 360, step: 1, set: setRotation },
              { name: "Floor angle", value: floor, min: -35, max: 35, step: 1, set: setFloor },
            ].map((c) => (
              <label key={c.name} className="text-primary">
                {c.name}
                <input
                  aria-label={c.name}
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={c.value}
                  onChange={(e) => c.set(Number(e.target.value))}
                  className="mt-3 block w-full accent-primary"
                />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="rounded-full" onClick={() => void capture()}>
              <Download />
              Capture PNG
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setScale(1);
                setRotation(0);
                setFloor(0);
                setPos({ x: 0.5, y: 0.65 });
              }}
            >
              <RotateCcw />
              Reset placement
            </Button>
          </div>
        </>
      )}
      <div className="border-t border-border pt-8">
        <h3 className="font-headline text-2xl">A proposal for your space.</h3>
        <p className="mt-3 text-lg">
          A photo. Your event. Three arrangements built from BioXar scenarios.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-primary">
            Event
            <select
              aria-label="Event type"
              value={event}
              onChange={(e) => {
                const v = e.target.value;
                if (
                  v === "Listening" ||
                  v === "Talk" ||
                  v === "Exhibition" ||
                  v === "Social" ||
                  v === "Work"
                )
                  setEvent(v);
              }}
              className="mt-2 block w-full rounded-lg border border-input bg-background p-3 text-foreground"
            >
              {["Listening", "Talk", "Exhibition", "Social", "Work"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="text-primary">
            Guests
            <input
              aria-label="Guests"
              type="number"
              min={1}
              max={200}
              value={guests}
              onChange={(e) => setGuests(Math.min(200, Math.max(1, Number(e.target.value) || 1)))}
              className="mt-2 block w-full rounded-lg border border-input bg-background p-3 text-foreground"
            />
          </label>
        </div>
        <label className="my-5 flex items-start gap-3 text-base">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 size-5"
          />
          I agree to send this photo to Lovable AI for room analysis. Avoid photos with people or
          private information.
        </label>
        <Button
          className="rounded-full"
          disabled={!photo || !consent || busy}
          onClick={() => void propose()}
        >
          {busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
          {busy ? "Reading your room…" : "Propose a layout"}
        </Button>
        {!photo && <p className="mt-3 text-primary">Choose a photo or the demo room first.</p>}
        {proposal && (
          <div className="mt-6 space-y-4">
            <p className="text-lg">{proposal.observation}</p>
            <p className="text-primary">
              Estimated room: {proposal.room.w} × {proposal.room.d} m. Check dimensions and safe
              circulation in person.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {proposal.options.map((o, i) => {
                const l = getLayout(o.layoutId),
                  s = computeStats(l.build());
                return (
                  <article key={i} className="rounded-lg border border-border p-5">
                    <h4 className="font-label text-lg text-primary">{l.name}</h4>
                    <p className="mt-2">
                      {s.count} blocks · {s.seats} seats · {fmtEur(s.priceEur)}
                    </p>
                    <p className="my-4">{o.reason}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={option === i ? "default" : "secondary"}
                        className="rounded-full"
                        onClick={() => {
                          setOption(i);
                          setPos({ x: o.x, y: o.y });
                          setScale(0.65);
                        }}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => {
                          useTwin.getState().loadDesign(l.build(), proposal.room, o.layoutId);
                          toast.success("Proposal opened in your Digital twin.");
                          onOpenTwin?.();
                        }}
                      >
                        Open in twin
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
