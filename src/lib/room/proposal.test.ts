import { describe, expect, it } from "vitest";
import { parseProposal, proposalInputSchema } from "./proposal";
describe("Catalogue-only room proposals", () => {
  it("requires consent before accepting a photo for AI", () => {
    const input = {
      image: "data:image/jpeg;base64,YQ==",
      event: "Talk",
      guests: 20,
      consent: false,
    };
    expect(proposalInputSchema.safeParse(input).success).toBe(false);
    expect(proposalInputSchema.safeParse({ ...input, consent: true }).success).toBe(true);
  });
  const option = { layoutId: "talk-panel", reason: "Keep the doorway clear.", x: 0.5, y: 0.65 };
  const proposal = {
    room: { w: 10, d: 9 },
    observation: "Open floor.",
    options: [option, option, option],
  };
  it("accepts three predefined arrangements", () =>
    expect(parseProposal(proposal).options.map((o) => o.layoutId)).toEqual([
      "talk-panel",
      "talk-panel",
      "talk-panel",
    ]));
  it("rejects invented furniture layouts", () =>
    expect(() =>
      parseProposal({
        ...proposal,
        options: [{ ...option, layoutId: "invented-chair" }, option, option],
      }),
    ).toThrow());
});
