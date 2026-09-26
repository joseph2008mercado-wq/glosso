# Cloudflare Pages deployment runbook — NOT EXECUTED

Prepared 2026-09-23. No push, branch change, account creation, analytics activation, DNS change or deployment is authorized by this document. Preserve the visual design and editorial policy.

Status update 2026-09-24: use `FINAL_LAUNCH_CHECKLIST.md` as the single current approval checklist. The operator confirmed adults-only international submissions, no registered business, mailing list or monetization, and the nonexclusive worldwide contributor arrangement. Do not add a guardian-intake or ecommerce workflow. The revised private legal packet does not approve the old public legal routes.

## Verified project and repository state

- Astro 5 static build with MDX; canonical origin `https://glosso.org`, trailing slashes, output `dist/`. No Cloudflare adapter, Functions, database or runtime secrets needed by current code.
- Existing origin: `https://github.com/joseph2008mercado-wq/glosso.git`.
- GitHub connector: repository visibility **public**, default branch metadata **main**, branch list empty at audit time. No populated remote branch was found.
- Local branch **master**, no commits, no tracked/staged files. A remote URL is not evidence of a push.
- Local Git HTTPS transport failed because `git-remote-https` was unavailable. Connector read-only checks succeeded; fix the local Git installation/exec-path before trying a push. Do not work around this with a new repository or overwrite remote history.
- Cloudflare account, Pages project, zone, registrar/DNS and live domain are **unverified**. No Cloudflare resources or credential files were configured by this work. Source absence cannot rule out a separately configured account.

## Required build configuration

Cloudflare supports Astro static output. Keep the current framework and routes. [Astro on Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/).

| Setting | Required value |
| --- | --- |
| Existing GitHub repository | `joseph2008mercado-wq/glosso` |
| Production branch | `main`, after owner-approved initial publication/reconciliation |
| Root directory | Repository root; no subdirectory |
| Framework preset | Astro |
| Build command | `pnpm build:launch` |
| Output directory | `dist` |
| Node | `24.19.0`, pinned in `.node-version`; set `NODE_VERSION=24.19.0` if needed |
| pnpm | `11.25.0`, recorded in package.json; set `PNPM_VERSION=11.25.0` |
| Build telemetry | `ASTRO_TELEMETRY_DISABLED=1` recommended |
| Runtime variables/secrets | None required by the current static site |

Node/pnpm environment overrides are supported by the Pages build environment. Test the selected build image and locked dependency installation in the actual account; local success is not a remote-build guarantee. [Build image configuration](https://developers.cloudflare.com/pages/configuration/build-image/).

The launch command deliberately fails today: old unreviewed legal pages remain and `launch-approval.json` flags are false. Local `pnpm build`/`pnpm preview` still work. Do not switch the production command to bypass this guard. All flags require real decisions and evidence, not mechanical changes to make a build pass. Even a passing guard does not authorize deployment or certify compliance.

## Public repository hygiene before any commit

1. Keep submissions, contracts, private identity details, API credentials and legal-review correspondence outside public Git. `legal-review/`, `private-submissions/`, `private-records/`, `.env*`, `.wrangler/` and common private-key files are ignored locally; ignoring does not erase history. Do not collect guardian records for the adults-only launch intake.
2. Complete approved public content privately. Do not commit draft/future entries or their media to this public repository. The development scaffold writes unapproved files under src/content; they must remain untracked until reviewed and eligible for public release. Cloudflare Git builds cannot use ignored local media: only approved assets needed by released content may enter Git.
3. Explicitly stage reviewed paths, never blanket `git add .`. Build, then run `pnpm audit:repository`. It inspects staged/tracked bytes for private paths, common credential patterns, unapproved/future content and media absent from the release build. This is a limited safeguard, not exhaustive secret scanning. Review `git diff --cached` and the full history manually before push. The audit does not automatically run as a Git hook.
4. If a secret or private file was previously pushed, removing it now is insufficient: rotate credentials, restrict access, evaluate history/remote-copy cleanup and required notifications with the operator. No such incident is inferred by this audit.

## First push: separate explicit approval required

Recheck the remote immediately before pushing; it may have changed. Do not create a replacement repository, force-push or switch branches without approval.

After Git transport is repaired, approved files are committed and remote `main` is still absent, an approved initial push can map local master to remote main with `git push origin master:main`, preserving the local branch name. This command has **not** been run. If remote main has acquired commits, stop and inspect/reconcile them instead of overwriting. An upstream/tracking change is optional and needs a separate deliberate decision; renaming master is not required for Pages to deploy main.

## Cloudflare account steps — after approval

1. Confirm the actual account owner, Pages project name, free-plan availability and domain control. Enable MFA and minimum necessary collaborator roles. Do not store account IDs/tokens or completed legal records in public files if private.
2. In Workers & Pages, use Pages Git integration and authorize the Cloudflare GitHub App for **only the existing Glosso repository**. Select main and the build settings above. Account connection/project creation may trigger a deployment: do not complete a deployment action before legal/content review and explicit release approval. [GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/).
3. Disable unwanted automatic production/preview deployments until the operator has approved a release workflow. A Git push can become a publication event once integration is enabled. Preview URLs are not confidential simply because they are hard to guess or noindex; use approved access restrictions if previews are needed. No private submissions may enter any preview build. [Preview deployment controls](https://developers.cloudflare.com/pages/configuration/preview-deployments/).
4. Configure the final custom domain through the Pages **Custom domains** interface. For apex `glosso.org`, the domain must be a zone in the same Cloudflare account with the required Cloudflare nameservers. Inventory and preserve existing MX/TXT/DNSSEC records before registrar changes. Add the domain in Pages rather than merely inventing a CNAME. For approved `www`, configure that hostname and redirect it to the canonical apex. Values for assigned nameservers and `<project>.pages.dev` must come from the actual account. [Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).
5. Confirm certificate issuance, HTTPS, canonical redirects, no redirect loops, real 404s and the desired treatment of the production pages.dev alias. Do not blindly redirect preview hosts or expose them as alternate indexed sites. Verify robots/sitemap at the final domain after the approved deployment.

## Analytics — both selected, not activated

The operator selected **Cloudflare Web Analytics** and **dashboard traffic analytics**. No analytics API token, browser snippet or consent manager has been added to the source. These choices do not approve a Most Read formula.

- Web Analytics: Pages offers Metrics → Web Analytics → Enable; the beacon is added on the next deployment. Prefer one verified setup method, not both automatic injection and a manual duplicate. Review the planned privacy policy and any legally required regional/consent controls before activation. No browser secret is needed for this dashboard-managed route. [Pages Web Analytics setup](https://developers.cloudflare.com/pages/how-to/web-analytics/).
- Dashboard traffic analytics: verify the actual proxied zone/Pages traffic datasets available on the existing free plan. Do not enable paid HTTP analytics, Logpush, Workers Analytics Engine or exports by assumption. Confirm access roles, retention and provider terms.
- After authorized activation, inspect actual script/POST requests, cookies/storage and settings. Confirm a single beacon, intended hostnames, no sensitive URLs, and that blocking analytics does not break reading/navigation. Reconcile the legal draft with this evidence before approving its public text. Do not infer a universal cookie-consent exemption.
- Keep any future API credential in a scoped Cloudflare/GitHub secret store, never `PUBLIC_*` variables or source. Git integration and dashboard analytics do not require a Cloudflare API token in this project.

## Resource and PDF constraints

No R2 bucket, KV, D1, Worker or paid service is currently necessary. Pages has a 25 MiB per-asset limit; check finished magazine PDFs before choosing this host for them. If larger, obtain approval for an appropriate external HTTPS host or other storage and update privacy/rights disclosures; do not silently enable paid R2. [Pages limits](https://developers.cloudflare.com/pages/platform/limits/).

## Release verification and rollback

After legal approval and explicit deployment approval, verify the published domain, all navigation, content/credits, monthly/special issue separation, PDF bytes/MIME/download behavior, accessibility, analytics and search metadata. Scheduled content needs a later build/deploy; there is no scheduler.

Record the approved commit, build, legal versions, rights records and release time privately. Identify a previously approved safe build for rollback. Do not roll back to a build exposing removed private/infringing material. Removal may also require cache purge and deleting old accessible deployments; current-output omission alone does not revoke earlier copies.
