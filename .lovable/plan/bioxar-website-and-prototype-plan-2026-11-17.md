# BioXar website and prototype: plan

Follows the brief (section 0). After approval: low-fidelity wireframes of every page, then build in 6 phases, pausing for "next" after each one.

## Decisions from your answers
- Weight: **5 kg per block**. Composition stays as in the brief (biochar 10.7 kg / 70%, kraft lignin 4.6 kg / 30%). Note: these two numbers add up to 15.3 kg, not 5 kg. Both values live in the data file, so changing either one is a one-line edit.
- Price: 200 EUR per block, no discount. Starter kit 4,000 EUR, Expansion pack 1,000 EUR, Event rental "price on request".
- Layout colours: I choose them (see the data model below).
- Follow the brief over the mockup: no login, no Walk view, menu item "Rent & buy". Useful extras are marked as optional below.
- Team: Hugues de Thoisy, CFO.

## Sitemap
```text
/            Home
/blocks      Block lab
/twin        Digital twin (core); ?layout=listening-circle | talk-panel | dj-stage | bar-counter | shelving-wall ; ?d=<shared design>
/projects    Projects
/rent        Rent & buy
/about       About
(Request dialog: opens from any page, it is not a separate page)
Optional: /passport/$id   Block passport page (see extras)
```
Nav: logo | Blocks, Digital twin, Projects, Rent & buy, About | "Shop blocks" button. On phones the nav becomes a menu sheet. The footer has the logo, slogan, Instagram @bioxardesign, LinkedIn @bioxar and the nav links.

## Components
- **Shell:** SiteHeader, MobileNav, SiteFooter, SoilBackground (darkened soil-texture), Panel (#262624, 20px radius, thin border), SectionHeading (Archivo 125 / 800 uppercase), StatRow, CarbonCard (sage), PassportCard, Toast.
- **3D:** BlockGeometry (built once in code: 50 x 50 x 60 cm rounded box with a tapered rounded hole 24 x 36 cm), BlockMaterial (matte, fine speckle, 4 colours), BlockInstances (one instanced mesh for all blocks), Stage (light warm grey #E8E4DE, soft shadows), CanvasLoader (loading state), a single shared canvas per page, pixel ratio capped at 2, ThumbnailRenderer (renders each layout once to an image and caches it).
- **Digital twin:** TwinHeader, LeftPanel (tabs SCENARIOS / PLAY, ScenarioList, ColourPicker), RoomScene (floor, dashed outline, grid), RoomSizeInputs + out-of-room warning, ScenarioChip, ViewToggle (3D / Top), GhostBlock, Toolbar (undo, redo, add, delete, rotate 90, stand / side, fullscreen), SelectionOutline + ID tooltip, SetupPanel (count, seats, per colour, CarbonCard with 20/50/100 tiles, PassportCard, Rent / Buy buttons), ShareButton, RoomOverlay (camera / upload / demo photo, drag, sliders for scale, rotation and floor angle, Capture PNG).
- **Block lab:** BlockViewer (rotate, zoom, swatches), Hotspots + DiscoverCards + counter + "Block passport unlocked" card, TakeApart (surface particles split into 2 labelled piles, Rebuild), HowItsMade (5-step slider driving the scene), EndOfLife (crumbles into a soil mound), SpecTable.
- **Marketing:** Hero (rotating 4-colour cluster), ProblemPoints, ImageBand, ColoursSection, LifeCycleStrip (5 steps), LayoutThumbnails, CTA, ProjectCard, KitCard, TeamList.
- **RequestDialog:** name, organisation, email, rent or buy, event date (optional), message, plus an auto-attached summary of the current design (layout, blocks per colour, stats, share link). Saved to localStorage, with a confirmation screen.

## Data model: src/data/bioxar.ts (every number on the site comes from here)
```text
block: { size: {w:50,d:50,h:60} cm, hole: {w:24,h:36} cm, weightKg: 5,
         composition: { biocharKg:10.7, biocharPct:70, ligninKg:4.6, ligninPct:30 },
         material:"Biochar foam", origin:"Crop residues", carbonKgPerBlock:3.1,
         endOfLife:"Back to soil", priceEur:200 }
carKgCo2PerKm: 0.124
colours: sage #96A078, charcoal #2B2B2B, cream #EDE6D3, terracotta #8C5A55
PlacedBlock: { id:"#0001", x, z, level, rotation:0|90, orientation:"standing"|"side", colour }
layouts: generated in code and checked: every block sits on the floor or on another block, no overlap
  Listening circle  18 blocks, 16 seats  ring of 16 Terracotta on their side + 2 stacked Charcoal standing (DJ booth)
  Talk & panel      24 blocks, 20 seats  20 Sage seats on their side in rows + 4 Charcoal standing as a panel table
  DJ stage          12 blocks, 0 seats   4 x 3 Charcoal on their side
  Bar counter       10 blocks, 0 seats   5 Terracotta standing + 5 Cream standing on top (120 cm)
  Shelving wall     20 blocks, 0 seats   5 x 4, alternating Cream and Sage, openings facing front
kits: starter 20, expansion 5, rental (price on request)
computeStats(blocks) -> { count, perColour, seats, weightKg, carbonKg, carKm, priceEur }
```
Check for the acceptance test: Listening circle gives 18 x 3.1 = 55.8, shown as about 56 kg CO2e, and about 450 km. The tiles give 62 / 155 / 310 kg. Seats count the side-lying blocks the layout marks as seats.

State: one shared design store (layout, blocks, selection, undo / redo history, room size, view) with autosave to localStorage. Share encodes the design into the URL.

## Build phases
1. **Foundation:** design tokens (colours, Archivo + Inter, soil background), header, footer, mobile menu, all 6 pages as empty sections with titles, the data file + computeStats, the 3D block component on a test stage. Logo used as favicon.
2. **Digital twin:** scenarios, room and room size, 3D / Top toggle, Play mode (ghost, snapping, stacking, select, toolbar, keyboard undo / redo), Your setup panel, passport, autosave, share link.
3. **Block lab:** viewer and swatches, 5 hotspots and unlock card, Take it apart / Rebuild, How it's made slider, End of life, spec table.
4. **See it in your room:** live camera (rear camera on phones), photo upload, demo room photo, drag / scale / rotate / floor angle, Capture PNG, a fallback message if the camera is refused.
5. **Content pages:** Home, Projects, Rent & buy, About, and the request dialog wired to all four buttons.
6. **Polish:** 375 px phone pass, loading states everywhere, confirmations, then run the full acceptance test (section 11) on desktop and phone and report the results.

## Optional extras (useful, within the brief's limits; each can be dropped)
- **Guest count helper** on the Digital twin: "How many people?" suggests a layout and the number of blocks needed. Answers "How many blocks do I need?" directly.
- **Passport page** /passport/#0042: a shareable page for one block with its data, as a preview of the EU Digital Product Passport.
- **Printable setup sheet**: one-page summary of the design (image, blocks per colour, stats) for venue managers to pass on internally.
- **Rental vs buy hint** in the setup panel: shows the set price and "rent for events" side by side.

## Technical notes
- The project runs on TanStack Start with React 19, so it uses @react-three/fiber v9 + drei v10, three and zustand. This replaces "React + Vite" with the same stack plus file routes; nothing changes for you.
- Images go to the asset CDN; the logo is also copied as the favicon. The demo room photo is an Unsplash URL.
- No backend, login, payments or emails. Requests and designs are stored in the browser.
- Tests: computeStats values (18 blocks gives 55.8 kg and 16 seats, kit prices 4,000 / 1,000 EUR, 5 kg weight) and the layout checks (no overlap, no floating blocks).
