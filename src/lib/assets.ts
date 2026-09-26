export const MEDIA_PREFIX = '/media/';
export function isAssetUrl(value: string): boolean {
  if (/^https:\/\//.test(value)) {
    try { const url = new URL(value); return !!url.hostname && !url.username && !url.password; } catch { return false; }
  }
  return /^\/(?!\/)[A-Za-z0-9_./-]+$/.test(value) &&
    value.split('/').slice(1).every((part) => part !== '' && part !== '.' && part !== '..');
}
export const mediaTypes: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif',
  '.pdf': 'application/pdf', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.flac': 'audio/flac',
};
type MediaEntry = { data: { cover?: string; thumbnail?: { src: string }; audio?: string; pdf?: string; portrait?: string; assets?: string[] } };
export function referencedAssets(entries: MediaEntry[]): string[] {
  return [...new Set(entries.flatMap(({ data }) => [data.cover, data.thumbnail?.src, data.audio, data.pdf, data.portrait, ...(data.assets ?? [])])
    .filter((value): value is string => Boolean(value)))].sort();
}
