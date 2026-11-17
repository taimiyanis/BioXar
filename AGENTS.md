<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## BioXar architecture
- Every product number (sizes, weight, carbon, prices, layouts, pieces) lives in src/data/bioxar.ts; UI must derive values via computeStats/statsForCount, never hardcode them. Why: prototype figures change often.
- The block is modelled once in code (src/components/three/blockGeometry.ts) and drawn only through BlockInstances (one instanced mesh). Why: performance and a single source for the shape.
- One WebGL canvas per screen via Stage (dpr capped at 2), loaded client-side with ClientStage + lazy import. Why: SSR safety and phone GPUs.
- Landing-page product photography uses transparent cut-outs and its story opts into a transparent Stage; other tools retain their own stage backgrounds. Why: integrate products into the page without changing workspace contrast.
- Room photo planning uses a public, input-validated server function and the Lovable AI Gateway SDK; the model selects catalogue layouts and code derives statistics. Why: no invented product quantities or browser secrets.
- Camera and photo placement is a local overlay with manual scale, rotation and floor angle, not floor-tracked AR; only consented AI photos leave the browser. Why: work across phones without implying spatial calibration.
- Request forms intentionally save on the device and offer a JSON download, with no email delivery. Why: preserve the approved hackathon prototype scope.
