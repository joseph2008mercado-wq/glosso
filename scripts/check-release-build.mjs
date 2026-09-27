import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, writeFile, symlink, rm, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { build } from 'astro';
import mdx from '@astrojs/mdx';

// An isolated, never-served build tests the real Astro loaders/MDX/media pipeline.
// Glosso is the existing supplied proper name; all body writing remains BLANK.
// No fixtures are added to the project's collections, public directory or dist.
const project = process.cwd();
const liveCachePath = join(project, 'node_modules/.astro/data-store.json');
const liveCacheBefore = await readFile(liveCachePath).catch(() => null);
const sandbox = await mkdtemp(join(tmpdir(), 'glosso-release-test-'));
const body = '\n---\n\nBLANK\n';
const date = '2020-01-01T12:00:00Z';
const release = `approved: true\ndraft: false\npublished: "${date}"\n`;
async function entry(collection, slug, fields, content = body, extension = 'mdx') {
  const directory = join(sandbox, 'src/content', collection);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, slug + '.' + extension), '---\n' + fields + content);
}
try {
  await cp(join(project, 'src'), join(sandbox, 'src'), { recursive: true, filter: (path) => path !== join(project, 'src/content') });
  await cp(join(project, 'public'), join(sandbox, 'public'), { recursive: true });
  await cp(join(project, 'package.json'), join(sandbox, 'package.json'));
  await symlink(join(project, 'node_modules'), join(sandbox, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  await mkdir(join(sandbox, 'publication-assets'));
  for (const name of ['released', 'draft', 'scheduled', 'released-thumb', 'draft-thumb', 'scheduled-thumb']) await cp(join(project, 'public/art/glosso-frog.png'), join(sandbox, 'publication-assets', name + '.png'));
  await entry('contributors', 'fixture-person', 'name: Glosso\napproved: true\ndraft: false\nportrait: /media/released.png\nportraitAlt: Glosso frog');
  await entry('issues', 'fixture-monthly', release + 'title: Glosso\ndescription: Glosso\nedition: monthly\nmonth: "2020-01"\ncover: /media/released.png\ncontents: [fixture-work]\ncredits: [fixture-person]');
  await entry('issues', 'fixture-special', release.replace(date, '2020-02-01T12:00:00Z') + 'title: Glosso\ndescription: Glosso\nedition: special\ncover: /media/released.png\npdf: https://example.com/fixture.pdf');
  const work = release + 'title: Glosso\nsummary: Glosso\nkind: experimental\ncontributors: [fixture-person]\nissue: fixture-monthly\ncover: /media/released.png\nthumbnail:\n  src: /media/released-thumb.png\n  fit: cover\n  position: [25, 75]';
  await entry('writing', 'fixture-work', work + '\npresentation: verbatim', '\n---\n\nBLANK\n  BLANK\n', 'md');
  await entry('writing', 'fixture-draft', work.replace('draft: false', 'draft: true').replaceAll('/media/released', '/media/draft'));
  await entry('writing', 'fixture-scheduled', work.replace(date, '2999-01-01T00:00:00Z').replaceAll('/media/released', '/media/scheduled'));
  await entry('updates', 'fixture-update', release + 'title: Glosso\nsummary: Glosso');
  process.chdir(sandbox);
  await build({ root: pathToFileURL(sandbox + '/'), cacheDir: './.astro-cache', vite: { cacheDir: join(sandbox, '.vite-cache') }, configFile: false, site: 'https://glosso.org', output: 'static', trailingSlash: 'always', integrations: [mdx()], logLevel: 'error' });
  const output = join(sandbox, 'dist');
  const html = (path) => readFile(join(output, path), 'utf8');
  const home = await html('index.html');
  for (const route of ['contributors/index.html', 'contributors/fixture-person/index.html']) assert.match(await html(route), /alt="Glosso frog"/);
  assert.match(home, /href="\/issues\/fixture-monthly\/"/);
  assert.doesNotMatch(home, /href="\/issues\/fixture-special\/"/);
  assert.match(home, /Data unavailable/);
  assert.match(home, /src="\/media\/released-thumb.png"/);
  assert.match(home, /--image-fit:cover/);
  assert.match(home, /--image-position:25% 75%/);
  const article = await html('read/fixture-work/index.html');
  assert.match(article, /href="\/contributors\/fixture-person\/"/);
  assert.match(article, /<pre class="score"><span>\n?BLANK\n  BLANK\n<\/span><\/pre>/);
  assert.match(article, /https:\/\/glosso.org\/read\/fixture-work\//);
  assert.match(article, /"datePublished":"2020-01-01T12:00:00.000Z"/);
  assert.doesNotMatch(article, /noindex/);
  assert.match(article, /src="\/media\/released.png"/);
  assert.doesNotMatch(article, /released-thumb/);
  for (const path of ['read/index.html', 'contributors/fixture-person/index.html', 'issues/fixture-monthly/index.html']) assert.match(await html(path), /src="\/media\/released-thumb.png"/);
  assert.match(await html('issues/fixture-monthly/index.html'), /href="\/read\/fixture-work\/"/);
  assert.match(await html('issues/fixture-special/index.html'), /Special edition/);
  assert.match(await html('issues/index.html'), /Monthly Issues[\s\S]*Special Editions/);
  assert.match(await html('sitemap.xml'), /https:\/\/glosso.org\/issues\/fixture-special\//);
  assert.doesNotMatch(await html('sitemap.xml'), /fixture-draft|fixture-scheduled|legal/);
  assert.deepEqual(await readFile(join(output, 'media/released.png')), await readFile(join(project, 'public/art/glosso-frog.png')));
  assert.deepEqual(await readFile(join(output, 'media/released-thumb.png')), await readFile(join(project, 'public/art/glosso-frog.png')));
  for (const path of ['media/draft.png', 'media/scheduled.png', 'media/draft-thumb.png', 'media/scheduled-thumb.png', 'read/fixture-draft/index.html', 'read/fixture-scheduled/index.html']) await assert.rejects(readFile(join(output, path)), { code: 'ENOENT' });
  async function audit(directory) {
    for (const file of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, file.name);
      if (file.isDirectory()) await audit(path);
      else if (/\.(html|js|json|xml)$/.test(file.name)) assert.doesNotMatch(await readFile(path, 'utf8'), /fixture-draft|fixture-scheduled/);
    }
  }
  await audit(output);
  assert.deepEqual(await readFile(liveCachePath).catch(() => null), liveCacheBefore, 'Live content cache must remain untouched');
  console.log('Isolated populated production build passed: real MDX whitespace, work/issue/author routes, monthly vs special selection, sitemap, emitted media bytes, draft and scheduled output exclusion. Live project unchanged.');
} finally {
  process.chdir(project);
  assert.ok(sandbox.startsWith(resolve(tmpdir(), 'glosso-release-test-')));
  await rm(sandbox, { recursive: true, force: true });
}
