import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

// Compile the actual feature components in memory. Nothing is added to src/content,
// src/pages or dist, and fixtures use only BLANK for editorial fields.
const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve('astro/package.json'));
const { transform } = astroRequire('@astrojs/compiler-rs');
const styles = [];
const modules = new Map();
async function compile(file) {
  file = resolve(file);
  if (modules.has(file)) return modules.get(file);
  let source = await readFile(file, 'utf8');
  if (file.endsWith('.astro')) {
    const result = await transform(source, { filename: pathToFileURL(file).href, internalURL: 'astro/compiler-runtime', compressHTML: true, resultScopedSlot: true, renderScript: true });
    source = result.code.replace(/^import ["'][^"']+\?astro[^"']+["'];?\s*$/gm, '');
    // These server-only components have no hydrated islands or bundler metadata.
    source = source.replace(/,\s*createMetadata as \$\$createMetadata/, '')
      .replace(/^export const \$\$metadata = \$\$createMetadata\([\s\S]*?\);\s*/m, '');
    styles.push(...result.css.map((entry) => typeof entry === 'string' ? entry : entry.code));
  }
  let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const specs = [...new Set([...code.matchAll(/from ["']([^"']+)["']/g)].map((match) => match[1]))];
  for (const spec of specs) {
    const url = spec.startsWith('.')
      ? await compile(resolve(dirname(file), spec.endsWith('.astro') ? spec : spec + '.ts'))
      : pathToFileURL(require.resolve(spec)).href;
    code = code.replaceAll("'" + spec + "'", JSON.stringify(url)).replaceAll('"' + spec + '"', JSON.stringify(url));
  }
  const url = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
  modules.set(file, url);
  return url;
}
const Issue = (await import(await compile('src/components/IssueFeature.astro'))).default;
const Article = (await import(await compile('src/components/ArticleFeature.astro'))).default;
const Image = (await import(await compile('src/components/PublicationImage.astro'))).default;
const { browsingImage } = await import(await compile('src/lib/publication-image.ts'));
const container = await AstroContainer.create();
const emptyIssue = await container.renderToString(Issue);
assert.match(emptyIssue, /Unpublished/);
assert.doesNotMatch(emptyIssue, /Read Issue|download/);
const cover = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="#00e3c0"/><text x="150" y="210" text-anchor="middle" font-size="35">BLANK</text></svg>');
const issue = { id: 'test-issue', data: { title: 'BLANK', description: 'BLANK', published: new Date('2026-09-01'), cover } };
const digital = await container.renderToString(Issue, { props: { issue } });
assert.match(digital, /href="\/issues\/test-issue\/"/);
assert.match(digital, /Read Issue/);
assert.doesNotMatch(digital, /download/);
const withPdf = await container.renderToString(Issue, { props: { issue: { ...issue, data: { ...issue.data, pdf: '/test.pdf' } } } });
assert.match(withPdf, /href="\/test.pdf"/);
assert.match(withPdf, /download/);
const work = { id: 'test-work', data: { title: 'BLANK', summary: 'BLANK', published: new Date('2026-09-01') } };
const textOnly = await container.renderToString(Article, { props: { label: 'Latest Article', work, names: ['BLANK'] } });
assert.match(textOnly, /href="\/read\/test-work\/"/);
assert.doesNotMatch(textOnly, /<img/);
const withImage = await container.renderToString(Article, { props: { label: 'Most Read', work: { ...work, data: { ...work.data, cover } }, names: ['BLANK'], unavailable: true } });
assert.match(withImage, /<img/);
assert.match(withImage, /article-secondary/);
assert.doesNotMatch(withImage, /Data unavailable/);
const unavailable = await container.renderToString(Article, { props: { label: 'Most Read', unavailable: true } });
assert.match(unavailable, /Data unavailable/);
assert.doesNotMatch(unavailable, /<a /);
assert.equal(browsingImage({ cover }).src, cover);
assert.equal(browsingImage({ cover }).fit, 'contain');
assert.equal(browsingImage({ cover, coverAlt: 'BLANK', thumbnail: { src: '/media/other.webp' } }).alt, 'BLANK');
const thumbnailWork = { ...work, data: { ...work.data, cover: '/media/original.png', thumbnail: { src: cover, alt: 'BLANK', fit: 'cover', position: [25, 75] } } };
const overridden = await container.renderToString(Article, { props: { label: 'Latest Article', work: thumbnailWork } });
assert.doesNotMatch(overridden, /original.png/);
assert.match(overridden, /--image-fit:cover/);
assert.match(overridden, /--image-position:25% 75%/);
const imageTests = [];
for (const [width, height] of [[300, 400], [600, 300], [400, 400]]) {
  const src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect x="2" y="2" width="${width - 4}" height="${height - 4}" fill="#00e3c0" stroke="#171918" stroke-width="4"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="35">BLANK</text></svg>`);
  for (const ratio of ['3 / 4', '4 / 3']) {
    const rendered = await container.renderToString(Image, { props: { src, alt: 'BLANK', ratio } });
    assert.match(rendered, /--image-fit:contain/);
    assert.match(rendered, /loading="lazy"/);
    imageTests.push(rendered);
  }
}
if (process.env.GLOSSO_QA_HTML) {
  const css = await readFile('src/styles/global.css', 'utf8');
  await writeFile(process.env.GLOSSO_QA_HTML, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="http://127.0.0.1:4321/"><style>' + css + '\n' + styles.join('\n') + '</style></head><body><main class="wrap"><h1>Layout test · Unpublished</h1>' + digital + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:2rem;margin:2rem 0">' + textOnly + withImage + overridden + '</div><section aria-label="Image aspect-ratio tests" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:2rem;margin:2rem 0">' + imageTests.join('') + '</section></main></body></html>');
}
console.log('Feature rendering checks passed: empty states, digital issue, optional PDF, article links, artwork and text-only layouts. No fixtures published.');
