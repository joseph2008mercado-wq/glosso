import type { APIRoute } from 'astro';
import reference from '../../public/llms.txt?raw';
// Keep the owner-authored definition in one source. Prose is a comment, never
// an invented robots directive; crawler access rules remain unchanged.
const definition = reference.split(/\r?\n/).find((line) => line.startsWith('> '))?.slice(2);
if (!definition) throw new Error('The approved site reference definition is missing');
export const GET: APIRoute = ({ site }) => new Response(
  `# ${definition}\n# Site reference: ${new URL('/llms.txt', site).href}\n\nUser-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', site).href}\n`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
