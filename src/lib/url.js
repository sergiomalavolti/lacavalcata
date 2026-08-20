/**
 * Internal links, made safe to serve from a sub-path.
 *
 * The site serves from a domain root today (base '/'), so this is a no-op. It
 * did not always: it lived at /lacavalcata/ until the custom domain, and the
 * only reason that move cost one line is that every link already came through
 * here. Astro exposes the configured `base` as import.meta.env.BASE_URL but
 * does not rewrite hrefs written by hand — under a sub-path an `href="/finale/"`
 * stays pointing at the server root and 404s. So every absolute internal link
 * goes through u(), and `base` stays the one place the prefix is named.
 *
 * Anchors (#quarti), relative paths and external URLs are returned untouched;
 * only a leading slash marks a path as ours to rewrite.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const u = (path) => (path.startsWith('/') ? `${BASE}${path}` : path);
