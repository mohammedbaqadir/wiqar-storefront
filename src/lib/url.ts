/**
 * Prefixes internal links with Astro's BASE_URL so the same build works
 * locally and under any path the site is served from.
 */
export const url = (path: string): string => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
};
