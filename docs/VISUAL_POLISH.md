# Visual refinement · 2026-09-24

Implementation notes, not publication copy.

## Visual system

- The issue display now uses an open, asymmetric aperture instead of a pedestal. Two opposing curves suggest articulation; their gap makes room for expression rather than enclosing it. The cover remains a separate, replaceable, uncropped image.
- The cover feature is more compact: 450px desktop art area instead of 540px, a 280px cover instead of 310px, and a gentler four-degree tilt. Its 3:4 display frame and original-image containment are unchanged. The title and section spacing are rebalanced around it; mobile proportions are handled separately.
- Shared page introductions use the same intersecting-plane vocabulary. Turquoise remains primary; orange accents and black structural edges create contrast without textures, gradients or new image dependencies.
- The homepage retains its current-issue, latest-article, most-read and updates hierarchy. Article reading layouts remain quiet and unchanged.
- Reuse `PublicationStage.astro` for the decorative geometry and `PublicationImage.astro` for actual editorial images. Do not turn the surrounding geometry into an invented issue cover.
- Motion uses the existing shared tokens and one-time entrance system. The aperture opens slightly and backing planes respond to hovering/focusing the real issue link; the cover and ribbon anchor stay fixed. The compact ribbon measures the copy's start to clear it before entering the side gutter. Reduced-motion and no-JavaScript use remain supported.
- Original frog, content collections, release gates and editorial placeholders are preserved. No editorial prose, external service or dependency was added.

## Reference sources

The abstract references are Miami's projecting canopies and rounded corners, and the bold intersecting forms of FIU's public sculpture. No reference photograph or sculpture was reproduced as site artwork.

- [Greater Miami: Art Deco Historic District](https://www.miamiandbeaches.com/things-to-do/history-and-heritage/art-deco-historic-district)
- [Frost Art Museum: FIU public art](https://frost.fiu.edu/collections/public-art/)

## Verification and preview

`pnpm build`, publishing/homepage tests and the isolated populated release build pass. Browser checks cover 11 routes at 1440, 768, 390 and 320 CSS pixels, replaceable media, keyboard navigation, reduced motion and no-JavaScript operation. The ribbon check covers six widths, both exact endpoints and changing content height.

The automated accessibility run reports no violations across 36 states; incomplete contrast checks are not a conformance finding. Primary text-color pairs and targeted keyboard/reflow/text-spacing checks pass. This visual pass is not legal approval or full WCAG certification.

Run `pnpm dev` for live editing, or `pnpm build` then `pnpm preview` for the production build, at `http://127.0.0.1:4321/`. Optional `scripts/capture-polish.mjs` writes desktop/mobile screenshots to an explicitly supplied `GLOSSO_QA_DIR` outside the public output. Populated test fixtures also stay outside public content.

No push or deployment was performed. Existing legal launch holds remain unchanged.
