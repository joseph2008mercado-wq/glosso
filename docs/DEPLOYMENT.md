# Cloudflare Workers static deployment runbook

> Current status — 2026-09-26: the owner explicitly approved publication and removal of administrative approval blockers. Public privacy/cookie notices now match verified application behavior and distinguish conditional Cloudflare services. Public draft banners are removed. Independent legal review and Cloudflare account verification are not claimed; their flags remain false and informational. Private contracts and review records remain private. Earlier blocked-release observations below are historical, not requests to obtain the same approval again.


Updated 2026-09-26. Hosting target: the existing `glosso` Worker, not a new Cloudflare Pages project. This runbook does not approve public release, legal text, analytics activation or DNS changes. Use [FINAL_LAUNCH_CHECKLIST.md](FINAL_LAUNCH_CHECKLIST.md) for outstanding approvals.

## Repository and static configuration

- Existing repository: `https://github.com/joseph2008mercado-wq/glosso.git`; production branch: `main`. The repository is populated; the earlier empty-repository/first-push instructions are obsolete. Recheck remote state before every release; never force-push over it.
- Astro 7 and MDX generate static files in `dist/`. The owner approved the framework security upgrade; retain `compressHTML: true` and the unified Markdown processor for existing rendering behavior. Keep `output: 'static'`, canonical origin `https://glosso.org` and trailing-slash routes. No server-side rendering, Cloudflare Astro adapter or Worker JavaScript entry point is required.
- Root `wrangler.jsonc` names `glosso`, sets compatibility date `2026-09-26`, points assets to `./dist`, and uses `not_found_handling: '404-page'`. This supplies explicit configuration so deployment need not auto-configure Astro. Missing routes should serve the generated `404.html` with HTTP 404, not a homepage fallback.
- Cloudflare account settings, build commands, zone ownership, DNS, credentials and live deployment are not verified by the repository. A configuration file is not evidence of an active service.

Cloudflare documents [static Astro deployment without an adapter](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/) and [static-site asset routing](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/).

## Required Workers Builds settings

In Cloudflare **Workers & Pages → glosso → Settings → Builds**, inspect the existing Git connection. Use the existing GitHub repository; do not create a replacement repository or Pages project. The dashboard Worker name must match `glosso` in Wrangler.

| Setting | Required value |
| --- | --- |
| GitHub repository | `joseph2008mercado-wq/glosso` |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | `pnpm build:launch` |
| Deploy command | `npx wrangler deploy` |
| Static assets | `./dist`, read from `wrangler.jsonc` |
| Node | `24.19.0` via `.node-version`; set `NODE_VERSION=24.19.0` in build variables |
| pnpm | `11.25.0` via `packageManager`; set `PNPM_VERSION=11.25.0` in build variables |
| Optional build variable | `ASTRO_TELEMETRY_DISABLED=1` |
| Application runtime variables/secrets | None required |

Keep the committed pnpm lockfile and development dependencies available for the build (`astro check` needs them). Use the upgraded dependencies in that lockfile; no adapter is needed. Wrangler runs as a deployment tool, not as a website dependency. Verify the locked dependency installation and selected tool versions in Cloudflare's actual build log.

Workers Builds manages deployment authentication separately from site code. Confirm the GitHub App has access to this repository and the build's Cloudflare deployment token has the required permissions. Do not put tokens, operator records or secrets into Git, public assets or `PUBLIC_*` variables. No R2, KV, D1, database, runtime binding or paid service is needed for the current site.

References: [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [build image and version overrides](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/), [GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/).

## Mandatory release safeguard

`pnpm build:launch` runs the static build, repository audit and launch check in sequence. It requires operatorApproved, publicPoliciesApproved and publicContentAndRightsReviewed; the owner explicitly granted these approvals on 2026-09-26. Independent legal review and account verification remain informational, not fabricated approvals. Private files and any remaining draft-marked public pages still block. A failed build must prevent the deploy command from running. Do not replace it with `pnpm build`, append a failure-ignoring command, remove draft notices, or change approval flags just to pass CI. A passing check is not legal certification or independent deployment authorization.

**Wrangler does not enforce this guard itself.** `npx wrangler deploy` can upload an existing local `dist`, including unreviewed legal pages. Do not run it manually unless the guarded build has just passed for the same reviewed checkout and release is authorized. A dry run (`npx wrangler deploy --dry-run`) validates configuration without publishing and is not release approval.

Before a production push/merge:

1. Verify the actual account's build command is exactly `pnpm build:launch` and the deploy command runs only after success. If this cannot be verified, submit a review PR instead of pushing to `main`; do not merge it yet.
2. Disable nonproduction/preview builds until their guard and access policy are verified. A draft PR is not an access control: connected branch builds or preview URLs may still publish files. Do not assume a preview is confidential or safe because it has `noindex`.
3. Disable/disconnect automatic builds if the configured commands are unsafe or uncertain. Reconnect only after the commands and branch rules are correct; connection or retry actions can trigger a deployment.
4. Resolve the genuine legal/content/account decisions in the launch checklist. Record approvals only after the operator actually grants them and appropriate legal review is complete.
5. Review changed files, explicitly stage only approved paths, then run the repository audit before committing. Keep private submissions, legal-review documents, credentials and unpublished contributor sources/media out of this public repository.

See [production and preview branch controls](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/). Build settings live in the account; the repository cannot certify them.

## Local verification before release

```sh
pnpm build
pnpm test:publishing
pnpm test:homepage
pnpm test:release-build
pnpm audit:repository
pnpm build:launch
```

The last command must pass before release. The previous expected failure for four administrative flags has been superseded by explicit operator approval. Use `pnpm preview` for local inspection, not public publication. The isolated release test covers populated monthly/special issues and excludes drafts/scheduled work without inserting fixtures into the live site. Check output includes `404.html`, `robots.txt` and `sitemap.xml`.

The repository audit reads staged/tracked bytes. Run it again after explicit staging; a prior pass does not approve new files. Review `git diff --cached` and relevant history. Ignore rules do not erase tracked files or old commits; this audit is a limited safeguard, not exhaustive secret/copyright review. If a secret was exposed, revoke/rotate it and review remote/history cleanup rather than merely deleting the current file.

## Domain and account steps after release approval

1. Confirm ownership of the existing Worker and an active Cloudflare zone for `glosso.org`. Keep MFA and minimum necessary collaborator permissions. No account identifiers need to be published in this repository.
2. In **Workers & Pages → glosso → Settings → Domains & Routes**, add a **Custom Domain** for `glosso.org` after approval. Cloudflare provisions its DNS record and certificate. Inspect conflicting records first; preserve email MX/TXT and other existing records, especially those supporting `contact@glosso.org`. Do not invent nameserver/CNAME values or remove DNS records blindly.
3. If `www` is wanted, approve its hostname and redirect to the canonical apex. Verify HTTPS, certificate issuance, canonical URLs, robots/sitemap, real 404 status, navigation and any released PDF/media downloads on the live host.
4. Review `workers.dev` and preview URL exposure separately. Disable unnecessary public aliases or apply approved access controls; a new custom domain does not make old URLs private.

Reference: [Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/). No DNS or domain binding is automatically changed by the supplied Wrangler configuration.

## Analytics and publication assets

Both Cloudflare Web Analytics and dashboard traffic analytics were selected, not verified as activated. Inspect the actual zone/Worker and Web Analytics settings before finalizing privacy disclosures. Do not follow the old Pages-only automatic beacon instructions. If authorized, use one verified Web Analytics setup method, check the live requests/storage and avoid duplicate beacons. Confirm datasets, access, retention and regional controls; do not enable paid logging or infer a Most Read metric. Credentials belong in scoped account secrets, never public source.

Keep unpublished material in private storage. `public/` is always public; managed `publication-assets/` only emits eligible release references, but Git itself is public. Check finished PDFs against current [Workers Static Assets limits](https://developers.cloudflare.com/workers/static-assets/platform/limits/) before upload. Oversized assets require an explicitly approved hosting decision, not an automatic paid-service addition.

## Release record and rollback

Record the approved commit, legal versions, rights evidence and successful build/deployment privately. Scheduled publication still requires a later approved build/deploy. Roll back only to a previously approved safe version. Removing files from the newest output does not revoke old deployment URLs, caches or downloaded copies; review those separately when handling withdrawal or private-file incidents.
