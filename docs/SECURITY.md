# Security checks and deployment boundaries

The September 2026 security review covered the public directory, static output,
content URL validation, managed media resolution, Git index and reachable history,
dependency advisories, and local browser behavior. It did not verify Cloudflare
account settings, remote deployment history, credentials held by third parties,
or live HTTP responses. Passing these checks is not a guarantee against all defects.

## Public files and private material

`pnpm check:public` runs before development and production builds. It enforces
the explicit public-file inventory in `scripts/lib/exposure.mjs`, rejects symbolic
links/junctions, and checks private paths and recognized credential patterns.
Adding a public file requires reviewing its bytes and updating that inventory.
The existing original frog, fonts/licenses, favicon and approved `llms.txt` remain
unchanged. Only the security-header configuration was added to `public/`.

Publication images, audio and PDFs belong in `publication-assets/`, referenced
through `/media/`. Existing release selection and real-path containment checks
control which files reach the build. Keep private submissions outside public Git
even when the build would exclude them. MDX executes at build time and must be
treated as trusted, reviewed code; these checks do not sandbox submissions.

`pnpm check:launch` examines output for private/source paths, key files, source
maps, backup/database files, symbolic links, recognized credentials, legal draft
markers and executable inline scripts incompatible with the CSP. The Git index
audit also checks nested/case-varied private paths, Cloudflare `.dev.vars`,
credential configuration files, symlinks/submodules and the public inventory.
Scans suppress suspected secret values. They cannot recognize every secret,
private document or sensitive fact, especially inside binary formats.

The reachable-history scan found no matches across 124 unique blobs at the
review baseline. This is a pattern-based finding, not proof that history contains
no sensitive information. No private files or Git history were deleted.

## Browser protections

`public/_headers` uses [Cloudflare Workers Static Assets headers](https://developers.cloudflare.com/workers/static-assets/headers/).
It sets MIME-sniffing protection, anti-framing controls, a referrer policy,
camera/microphone/geolocation restrictions and a Content Security Policy.
Executable scripts are bundled as local files. Inline scripts and `eval` are not
allowed. Inline styles remain allowed for existing image presentation and motion.
HTTPS images/media remain supported. Cloudflare Web Analytics origins are allowed
in anticipation of the owner's provider choice; this does not install or enable
analytics. The policy prevents plugin embeds and framing of the site by default.

Contributor websites accept HTTP(S) only, with no embedded credentials; update
links accept safe local paths or HTTPS. The JSON-LD serialization retains its
existing escaping of `<`.

## Verification

The owner approved upgrading Astro 5 to Astro 7.3.5 with compatible MDX tooling.
The previous unified Markdown processor and HTML whitespace behavior are explicit
so the upgrade preserves contributed work. `pnpm audit` reported zero known
vulnerabilities after the upgrade; rerun it because advisory data changes.

Run `pnpm test:security`, `pnpm test:launch`, `pnpm test:publishing`,
`pnpm test:homepage`, `pnpm test:release-build`, `pnpm test:images`, and
`pnpm build:launch` for security/publishing changes. Explicitly stage only reviewed
files before the repository audit and any commit/push.

For browser verification, run `node scripts/check-security-browser.mjs` with
`GLOSSO_PLAYWRIGHT_PATH` and optionally `GLOSSO_CHROME_PATH` pointing to installed
runtimes. It serves only the built output on loopback, applies the configured
headers, and checks desktop/mobile pages, blocked inline injection, notice actions,
no-JavaScript fallback and private-path 404s. This simulates headers locally;
verify actual headers and real 404 responses after an authorized deployment.

The existing Cloudflare guarded-build requirement still applies. Push to a
review branch unless the actual production build configuration has been verified;
do not treat this review as authorization to deploy or change account settings.
