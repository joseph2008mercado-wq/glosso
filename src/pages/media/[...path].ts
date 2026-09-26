import type { APIRoute } from 'astro';
import { publishedContent } from '../../lib/content';
import { referencedAssets, MEDIA_PREFIX, isAssetUrl } from '../../lib/assets';
import { readMediaFile } from '../../lib/media-files';
export async function getStaticPaths() {
  const content = await publishedContent();
  return referencedAssets([...content.writing, ...content.issues, ...content.contributors])
    .filter((url) => url.startsWith(MEDIA_PREFIX))
    .map((url) => ({ params: { path: url.slice(MEDIA_PREFIX.length) } }));
}
export const GET: APIRoute = async ({ params }) => {
  const url = MEDIA_PREFIX + params.path;
  if (!isAssetUrl(url)) throw new Error(`Invalid publication asset: ${url}`);
  const content = await publishedContent();
  if (!referencedAssets([...content.writing, ...content.issues, ...content.contributors]).includes(url)) return new Response(null, { status: 404 });
  const { bytes, type } = await readMediaFile(url);
  return new Response(bytes, { headers: { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' } });
};
