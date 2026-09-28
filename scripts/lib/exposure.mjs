import { readdir, readFile, lstat } from 'node:fs/promises';
import { join } from 'node:path';

// Exact inventory: additions to public/ require deliberate review. Publication
// media belongs in publication-assets/, where release selection controls output.
export const publicFiles = new Set([
  '_headers', 'art/glosso-frog.png', 'favicon.svg', 'llms.txt',
  'fonts/Bricolage-OFL.txt', 'fonts/DM-Sans-OFL.txt',
  'fonts/bricolage-latin-ext.woff2', 'fonts/bricolage-latin.woff2',
  'fonts/dm-sans-latin-ext.woff2', 'fonts/dm-sans-latin.woff2',
]);

export function privatePath(path, { output = false } = {}) {
  const parts = path.replaceAll('\\', '/').toLowerCase().split('/');
  const name = parts.at(-1);
  if (parts.some((part) => ['legal-review', 'private-records', 'private-submissions', '.git', '.wrangler', '.aws', '.ssh'].includes(part))) return true;
  if (/^\.(?:env|dev\.vars)(?:\.|$)/.test(name) && (output || !name.endsWith('.example'))) return true;
  if (/^(?:\.npmrc|\.netrc|_netrc|id_rsa|id_ed25519)$/.test(name) || /\.(?:pem|key|p12|pfx|keystore)$/i.test(name)) return true;
  return output && (parts.some((part) => ['src', 'node_modules', 'publication-assets'].includes(part)) || /\.(?:mdx?|map|bak|sql|sqlite3?|db|log|zip|7z|tar|gz)$/i.test(name));
}

export function hasCredential(bytes) {
  if (bytes.includes(0)) return false;
  return /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}|\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|\bxox[baprs]-[A-Za-z0-9-]{20,}/.test(bytes.toString('utf8'));
}

export async function inspectTree(directory, { publicOnly = false } = {}) {
  const problems = [];
  if ((await lstat(directory)).isSymbolicLink()) return [`${directory}: symbolic links are not allowed`];
  async function walk(relative = '') {
    for (const item of await readdir(join(directory, relative), { withFileTypes: true })) {
      const path = relative ? `${relative}/${item.name}` : item.name;
      if (privatePath(path, { output: true })) problems.push(`${directory}/${path}: private/source path`);
      // Never follow links/junctions into private directories, even inside public/.
      if (item.isSymbolicLink()) problems.push(`${directory}/${path}: symbolic links are not allowed`);
      else if (item.isDirectory()) {
        if (publicOnly && ![...publicFiles].some((file) => file.startsWith(path + '/'))) problems.push(`${directory}/${path}: unreviewed public directory`);
        await walk(path);
      } else if (item.isFile()) {
        if (publicOnly && !publicFiles.has(path)) problems.push(`${directory}/${path}: unreviewed public file`);
        const bytes = await readFile(join(directory, path));
        if (hasCredential(bytes)) problems.push(`${directory}/${path}: possible credential; value suppressed`);
        const text = bytes.includes(0) ? '' : bytes.toString('utf8');
        if (/OPERATOR INPUT REQUIRED/.test(text) || (path.endsWith('.html') && /legal-draft-notice/.test(text))) problems.push(`${directory}/${path}: unreviewed legal material`);
        if (path.endsWith('.html')) {
          for (const [, attributes, body] of text.matchAll(/<script\b((?:[^"'<>]|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>/gi)) {
            const attrs = new Map([...attributes.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '']));
            if (body.trim() && !attrs.has('src') && attrs.get('type')?.toLowerCase() !== 'application/ld+json') problems.push(`${directory}/${path}: inline script would be blocked by CSP; use a bundled script`);
          }
        }
      } else problems.push(`${directory}/${path}: unsupported file type`);
    }
  }
  await walk();
  return problems;
}
