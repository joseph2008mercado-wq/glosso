import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';

// Astro's retained entry.body trims outer whitespace. Read the original body
// for verbatim presentation so leading/trailing blank lines survive as well.
export async function readVerbatimBody(entry: { id: string; filePath?: string }): Promise<string> {
  if (!entry.filePath) throw new Error(`Work ${entry.id}: verbatim presentation requires a source file`);
  const root = await realpath(resolve('src/content/writing'));
  const file = await realpath(resolve(entry.filePath));
  const inside = relative(root, file);
  if (inside.startsWith('..') || isAbsolute(inside)) throw new Error(`Work ${entry.id}: invalid verbatim source path`);
  const source = await readFile(file, 'utf8');
  const match = source.match(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`Work ${entry.id}: expected YAML frontmatter before the verbatim body`);
  return match[1];
}
