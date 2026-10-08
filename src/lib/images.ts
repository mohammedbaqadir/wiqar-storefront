import { getImage, type ImageMetadata } from 'astro:assets';

/**
 * Product photos: catalogue entries are usually absolute URLs (D1 keeps the
 * merchant's image links), so those pass through untouched. Bundled files in
 * src/assets are still optimised at build time — responsive widths plus AVIF
 * and WebP — and this module resolves a relative path to the imported asset.
 */
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/photos/*.jpg', {
  eager: true,
});

const photos = new Map<string, ImageMetadata>(
  Object.entries(files).map(([path, module]) => [path.replace('/src/assets/', ''), module.default])
);

const isRemote = (path: string): boolean => /^https?:\/\//i.test(path);

/** 'photos/mug.jpg' → the asset, or undefined when the catalogue points at a missing file. */
export const photo = (path: string): ImageMetadata | undefined => photos.get(path);

/** One optimised URL, for the places that need a URL rather than markup (the cart). */
export const photoUrl = async (path: string, width: number): Promise<string | undefined> => {
  if (isRemote(path)) return path;
  const source = photos.get(path);
  if (!source) return undefined;
  const image = await getImage({ src: source, width, format: 'webp' });
  return image.src;
};

/** Share cards want a raster file, not the AVIF/WebP the pages use. */
export const shareImage = async (path: string, width = 1200): Promise<string | undefined> => {
  if (isRemote(path)) return path;
  const source = photos.get(path);
  if (!source) return undefined;
  const image = await getImage({ src: source, width, format: 'jpeg', quality: 78 });
  return image.src;
};
