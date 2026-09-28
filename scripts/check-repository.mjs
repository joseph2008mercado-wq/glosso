import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { privatePath, hasCredential, publicFiles } from './lib/exposure.mjs';
// Read the index, not working-tree content: this audits what a commit would expose.
const paths = execFileSync('git', ['ls-files', '--cached', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const problems = [];
const modes = new Map(execFileSync('git', ['ls-files', '--stage', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean).map((entry) => [entry.slice(entry.indexOf('\t') + 1), entry.slice(0, 6)]));
for (const path of paths) {
  if (privatePath(path)) problems.push(`${path}: private/credential path in Git index`);
  if (['120000', '160000'].includes(modes.get(path))) problems.push(`${path}: symlinks/submodules require a separate security review`);
  if (path.startsWith('public/') && !publicFiles.has(path.slice(7))) problems.push(`${path}: unreviewed public file in Git index`);
  const bytes = execFileSync('git', ['show', `:${path}`], { maxBuffer: 40 * 1024 * 1024 });
  if (path.startsWith('publication-assets/') && !path.endsWith('.gitkeep')) {
    const released = await readFile(join('dist/media', path.slice('publication-assets/'.length))).catch(() => null);
    if (!released || !bytes.equals(released)) problems.push(`${path}: not identical to a released build asset`);
  }
  if (bytes.includes(0)) continue;
  const text = bytes.toString('utf8');
  if (hasCredential(bytes)) problems.push(`${path}: possible credential; value suppressed`);
  if (/^src\/content\/.*\.mdx?$/.test(path)) {
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/); const fields = frontmatter?.[1] ?? '';
    if (!/^approved:\s*true\s*$/m.test(fields) || !/^draft:\s*false\s*$/m.test(fields)) problems.push(`${path}: unapproved/draft source must not enter public Git`);
    if (!path.startsWith('src/content/contributors/')) {
      const date = fields.match(/^published:\s*["']?([^\r\n"']+)/m)?.[1]?.trim();
      if (!date || !Number.isFinite(Date.parse(date)) || Date.parse(date) > Date.now()) problems.push(`${path}: missing/invalid/future release date`);
    }
  }
}
if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
else console.log(`Repository index check passed (${paths.length} paths). ${paths.length ? '' : 'Nothing is tracked/staged yet. Re-run after explicit staging.'} This is a limited safeguard, not a complete secret or copyright audit.`);
