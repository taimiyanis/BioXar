import { z } from "zod";
import { LAYOUTS, type LayoutId } from "@/data/bioxar";
export const proposalInputSchema = z.object({
  image: z
    .string()
    .max(4000000)
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/),
  event: z.enum(["Listening", "Talk", "Exhibition", "Social", "Work"]),
  guests: z.number().int().min(1).max(200),
  consent: z.literal(true),
});
export const proposalSchema = z.object({
  room: z.object({ w: z.number().min(2).max(40), d: z.number().min(2).max(40) }),
  observation: z.string().max(500),
  options: z
    .array(
      z.object({
        layoutId: z.string().refine((id) => LAYOUTS.some((l) => l.id === id)),
        reason: z.string().max(500),
        x: z.number().min(0.1).max(0.9),
        y: z.number().min(0.3).max(0.9),
      }),
    )
    .length(3),
});
export interface RoomProposal {
  room: { w: number; d: number };
  observation: string;
  options: { layoutId: LayoutId; reason: string; x: number; y: number }[];
}
export function parseProposal(value: unknown): RoomProposal {
  const parsed = proposalSchema.parse(value);
  return {
    ...parsed,
    options: parsed.options.map((o) => {
      const layout = LAYOUTS.find((l) => l.id === o.layoutId);
      if (!layout) throw new Error("Unknown layout");
      return { ...o, layoutId: layout.id };
    }),
  };
}
