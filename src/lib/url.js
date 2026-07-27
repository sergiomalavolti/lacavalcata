/**
 * Internal links, made safe to serve from a sub-path.
 *
 * On GitHub Pages this site lives at /lacavalcata/, not at a domain root.
 * Astro exposes the configured `base` as import.meta.env.BASE_URL, but it does
 * not rewrite hrefs written by hand — an `href="/finale/"` stays pointing at
 * the server root and 404s. So every absolute internal link goes through u().
 *
 * Anchors (#quarti), relative paths and external URLs are returned untouched;
 * only a leading slash marks a path as ours to rewrite.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const u = (path) => (path.startsWith('/') ? `${BASE}${path}` : path);
