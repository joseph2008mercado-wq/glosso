# Glosso — final local launch audit

Updated 2026-09-24. **Local technical checks pass; public release remains blocked by specific unresolved legal/contact/account facts and the old unapproved legal routes.** This is not a legal opinion, security certification or full WCAG conformance report.

Use [FINAL_LAUNCH_CHECKLIST.md](FINAL_LAUNCH_CHECKLIST.md) as the single current checklist. This document records evidence, not another list of approvals. The user will perform deployment; none was performed here.

## Final clarification / WCAG 2.2 AA extension

The operator confirmed personal individual operation and no payments, advertising or subscriptions. All six private draft documents were cross-checked section by section in `legal-review/IMPLEMENTATION-CROSSCHECK.md`; the contributor agreement now explicitly covers scheduling and headlines without permitting substantial unapproved alterations or misleading attribution. A privacy sentence implying activated Cloudflare processing was corrected to planned/conditional wording. Existing public legal drafts remain unchanged and blocked, not silently approved.

Added dev-only axe-core 4.13.0 and `scripts/check-wcag.mjs`; no checker code is shipped in dist. Ran WCAG 2.0/2.1 A/AA and 2.2 AA tagged rules on 12 routes (including HTTP 404) at 1440 and 320 CSS pixels, plus all 12 open mobile-menu states: 36 scans, zero automated violations. Manual-review flags exposed generic placeholder elements with unsupported naming semantics; these now have group roles. Text-spacing overrides exposed homepage header-row overflow at 320px; flex wrapping fixed it without changing ordinary layout.

Automated incomplete results remain for color contrast in 14 scan states (three home states and the other 11 open-menu states). The graphics/overlay geometry prevents automatic background determination; these are NOT clean contrast passes. Earlier numeric primary-palette checks and screenshot inspection supplement them but do not certify all states. A full human screen-reader/contextual contrast review is not completed. No WCAG conformance certification or legal-compliance claim is made.

Additional keyboard testing of tabbing out of the open mobile menu exposed covered focus on the homepage Issue Archive link and the 404 Home link. The disclosure now closes on focus moving outside it, retaining focus on the destination. This is a targeted 2.4.11 correction, not a redesign. The regression checks this transition on every route. Mobile open-menu and custom text-spacing screenshots were visually inspected; the latter preserved readable copy and wrapping without horizontal overflow.

| WCAG-oriented area | Actual coverage / limit |
| --- | --- |
| 1.1.1, 1.3.1, 3.1.1, 4.1.2 | Axe rules plus alt presence, landmarks, language, ARIA targets and named controls; semantic quality of future artwork alternatives untested |
| 1.4.3, 1.4.11 | Axe checks and primary-palette ratios; incomplete layered/overlay contrast cases explicitly retained for contextual review |
| 1.4.4, 1.4.10, 1.4.12 | 200% root text resize, 320px reflow and prescribed text-spacing overrides; no clipping/overflow found by targeted checks after fix; not all browser/OS zoom combinations |
| 2.1.1–2.1.2, 2.4.1, 2.4.7, 2.4.11 | Keyboard controls, Escape menu close, skip-focus, reachable-control focus outlines and point-hit visibility; not a screen-reader user evaluation |
| 2.5.8 and applicable automated A/AA rules | Included in axe WCAG 2.2 AA tag set; no automated violation, not proof of every criterion |
| Motion and navigation | Existing reduced-motion/no-JavaScript/mobile regression checks retained; no drag-only or motion-operated control exists |
| Forms/authentication/error handling | No forms or authentication flows; form labeling, error recovery, redundant entry and accessible authentication are not applicable to current pages, not tested successes |
| PDF/audio/video | No public PDF files/links or audio/video currently supplied. Synthetic route/download tests do not validate an actual accessible magazine |

The technical reference is [WCAG 2.2](https://www.w3.org/TR/WCAG22/); automated testing is only one part of evaluation ([axe-core documentation](https://github.com/dequelabs/axe-core)). Whether a specific legal obligation applies remains a separate qualified review question.

Reproduction: set the Playwright/Chrome variables below, then `node scripts/check-wcag.mjs`. Optional `GLOSSO_QA_DIR` records JSON findings and screenshots outside public output. There is no public scan-results page or accessibility overlay.

## Implementation findings

| Area | Verified finding | Limitation |
| --- | --- | --- |
| Routes/navigation | Home, Read, Issues, Contributors, About, Submissions, Contact and legal routes return 200 locally; missing route returns real 404 | Final Cloudflare routing not inspected |
| Publication | Permanent work/issue/contributor routes, credit, dates, optional images/audio/PDFs and experimental whitespace tested with isolated fixtures | All real collections remain empty; no actual PDF or contribution to certify |
| Release safety | Approved/non-draft/reached-date gates; monthly uniqueness; specials separate; future/draft pages and media absent from output | Static scheduling needs a new approved build/deploy; output exclusion is not private storage |
| Homepage | Current monthly issue and latest work selected from released content; updates preserved | Engagement remains deliberately unconfigured; no ranking invented |
| Submissions/contact | No forms, upload endpoint, database, user account or email handler; both addresses remain null | No functioning intake/mailbox exists to penetration-test or claim secure |
| Data collection | Current empty local build makes no external browser requests and sets no cookies/local/session storage; fonts local | Cloudflare hosting, browser beacon and dashboard processing are planned, not account-verified |
| Private files | Tested legal/source/private/unreleased URLs return 404; private review paths ignored; managed asset path/symlink/declaration checks pass | public/ is always public; ignored files may still be synced locally; prior Git/deployment copies need separate handling |
| Search | Canonicals, robots and sitemap correct locally; released works/issues/About indexable; legal drafts/404 noindex | Actual Google indexing not guaranteed; empty BLANK content remains honest |
| Accessibility | Added keyboard focus target for skip link; enlarged-text desktop navigation now wraps instead of overflowing | Screen-reader review, contextual contrast, real work alt text, audio alternatives and PDF accessibility still require content-specific review |
| Visual design | No redesign; existing palette/layout/motion and original frog preserved | Targeted semantic, focus and responsive accessibility corrections only |
| Legal | Revised six-document packet reflects latest supplied facts and rights model; separate private storage | Old public-route drafts still blocked; privacy route contains stale Google Fonts text |
| Build/hosting | Astro 5 static dist output; no runtime DB/bindings/secrets required; guarded Pages build documented | Account/domain/TLS/analytics configuration cannot be inferred from source |
| Git | Local master, no commits/indexed files; origin points to existing joseph2008mercado-wq/glosso.git | Prior read-only GitHub check: public repo, main metadata, empty branch list; recheck before first push. Local HTTPS helper repair may be needed as documented |
| Public availability | No push/deploy/account mutation by this work | Do not treat local success as approval to expose drafts |

## Test results — final local build

- PASS: `pnpm test:homepage` — selection and component rendering; BLANK fixtures never published.
- PASS: `pnpm test:publishing` — publication gates, credits, monthly/special relationships, media checks, metadata and empty/populated rendering.
- PASS: `pnpm test:release-build` — isolated real Astro build: MDX/verbatim whitespace, works/issues/authors, release timing, sitemap and emitted media bytes. The sandbox denied linked dependency access on the first attempt; approved rerun outside the sandbox passed. No fixtures entered live collections.
- PASS: `pnpm build` — zero Astro errors/warnings/hints in diagnostics. Expected empty-collection notices during generation, not fabricated publications.
- PASS: `node scripts/check-accessibility.mjs` — 12 routes including 404; language, titles, landmarks, control-name checks, alt presence, ARIA reference targets, skip-link focus, 320 CSS-pixel reflow, 200% root-text resizing and six primary text-color pairs at at least 4.5:1. Text resizing is not represented as a full browser-zoom test.
- PASS: Browser regression — 11 routes at 1440/768/390/320px, internal links, keyboard mobile menu, no-JavaScript reading/navigation, reduced motion, populated image-layout fixtures. Screenshots captured in the private QA directory; mobile homepage visually inspected.
- PASS: Ribbon regression — six widths, exact connected endpoints, copy clearance and resize/content growth.
- PASS: Runtime privacy regression — 11 routes, no application forms/cookies/storage/external requests; private/source/unreleased paths 404; canonical/sitemap/robots.
- PASS WITH LIMITATION: `pnpm audit:repository` — zero staged/tracked paths. Re-run after explicit staging; this is not a complete secret/history scan.
- EXPECTED BLOCK: `pnpm check:launch` — four false approval flags plus four old legal-draft routes. This is deliberate, not a production compilation failure.

The original frog SHA256 remains `0B8B3C5675F4EC79F1B7F6279FC1B326A2E828BC3FBD308B98BD1C37233EC1AD`.

## Security and privacy boundaries

No server-side submission facility exists, so no upload authentication, form consent or CSRF mechanism is claimed. Opening email intake requires a real monitored mailbox, restricted reviewers, safe attachment handling and an actual deletion/backup process. No ID upload or guardian workflow has been added for adults-only submissions.

Tested private paths include /legal-review/PRIVACY-DRAFT.md, /private-submissions/test.pdf, /publication-assets/test.png, /.env, /.git/config, /src/content/writing/test.mdx and /media/unreleased.pdf. A static 404 and noindex are not authentication; private information must stay out of public Git and deployed assets entirely.

Both selected Cloudflare analytics products must be disclosed according to actual settings. Local browser tests cannot inspect provider logs, access roles, security cookies, account-side injection or retention. Neither a universal cookie-banner requirement nor a universal exemption has been inferred.

## Repeating optional browser checks

Use an installed Playwright module and Chrome; no production browser-test dependency was added:

```powershell
$env:GLOSSO_PLAYWRIGHT_PATH='C:/Users/lizar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:GLOSSO_CHROME_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
node scripts/check-accessibility.mjs
node scripts/check-browser.mjs
node scripts/check-ribbon.mjs
node scripts/check-runtime-privacy.mjs
```

Build first and run the local preview on http://127.0.0.1:4321/. Optional GLOSSO_QA_DIR and GLOSSO_QA_HTML support screenshots/private image fixtures. These checks are targeted regression tests, not a substitute for evaluation with disabled users or assistive technology. [W3C WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/).

## Public legal handoff

The completed drafts are in gitignored legal-review/. Operator approval is still needed for exact text and proposed operating deadlines. Actual contacts/provider facts must be completed. Before release, the approved bodies must replace the old legal pages; do not remove warnings from stale prose. Artistic copy remains BLANK and no contributor agreement is executed merely by creating these files.
