# Glosso — final review report and launch checklist

2026-09-24. **Review drafts complete; not cleared for public release.** This is the one current decision report. The [six-document packet](../legal-review/README.md) is private/gitignored. [Implementation cross-check](../legal-review/IMPLEMENTATION-CROSSCHECK.md) covers every draft section; [technical evidence](LAUNCH_AUDIT.md) and [deployment instructions](DEPLOYMENT.md) support this report. No redesign, editorial writing, push or deployment.

## 1. Verified defects fixed

- Labeled placeholder spans/divs lacked a role supporting their accessible names. Added group semantics without changing appearance or BLANK content.
- The homepage heading/archive row overflowed at 320px with WCAG text-spacing overrides. It now wraps when necessary, retaining the normal composition.
- An open mobile menu covered the next focused link when tabbing into homepage/404 content. It now closes when keyboard focus leaves the menu, without moving focus away from the intended link.
- Retested the earlier skip-link focus and enlarged-text navigation fixes.
- Corrected draft wording that implied Cloudflare was already processing this site's traffic. All account-dependent services are now identified as planned/unverified.
- Clarified individual contracting capacity and final editorial control over selection, scheduling, copyediting, presentation, headlines and removal; substantial-change/work-title approval and accurate attribution remain explicit. No copyright transfer or AI-training rights.

Production build, publishing/isolated release tests and targeted accessibility/runtime privacy checks pass. Axe-core 4.13.0 found **zero automated A/AA violations across 36 scans** of 12 routes at desktop/mobile widths, including open mobile menus. Keyboard visibility/obscuration and text-spacing checks passed. Fourteen scan-state contrast results remain automated **incomplete** due to layered graphics/overlays; targeted color checks are not a full contextual contrast or screen-reader evaluation. **No full WCAG 2.2 AA conformance claim.**

**Forms and public magazine PDFs: not present, not passed.** Source, output and navigable links contain neither. Future PDFs need actual tag/reading-order, text/alternative, language, contrast, keyboard and assistive-technology checks before release; existing download-link tests do not establish PDF accessibility.

## 2. Genuine blockers before launch

- [ ] Supply the responsible individual's required notice details and a working monitored privacy/copyright/contact address. Current addresses are null.
- [ ] Resolve applicable privacy disclosures using the actual Cloudflare configuration, then approve the exact public text. No beacon is installed locally; no Cloudflare account access was available. Provider retention, roles, exports, security cookies and regional controls cannot be certified from code.
- [ ] Replace the old legal route bodies with approved versions. The old privacy page still incorrectly mentions Google Fonts; all four legal routes remain unreviewed and launch-blocked. Do not remove warnings from stale wording.
- [ ] Record genuine release approvals and configure/test the actual host per the runbook. `pnpm build:launch` intentionally rejects four false flags and four old draft routes. Re-run the repository audit after explicit staging: its current zero-file pass does not approve future private files.

An honest empty/read-only launch does **not** require invented articles, a CMS, forms, guardian intake, paid services, a ranking metric, ecommerce/newsletter terms or blanket DMCA registration. Optional browser analytics may stay disabled until its disclosures/configuration are resolved. Account-side behavior and live HTTPS/404/private-file checks still need verification during the operator's release.

## 3. Information or decisions needed from you

- Actual operator country/state for applicability review; public contact email and required notice identity. No home address will be inferred or published by default.
- Cloudflare Pages/zone and both analytics settings, access roles, retention/exports and actual cookies. No account IDs or secrets need to be public.
- Approve or change the proposed **30-day post-publication withdrawal/removal** and **90-day closed-correspondence/rejected-work retention** commitments; establish a justified private contract-record period.
- **Only before intake opens:** mailbox/storage providers, authorized reviewers, backups/deletion, file limits, opening status and simultaneous/prior-publication policy. Supply artistic instructions yourself; BLANK remains.
- **Only before each contribution is released:** recorded agreement identifying work, credit, payment or expressly unpaid status, print quantity/window, promotion and special-edition permissions. Future reprints/commercial uses require further agreement. Rights collection is an editorial process, not an automatic consequence of `approved: true`.

## 4. Specific provisions for qualified legal review

- Individual identity/disclosure and recorded electronic assent; contributor capacity in relevant jurisdictions.
- Agreement §§2–7: license scope, moral rights, headline/substantial-change boundary, attribution, compensation/cancellation, archive termination and existing print stock, reprints/commercial uses.
- Privacy: actual territorial scope/thresholds, lawful basis and required notices where applicable, provider transfers, security/analytics consent rules, retention/deletion exceptions and privacy-request handling. International submissions alone settle none of these.
- Copyright procedure: contested complaints and any applicable/elected section 512 process; no safe harbor asserted.
- Accessibility and any actual child-data obligations under applicable law. The technical WCAG benchmark is not a legal conclusion or an assumption that government-web rules apply to this publication.

No fact, signature, approval or legal sufficiency has been fabricated. Review warnings remain until exact versions and required facts are approved.
