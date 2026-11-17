import { useState, type ReactNode } from "react";
import { CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { computeStats, type PlacedBlock } from "@/data/bioxar";
import { useTwin } from "@/lib/twin/store";
import { downloadJson } from "@/lib/room/media";

export function RequestDialog({
  children,
  intent = "rent",
  design,
}: {
  children: ReactNode;
  intent?: "rent" | "buy";
  design?: PlacedBlock[];
}) {
  const current = useTwin((s) => s.blocks);
  const room = useTwin((s) => s.room);
  const blocks = design ?? current;
  const stats = computeStats(blocks);
  const [saved, setSaved] = useState<Record<string, unknown> | null>(null);
  const [kind, setKind] = useState(intent);
  const input =
    "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground";
  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          setSaved(null);
          setKind(intent);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl sm:max-w-xl">
        <DialogTitle className="font-headline text-2xl">
          {saved ? "Request saved" : "Your next space"}
        </DialogTitle>
        <DialogDescription className="text-base">
          {saved
            ? "Saved on this device. No email has been sent."
            : "Prototype request. Your design is attached. No email will be sent."}
        </DialogDescription>
        {saved ? (
          <div className="space-y-5">
            <CheckCircle2 className="size-12 text-primary" />
            <p>
              {stats.count} blocks · {stats.seats} seats attached.
            </p>
            <Button
              className="rounded-full"
              onClick={() => downloadJson(saved, "bioxar-request.json")}
            >
              <Download />
              Download request
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fields = Object.fromEntries(new FormData(e.currentTarget));
              const request = {
                ...fields,
                kind,
                design: { blocks, room, stats },
                createdAt: new Date().toISOString(),
              };
              try {
                const existing = JSON.parse(localStorage.getItem("bioxar-requests-v1") ?? "[]");
                localStorage.setItem(
                  "bioxar-requests-v1",
                  JSON.stringify([...(Array.isArray(existing) ? existing : []), request]),
                );
                setSaved(request);
                toast.success("Request saved with your design.");
              } catch {
                toast.error(
                  "This device could not save the request. Please allow browser storage.",
                );
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-primary">
                Name
                <input className={input} name="name" autoComplete="name" required />
              </label>
              <label className="text-primary">
                Organisation
                <input className={input} name="organisation" autoComplete="organization" />
              </label>
            </div>
            <label className="block text-primary">
              Email
              <input className={input} name="email" type="email" autoComplete="email" required />
            </label>
            <fieldset>
              <legend className="mb-2 text-primary">Rent or buy</legend>
              <div className="flex gap-4">
                {(["rent", "buy"] as const).map((v) => (
                  <label key={v} className="flex gap-2">
                    <input
                      type="radio"
                      name="kind"
                      value={v}
                      checked={kind === v}
                      onChange={() => setKind(v)}
                    />
                    {v === "rent" ? "Rent" : "Buy"}
                  </label>
                ))}
              </div>
            </fieldset>
            {kind === "rent" && (
              <label className="block text-primary">
                Event date
                <input className={input} name="date" type="date" />
              </label>
            )}
            <label className="block text-primary">
              Message
              <textarea className={input} name="message" rows={3} />
            </label>
            <p className="border-t border-border pt-3">
              {stats.count} blocks · {stats.seats} seats · {stats.weightKg} kg attached.
            </p>
            <Button className="w-full rounded-full" type="submit">
              Save request
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
