import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';

// Check rendered HTML, including images authored directly in Markdown/MDX.
// Explicit empty alt is valid for decorative/redundant images. This check cannot
// judge whether a human description is accurate or an image truly decorative.
function inspect(html) {
  const problems = [];
  let count = 0;
  const visibleMarkup = html.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');
  for (const match of visibleMarkup.matchAll(/<img\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)) {
    count++;
    const attrs = new Map();
    for (const attr of match[0].slice(4, -1).matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs.set(attr[1].toLowerCase(), attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    const alt = attrs.get('alt');
    if (alt === undefined || /^\s*BLANK\s*$/i.test(alt) || (alt !== '' && !alt.trim())) {
      problems.push(`image ${count} (${attrs.get('src') ?? 'no src'}): supply alt text; use alt="" only for decorative/redundant images`);
    }
  }
  return { count, problems };
}

if (process.argv.includes('--test')) {
  for (const html of ['<img src="x">', '<img alt="BLANK">', '<img alt="   ">', '<img title=\'alt="described"\'>']) assert.equal(inspect(html).problems.length, 1);
  for (const html of ['<img alt="">', '<img alt="Glosso">', "<IMG ALT='Glosso > image'>", '<img alt=Glosso>']) assert.equal(inspect(html).problems.length, 0);
  assert.equal(inspect('<!-- <img> --><script>"<img>"</script>').count, 0);
  assert.equal(inspect('<img alt=""><img>').problems.length, 1);
  console.log('Image alternative checks passed: missing/placeholder/whitespace, quoted attributes, decorative images and inline HTML.');
} else {
  const problems = [];
  let count = 0;
  async function scan(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await scan(path);
      else if (entry.name.endsWith('.html')) {
        const result = inspect(await readFile(path, 'utf8'));
        count += result.count;
        problems.push(...result.problems.map((problem) => `${path}: ${problem}`));
      }
    }
  }
  await scan('dist');
  if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
  else console.log(`Image alternatives verified (${count} rendered images). Accuracy and decorative status still require human review.`);
}
