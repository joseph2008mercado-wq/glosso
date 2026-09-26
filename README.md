# Glosso

The first website for Glosso, Glosso Collective and Glosso Magazine. Built with Astro, TypeScript and MDX for static hosting.

## Run locally

The audited runtime is Node.js 24.19.0 (`.node-version`) and pnpm 11.25.0 (`packageManager`).

```sh
pnpm install
pnpm dev
```

Open `http://127.0.0.1:4321/`. To check the production version:

```sh
pnpm build
pnpm preview
```

Open `http://127.0.0.1:4321/` again. The build output is `dist/`.

## Publishing

Read [docs/PUBLISHING.md](docs/PUBLISHING.md) for adding writing, issues, contributors, images, audio and PDFs. General contact and submission addresses are in `src/data/site.ts`. The owner supplied `contact@glosso.org` for general contact and the homepage UX notice; the submissions address remains unset. The UX notice opens the visitor's email handler and offers a selectable address and copy button; no form backend or automatic email sending is involved.

Editorial prose must be supplied and approved by the owner. Missing prose displays `BLANK`; collection entries are withheld from publication until marked `approved: true`. The legal pages retain unreviewed drafts with visible notices and `noindex`; review the outstanding facts in [docs/LEGAL_REVIEW.md](docs/LEGAL_REVIEW.md) before release.

Use `pnpm new:content` to create safe unapproved drafts; see the publishing guide for arguments. Released entries also require `draft: false` and a reached publication date. Monthly and special editions use the existing issue routes; specials are categorized separately. Put publication media in `publication-assets/` and reference `/media/...`, not in always-public `public/`. Scheduled release requires a new build and approved deployment at or after the date.

`pnpm test:publishing` checks publication gates, credits, issue relationships, managed media, populated page templates and search metadata. `/sitemap.xml` and `/robots.txt` are generated automatically. Engagement stays unconfigured until the operator approves a metric and source.

For Cloudflare Pages use the guarded build command `pnpm build:launch`, output `dist`, and the settings in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). This intentionally blocks release until legal/operator approvals are complete; ordinary `pnpm build` is for local verification only. Use the single [final launch checklist](docs/FINAL_LAUNCH_CHECKLIST.md) for outstanding decisions and [audit](docs/LAUNCH_AUDIT.md) for evidence. Both Cloudflare Web Analytics and dashboard traffic analytics are planned, not yet activated by this project. No runtime secrets are needed. Publishing to GitHub or Cloudflare requires the owner's approval.

Legal review drafts live in gitignored `legal-review/`, not in website output. Never commit private submissions or future/unapproved contributor material to this public repository. Run `pnpm audit:repository` after explicitly staging reviewed files; a local draft exclusion from the site does not protect its source in Git.

The current frog artwork is copied from the owner's supplied file to `public/art/glosso-frog.png` without alteration.

## Visual implementation

The shared interface uses locally hosted Bricolage Grotesque and DM Sans. Their Open Font License files are included in `public/fonts/`; no font-service request is required.

The homepage leads with the current monthly issue, then the latest article, most-read work and updates. Its visual system uses layered folio planes, asymmetric typography and a shared ribbon motif. Until approved content is available, non-linked BLANK layouts remain explicitly unpublished; these are not content collection entries or published pages.

Motion uses shared timing/easing tokens, one-time CSS entrances and ribbon unfurls, and responsive link interactions. A small IntersectionObserver script triggers entrances; there is no animation dependency, pointer tracking, replay UI or continuous animation. Reduced-motion mode disables motion. Navigation and publication content remain usable without JavaScript.

Run `pnpm test:homepage` for selection and in-memory component-rendering checks. Test fixtures never enter the content collections or public build.
