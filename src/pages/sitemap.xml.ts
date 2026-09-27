import type { APIRoute } from 'astro';
import { publishedContent } from '../lib/content';
const escapeXml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Canonical site URL is required');
  const content = await publishedContent();
  const paths = ['/', '/read/', '/issues/', '/about/', '/contributors/', '/submissions/', '/contact/',
    ...content.writing.map((work) => `/read/${work.id}/`),
    ...content.issues.map((issue) => `/issues/${issue.id}/`),
    ...content.contributors.map((person) => `/contributors/${person.id}/`)];
  // Utility/legal pages are not listed; they remain crawlable. Unreleased content is absent.
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    paths.map((path) => `<url><loc>${escapeXml(new URL(path, site).href)}</loc></url>`).join('') + '</urlset>',
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
