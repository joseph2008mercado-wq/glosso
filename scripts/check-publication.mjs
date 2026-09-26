import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { mkdtemp, mkdir, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { createTestCompiler, moduleUrl } from './lib/test-module.mjs';

const load = createTestCompiler();
const { isReleased, hasSuppliedText, selectPublishedContent, validatePublication, issueContents } = await load('src/lib/publication.ts');
const { referencedAssets, isAssetUrl } = await load('src/lib/assets.ts');
const now = new Date('2026-09-23T12:00:00Z');
const approved = { approved: true, draft: false, published: new Date('2026-09-01T12:00:00Z') };
assert.equal(isReleased(approved, now), true);
assert.equal(isReleased({ ...approved, approved: false }, now), false);
assert.equal(isReleased({ ...approved, draft: true }, now), false);
assert.equal(isReleased({ ...approved, published: new Date('2026-09-23T12:00:01Z') }, now), false);
assert.equal(isReleased({ ...approved, published: now }, now), true);
assert.equal(hasSuppliedText('  BLANK\n'), false);
assert.equal(hasSuppliedText(''), false);
assert.equal(hasSuppliedText('Glosso'), true); // Existing owner-supplied name, not generated prose.
const person = { id: 'fixture-person', body: 'BLANK', data: { ...approved, name: 'Glosso', assets: [] } };
const monthly = { id: 'fixture-monthly', body: '', data: { ...approved, title: 'Glosso', description: 'Glosso', edition: 'monthly', month: '2026-09', cover: '/art/glosso-frog.png', credits: [person.id], contents: [], assets: [] } };
const special = { ...monthly, id: 'fixture-special', data: { ...monthly.data, edition: 'special', published: new Date('2026-09-02T12:00:00Z') } };
const work = { id: 'fixture-work', body: '', data: { ...approved, title: 'Glosso', summary: 'Glosso', kind: 'visual-art', cover: '/art/glosso-frog.png', contributors: [person.id], issue: monthly.id, assets: [] } };
const update = { id: 'fixture-update', data: { ...approved, title: 'Glosso', summary: 'Glosso' } };
const all = { contributors: [person], issues: [monthly, special], writing: [work], updates: [update] };
assert.equal(selectPublishedContent(all, now).writing.length, 1);
assert.equal(selectPublishedContent({ ...all, writing: [{ ...work, data: { ...work.data, title: 'BLANK' } }] }, now).writing.length, 0);
for (const collection of Object.keys(all)) {
  for (const flags of [{ draft: true }, { approved: false }, ...(collection === 'contributors' ? [] : [{ published: new Date('2099-01-01') }])]) {
    const entry = all[collection][0];
    const isolated = { contributors: [person], issues: [monthly], writing: [], updates: [], [collection]: [{ ...entry, data: { ...entry.data, ...flags } }] };
    if (collection === 'contributors') isolated.issues = [];
    assert.equal(selectPublishedContent(isolated, now)[collection].length, 0);
  }
}
assert.throws(() => validatePublication({ ...all, writing: [{ ...work, data: { ...work.data, contributors: [] } }] }), /credits/);
assert.throws(() => validatePublication({ ...all, issues: [monthly, { ...monthly, id: 'duplicate' }] }), /Monthly issue conflict/);
assert.throws(() => validatePublication({ ...all, issues: [{ ...monthly, data: { ...monthly.data, contents: ['missing'] } }] }), /contents entry/);
assert.deepEqual(issueContents(monthly, [work]).map((entry) => entry.id), [work.id]);
assert.equal(isAssetUrl('/media/../secret.pdf'), false);
assert.equal(isAssetUrl('/media/%2e%2e/secret.pdf'), false);
assert.equal(isAssetUrl('//example.com/file.pdf'), false);
assert.equal(isAssetUrl('javascript:alert(1)'), false);
assert.equal(isAssetUrl('https://example.com/issue.pdf?download=1'), true);
assert.deepEqual(referencedAssets([work, monthly]), ['/art/glosso-frog.png']);
assert.deepEqual(referencedAssets([{ data: { thumbnail: { src: '/media/thumbnail.png' } } }]), ['/media/thumbnail.png']);

// Every rendered editorial field is BLANK. Fixtures never enter content/, pages/ or dist/.
const preview = structuredClone(all);
preview.writing[0].data.assets = ['/media/fixture.png'];
for (const entries of Object.values(preview)) for (const entry of entries) {
  for (const key of ['title', 'description', 'summary', 'name']) if (key in entry.data) entry.data[key] = 'BLANK';
}
const fixtureState = moduleUrl(`export const content = ${JSON.stringify(preview)};for(const entries of Object.values(content)) for(const entry of entries) if(entry.data.published) entry.data.published=new Date(entry.data.published);`);
const format = moduleUrl((await import('typescript')).default.transpileModule(await (await import('node:fs/promises')).readFile('src/lib/format.ts', 'utf8'), { compilerOptions: { module: 99 } }).outputText);
const contentModule = moduleUrl(`import {content} from '${fixtureState}';export const publishedContent=async()=>content;export const publishedWriting=async()=>content.writing;export const publishedIssues=async()=>content.issues;export const publishedContributors=async()=>content.contributors;export const publishedUpdates=async()=>content.updates;export {displayDate,displayPublicationDate,displayKind} from '${format}';`);
const runtime = (await import('node:url')).pathToFileURL((await import('node:module')).createRequire(import.meta.url).resolve('astro/compiler-runtime')).href;
const renderMock = moduleUrl(`import {createComponent,render as html} from '${runtime}';export async function render(){return {Content:createComponent(()=>html\`<pre class="score">BLANK\n  BLANK</pre>\`)}}`);
const overrides = new Map([[resolve('src/lib/content.ts'), contentModule], ['astro:content', renderMock]]);
const renderLoad = createTestCompiler(overrides);
const container = await AstroContainer.create({ astroConfig: { site: 'https://glosso.org', trailingSlash: 'always' } });
const renderPage = async (file, path, props = {}) => {
  const module = await renderLoad(file);
  return container.renderToString(module.default, { props, request: new Request('https://glosso.org' + path), partial: false });
};
const article = await renderPage('src/pages/read/[...slug].astro', '/read/fixture-work/', { work: preview.writing[0] });
assert.equal((await (await renderLoad('src/pages/read/[...slug].astro')).getStaticPaths()).length, 1);
assert.match(article, /rel="canonical" href="https:\/\/glosso.org\/read\/fixture-work\/"/);
assert.match(article, /href="\/contributors\/fixture-person\/"/);
assert.match(article, /datetime="2026-09-01T12:00:00.000Z"/);
assert.match(article, /<pre class="score">BLANK\n  BLANK<\/pre>/);
assert.match(article, /application\/ld\+json/);
assert.doesNotMatch(article, /noindex/);
const issue = await renderPage('src/pages/issues/[...slug].astro', '/issues/fixture-monthly/', { issue: preview.issues[0] });
assert.match(issue, /href="\/read\/fixture-work\/"/);
assert.doesNotMatch(issue, /Download PDF/);
const specialPdf = { ...preview.issues[1], data: { ...preview.issues[1].data, pdf: 'https://example.com/issue.pdf' } };
const specialHtml = await renderPage('src/pages/issues/[...slug].astro', '/issues/fixture-special/', { issue: specialPdf });
assert.match(specialHtml, /Special edition/);
assert.match(specialHtml, /href="https:\/\/example.com\/issue.pdf"/);
const homepage = await renderPage('src/pages/index.astro', '/');
assert.match(homepage, /href="\/issues\/fixture-monthly\/"/);
assert.doesNotMatch(homepage, /href="\/issues\/fixture-special\/"/);
assert.match(homepage, /Data unavailable/);
const sitemap = await (await renderLoad('src/pages/sitemap.xml.ts')).GET({ site: new URL('https://glosso.org') });
const sitemapText = await sitemap.text();
assert.match(sitemapText, /https:\/\/glosso.org\/issues\/fixture-special\//);
assert.doesNotMatch(sitemapText, /legal|draft|fixture-update/);
const empty = { writing: [], issues: [], contributors: [], updates: [] };
assert.deepEqual(selectPublishedContent(empty, now), empty);
const emptyLoad = createTestCompiler(new Map([[resolve('src/lib/content.ts'), moduleUrl(`export const publishedContent=async()=>(${JSON.stringify(empty)});`)]]));
const emptyMap = await (await emptyLoad('src/pages/sitemap.xml.ts')).GET({ site: new URL('https://glosso.org') });
const emptyXml = await emptyMap.text();
assert.match(emptyXml, /https:\/\/glosso.org\/about\//);
assert.doesNotMatch(emptyXml, /fixture|legal|draft/);

// Verify managed-file containment and undeclared-media failures in a private temp directory.
const { readMediaFile, validateMediaFiles } = await load('src/lib/media-files.ts');
const project = process.cwd();
const sandbox = await mkdtemp(resolve(tmpdir(), 'glosso-media-test-'));
try {
  await mkdir(resolve(sandbox, 'publication-assets'));
  await copyFile(resolve(project, 'public/art/glosso-frog.png'), resolve(sandbox, 'publication-assets/fixture.png'));
  process.chdir(sandbox);
  assert.equal((await readMediaFile('/media/fixture.png')).type, 'image/png');
  const mediaRoute = await renderLoad(resolve(project, 'src/pages/media/[...path].ts'));
  assert.deepEqual(await mediaRoute.getStaticPaths(), [{ params: { path: 'fixture.png' } }]);
  const mediaResponse = await mediaRoute.GET({ params: { path: 'fixture.png' } });
  assert.equal(mediaResponse.status, 200);
  assert.equal(mediaResponse.headers.get('Content-Type'), 'image/png');
  assert.equal((await mediaRoute.GET({ params: { path: 'unreleased.png' } })).status, 404);
  await assert.rejects(readMediaFile('/media/../secret.pdf'), /Invalid/);
  await assert.rejects(validateMediaFiles({ ...all, writing: [{ ...work, body: '<img src="/media/missing.png" alt="BLANK" />' }] }), /declare body media/);
  const scaffold = resolve(project, 'scripts/new-content.mjs');
  execFileSync(process.execPath, [scaffold, 'special', 'fixture-draft', '2026-09-23']);
  const draft = await readFile(resolve(sandbox, 'src/content/issues/fixture-draft.mdx'), 'utf8');
  assert.match(draft, /title: BLANK/);
  assert.match(draft, /edition: special/);
  assert.match(draft, /approved: false\ndraft: true/);
  assert.throws(() => execFileSync(process.execPath, [scaffold, 'special', 'fixture-draft', '2026-09-23'], { stdio: 'pipe' }));
  assert.throws(() => execFileSync(process.execPath, [scaffold, 'work', '../unsafe', '2026-09-23'], { stdio: 'pipe' }));
} finally {
  process.chdir(project);
  assert.ok(sandbox.startsWith(resolve(tmpdir(), 'glosso-media-test-')));
  await rm(sandbox, { recursive: true, force: true });
}
console.log('Publishing checks passed: approvals, drafts, schedules, credits, monthly uniqueness, specials, contents, media safety, populated pages, metadata, sitemap and unpopulated engagement. No fixtures published.');
