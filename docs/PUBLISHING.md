# Publishing with Glosso

Astro, TypeScript and MDX remain the publishing system: no CMS, accounts, database, tracking service or paid service has been added. The approved palette and editorial hierarchy are preserved; browsing images use reusable frames.

## Release rules

Every entry starts with `approved: false` and `draft: true`. A public work, issue or update requires both `approved: true` and `draft: false`, a reached `published` timestamp, and supplied required editorial text. BLANK titles, summaries, issue descriptions/covers and contributor names are withheld. Prose also requires a body; visual art may instead have a cover image. Every work requires at least one approved contributor profile.

Supply all editorial text verbatim; never generate missing prose. Preserve experimental punctuation, case, whitespace and line breaks. Missing optional prose and image descriptions remain BLANK, not generated alternatives.

Publication is evaluated in development as well as production. Drafts and future releases have no public routes, archive entries, homepage links, sitemap entries or managed media. No public draft-preview endpoint exists.

## Create an entry

Run from the project root:

```sh
pnpm new:content work YOUR-STABLE-SLUG YOUR-PUBLICATION-DATE
pnpm new:content issue YOUR-STABLE-SLUG YOUR-PUBLICATION-DATE
pnpm new:content special YOUR-STABLE-SLUG YOUR-PUBLICATION-DATE
pnpm new:content contributor YOUR-STABLE-SLUG
pnpm new:content update YOUR-STABLE-SLUG YOUR-PUBLICATION-DATE
```

Replace the uppercase command arguments before running. Slugs must be lowercase letters/numbers separated by hyphens. Dates must be real operator-supplied `YYYY-MM-DD` (midnight UTC) or `YYYY-MM-DDTHH:mm:ssZ` / an explicit UTC offset. The command invents no publication date or prose, writes only BLANK unapproved drafts, and refuses to overwrite an existing file. All content files may also be created manually as Markdown or MDX.

| Entry | File | Required supplied metadata before release |
| --- | --- | --- |
| Work | `src/content/writing/<slug>.mdx` | title, kind, contributors, published, summary, body or visual-art cover |
| Monthly issue | `src/content/issues/<slug>.mdx` | title, edition: monthly, month, published, description, cover |
| Special edition | `src/content/issues/<slug>.mdx` | title, edition: special, published, description, cover |
| Contributor | `src/content/contributors/<slug>.mdx` | name |
| Update | `src/content/updates/<slug>.mdx` | title, summary, published |

Every release additionally needs explicit approval and draft removal. All unsupplied writing stays BLANK. Do not mark placeholders as approved.

Keep filenames stable after publication: `/read/<slug>/`, `/issues/<slug>/` and `/contributors/<slug>/` are permanent canonical URLs. If a slug must change, obtain approval for a redirect; do not silently rename a published file.

## Individual works and author credit

1. Create and complete the contributor profile first. Optional fields: `role`, `location`, `portrait`, `portraitAlt`, `website`, `assets`. Put a supplied biography in the body; otherwise BLANK.
2. Create the work with `kind` set to `prose`, `poetry`, `essay`, `experimental` or `visual-art`.
3. Set `contributors` to the contributor filename slugs in credit order. The build rejects missing, draft or unapproved credited profiles.
4. Paste the artist's approved body without rewriting. Optional work fields: `subtitle`, `cover`, `coverAlt`, `audio`, `issue`, `assets`. The older `featured` field remains compatible but does not select homepage features.
5. Set `issue` to the monthly or special issue slug when associated. The issue must exist; an unreleased issue is not linked publicly from the work. A standalone work omits this field.
6. Review rights, image descriptions, author credit and the intended UTC release time before approval.

For exact text, set `presentation: verbatim` in a `.md` work's frontmatter and paste the original plain text directly into the body. The existing score styling displays the raw body without Markdown/MDX whitespace normalization, preserving line breaks, tabs, indentation and punctuation. A span inside the preformatted container prevents the HTML parser from discarding a leading newline. Narrow screens scroll the score instead of reflowing it.

For custom MDX/HTML layouts, leave `presentation: default`. Ordinary JSX text can normalize indentation even inside a pre tag. Use an explicit string expression if a small MDX section requires exact spacing:

```mdx
<pre class="score">{`BLANK`}</pre>
```

Replace only with the contributor's supplied writing; string expressions require escaping literal backticks and interpolation syntax. Prefer verbatim mode when the entire work needs exact source preservation. Ordinary paragraphs retain the existing readable prose styles. No editorial rewriting is performed.

## Monthly issues and special editions

Regular issues use `edition: monthly` and `month: "YYYY-MM"`. At most one released monthly issue may occupy each month; duplicates stop the build. Older files default to monthly and infer their month from the publication date. The newest released monthly issue fills the homepage primary feature. Previous issues remain permanently accessible in the archive.

Artist-led specials use `edition: special` and omit `month`. Their supplied title (including an approved Glosso by … title), cover, publication date, credits and optional PDF are independent. No fictional special has been created. Specials appear under Special Editions in the existing issue archive and never replace the monthly homepage feature.

Both categories use the same issue template, not separate interactive sites.

- Associate each contribution through the work's `issue` field.
- Optional `contents: [work-slug, another-work-slug]` sets reading order. Listed works must exist and point back to this issue. Draft/future contributions are hidden; other released contributions follow chronologically.
- Optional `credits: [contributor-slug]` controls credit order. Otherwise credits derive from the issue's released contributions.
- Supply the human-authored issue introduction in its MDX body, or leave BLANK.
- Add `pdf: /media/issue-slug/magazine.pdf` for a local finished PDF, or an HTTPS PDF URL. Omit the field until the finished file exists. External hosting may open the PDF rather than force a download.
- Adding a PDF later does not change the issue's permanent URL.

## Images, audio and PDFs without leaking draft files

### Change the homepage folio or an article image

No component editing is needed. These are frontmatter fields, between the `---` lines at the top of the entry file.

1. Place your finished image in `publication-assets/<existing-entry-slug>/`. Use a new filename when replacing an already published image to avoid visitors seeing a cached version.
2. In `src/content/issues/<existing-issue-slug>.mdx`, set the following fields (replace YOUR-SLUG and the filename):

   ```yaml
   cover: /media/YOUR-SLUG/cover-v2.webp
   coverAlt: BLANK
   ```

   The same image appears on the current monthly issue's homepage folio, its archive card and its permanent issue page. The folio has a stable 3:4 frame. Portrait, square and landscape images keep their proportions and remain fully visible, with white space when necessary. A 3:4 cover fills the folio edge to edge. The decorative paper layers and ribbon stay outside your cover.

3. In `src/content/writing/<existing-work-slug>.mdx`, use the same `cover` and `coverAlt` fields for the article's main image. Without other settings it also appears on the homepage and browsing cards, uncropped inside a 4:3 frame.
4. Optionally give that work a **different browsing image**, without changing the artwork on its reading page:

   ```yaml
   thumbnail:
     src: /media/YOUR-SLUG/thumbnail-v2.webp
     alt: BLANK
     fit: contain
     position: [50, 50]
   ```

   This override applies consistently to homepage, Read, contributor and issue-contents cards. It can also be used on a text-only work with no main cover. Remove the whole `thumbnail` block to return to the main cover. `fit: contain` is the default and preserves the full image. Choose `fit: cover` only if you intentionally want cropping; `position` is `[horizontal-percent, vertical-percent]`, each from 0 to 100, controlling the crop's focal point (default center). No filters, recoloring or animation are applied to the image itself.
5. Replace BLANK alt text only with your supplied image description. Run `pnpm build`, then preview the homepage, archive and detail page. Release flags and scheduling still apply; attaching a file does not publish a draft.

Use web-sized WebP/AVIF/JPEG/PNG exports rather than print-resolution files for browsing. Export optimization is an editorial production step; this site does not recompress or alter your original files. Use the PDF field for the finished print/digital magazine. HTTPS image URLs are supported, but their availability and privacy are controlled by the external host.

### Managed assets

Store publication media outside the always-public directory:

```text
publication-assets/<work-or-issue-slug>/cover.png
publication-assets/<work-or-issue-slug>/magazine.pdf
publication-assets/<work-or-issue-slug>/recording.mp3
```

Refer to these as `/media/<work-or-issue-slug>/cover.png`, etc. Use simple URL-safe filenames; no spaces, parent-directory traversal, encoded paths or symlinks outside the media root.

Cover, thumbnail, portrait, PDF and audio references are collected automatically from released entries. For additional body images, declare each URL in frontmatter `assets` and use the same URL in the body:

```yaml
assets:
  - /media/YOUR-SLUG/image.png
```

```mdx
<img src="/media/YOUR-SLUG/image.png" alt="BLANK" />
```

Replace YOUR-SLUG and image name with actual paths, and BLANK alt text only with a human-supplied description. Undeclared body media, missing local files and unsafe managed paths fail the build. Managed formats: PNG, JPG, JPEG, WebP, AVIF, GIF, PDF, MP3, M4A, OGG, WAV and FLAC. Files referenced only by drafts/future entries are not emitted. A file shared with an already released entry is intentionally public.

Existing `/art/...` and other legacy assets in `public/` remain supported, but **everything in public/ is always public**, regardless of content status. HTTPS-hosted media may also already be publicly accessible. Do not place unreleased media there.

This is not confidential document storage: private submissions must stay outside the public website repository. The ignored `private-submissions/` path is a convenience, not security or encryption. A public Git repository exposes committed draft source files even when the website excludes them. Deploy only `dist/`, never the whole project.

## Homepage and updates

The homepage selects the newest released monthly issue and the newest released individual work. It lists the four most recent released updates. Updates accept an optional local or HTTPS `href`; they do not need separate article pages.

**Engagement remains unconfigured.** `src/data/readership.ts` has `engagementApproved = false` and no data. The dormant 30-day pageview implementation is not an approved definition of engagement. Before enabling a ranking, the operator must specify:

- the metric and verified source;
- the measurement window and timezone;
- how ties are resolved;
- whether the latest article may also occupy the engagement slot;
- how and when verified data is refreshed.

Until then, the approved visual slot retains its BLANK/data-unavailable state and links to no ranked work. No totals, rankings or analytics have been invented or installed.

## Scheduling, release and search

A future `published` timestamp holds a release back at build time. After that time, a **new build and approved deployment** are necessary; an already deployed static site does not change on its own. No automatic scheduled deployment has been configured. Confirm the intended timezone before setting a release timestamp.

Before each release:

1. Review human authorship, rights, credit, supplied text, filenames, dates and media. Set `approved: true`, `draft: false` only for reviewed entries.
2. Run `pnpm test:publishing`, `pnpm test:homepage`, `pnpm test:release-build` and `pnpm build`. The release-build test creates a private temporary copy, verifies populated output through the real Astro pipeline, then removes its own fixtures; it never populates the live collections or dist.
3. Run `pnpm preview` and inspect `http://127.0.0.1:4321/`, the individual work/issue URL, issue contents, contributor archive and PDFs.
4. Check `dist/sitemap.xml`, `dist/robots.txt`, canonical URLs, author/date metadata and draft exclusions.
5. Obtain approval before committing/pushing/deploying. Deploy only the generated `dist`.

Published works, issues, contributor pages and About have canonical URLs and no indexing prohibition. Article/artwork, issue and About structured data use supplied content; no prose is synthesized. The sitemap uses the same publication gate and omits drafts and legal drafts. Cloudflare Workers serves the generated 404 page for nonexistent work URLs using `assets.not_found_handling: '404-page'` in `wrangler.jsonc`; see [deployment instructions](DEPLOYMENT.md).

After an approved public deployment, the operator can verify the domain in Google Search Console and submit `https://glosso.org/sitemap.xml`. Being crawlable does not guarantee Google indexing. Actual live accessibility and Search Console verification cannot be checked before deployment.

Legal drafts stay visibly unreviewed and noindex; see `docs/LEGAL_REVIEW.md`. Contact details and submission instructions remain BLANK until supplied.

Technical references: [Astro content collections](https://docs.astro.build/en/guides/content-collections/), [Google canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [Google article structured data](https://developers.google.com/search/docs/appearance/structured-data/article).
