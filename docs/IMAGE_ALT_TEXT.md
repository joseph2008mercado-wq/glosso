# Editing image alternatives

No CMS or new service is needed. Edit the same Markdown/MDX entry used to publish the work. `pnpm new:content` now includes the relevant alt fields. Replace BLANK with your own accurate description before releasing an image.

| Image | Field in its content file |
| --- | --- |
| Article's main image | `coverAlt` beside `cover` |
| Separate article browsing thumbnail | `thumbnail.alt` beside `thumbnail.src` |
| Monthly or special issue cover, including homepage folio | `coverAlt` beside `cover` |
| Contributor portrait, on listing and profile | `portraitAlt` beside `portrait` |

For example, in an unpublished work:

```yaml
cover: /media/your-image.png
coverAlt: BLANK
thumbnail:
  src: /media/your-thumbnail.png
  alt: BLANK
```

Keep the entry unapproved until you have replaced these placeholders. This example does not create a published work. Put image files in `publication-assets/`, not private submissions in `public/`.

For an image within Markdown or MDX body text:

```md
![BLANK](/media/your-image.png)
```

Replace the text between brackets with your description. For explicit HTML/MDX, edit the `alt` attribute:

```html
<img src="/media/your-image.png" alt="BLANK" />
```

List body-image paths in the entry's `assets` field so managed media is released with it. Preserve the original artwork and describe what matters in context; do not invent artistic interpretations or repeat a filename. Complex work may also need a human-authored longer description in the body, beyond its short alternative.

Use `alt=""` (or `coverAlt: ""` etc.) only when an image is genuinely decorative or redundant. The header frog has an empty alternative because its home link already says “Glosso home” and includes the visible name. Decorative SVG ribbons/stages are hidden from assistive technology; adding spoken descriptions to those would add noise. Do not mark contributors' meaningful artwork decorative just to pass checks.

`pnpm build` now checks every rendered HTML image, including body images, and fails for a missing alt attribute, whitespace-only text or BLANK. Drafts may retain BLANK because unpublished content is not rendered. `pnpm test:images` tests this safeguard. The check cannot establish the accuracy of descriptions, PDF accessibility, accessible SVG content, or full WCAG conformance; review those separately.
