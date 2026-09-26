// Browsing images may differ from the original artwork on the reading page.
// Cropping is opt-in; existing cover-only entries keep their full image visible.
type ImageData = {
  cover?: string;
  coverAlt?: string;
  thumbnail?: { src: string; alt?: string; fit?: 'contain' | 'cover'; position?: [number, number] };
};
export function browsingImage(data: ImageData) {
  return {
    src: data.thumbnail?.src ?? data.cover,
    alt: data.thumbnail ? data.thumbnail.alt ?? 'BLANK' : data.coverAlt ?? 'BLANK',
    fit: data.thumbnail?.fit ?? 'contain' as const,
    position: data.thumbnail?.position ?? [50, 50] as [number, number],
  };
}
