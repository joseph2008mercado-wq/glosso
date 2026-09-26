import { realpath, readFile } from 'node:fs/promises';
import { extname, relative, resolve, isAbsolute } from 'node:path';
import { isAssetUrl, MEDIA_PREFIX, mediaTypes, referencedAssets } from './assets';
import type { PublicationContent } from './publication';

export async function resolveMediaFile(url: string): Promise<string> {
  if (!isAssetUrl(url) || !url.startsWith('/')) throw new Error(`Invalid local publication asset: ${url}`);
  const managed = url.startsWith(MEDIA_PREFIX);
  const root = await realpath(resolve(managed ? 'publication-assets' : 'public'));
  const file = await realpath(resolve(root, url.slice(managed ? MEDIA_PREFIX.length : 1)));
  const inside = relative(root, file);
  if (inside.startsWith('..') || isAbsolute(inside)) throw new Error(`Publication asset escapes its directory: ${url}`);
  if (managed && !mediaTypes[extname(file).toLowerCase()]) throw new Error(`Unsupported publication asset type: ${url}`);
  return file;
}
export async function readMediaFile(url: string) {
  const file = await resolveMediaFile(url);
  return { bytes: new Uint8Array(await readFile(file)), type: mediaTypes[extname(file).toLowerCase()] };
}
export async function validateMediaFiles(content: PublicationContent) {
  const entries = [...content.writing, ...content.issues, ...content.contributors];
  for (const entry of entries) {
    if ('presentation' in entry.data && entry.data.presentation === 'verbatim') continue;
    const declared = referencedAssets([entry]);
    for (const match of (entry.body ?? '').matchAll(/\/media\/[A-Za-z0-9_./-]+/g)) {
      if (!declared.includes(match[0])) throw new Error(`${entry.id}: declare body media ${match[0]} in assets frontmatter`);
    }
  }
  for (const url of referencedAssets(entries)) if (url.startsWith('/')) await resolveMediaFile(url);
}
