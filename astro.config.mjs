// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// The three webfonts, served through Astro's font pipeline rather than by
// importing the @fontsource CSS directly. That import shipped
// `font-display: swap` with no preload, so a cold load painted headings in a
// fallback measuring 82% wider than League Gothic, then reflowed them — a
// visible flash on every first visit.
//
// `display: 'optional'` is what removes it: the browser gets a short window to
// have the font ready, and if it misses, it keeps the fallback for the rest of
// that page view rather than swapping mid-render. Preloading (see Base.astro)
// is what makes it win that race almost every time.
//
// It has to be the *local* provider to work. The npm/fontsource providers read
// each package's index.css, and unifont parses the `font-display: swap` in it
// into the font's own data — which then takes precedence over `display` here
// (see `data.display ?? family.display` in Astro's collect-component-data).
// Pointing at the .woff2 files directly means there is no packaged CSS to
// override us. The @fontsource packages stay in package.json: they are where
// these files come from, resolved as package subpaths so no binaries are
// committed and the version stays pinned in one place.
const local = fontProviders.local();

// Only the latin subset is built, and only upright. Verified against the
// rendered output rather than assumed: every character the site prints above
// U+00FF is – — › ← → −, and all but the two arrows fall inside latin's
// unicode-range. The arrows are in no fontsource subset at all, so they resolve
// to a system glyph here exactly as they already did. latin-ext, vietnamese,
// cyrillic and greek were shipped but never reachable. No italic either: every
// `font-style` on the site is `normal` and there is no <em> or <i>.
const fonts = [
  {
    provider: local,
    name: 'League Gothic',
    cssVariable: '--font-league-gothic',
    display: /** @type {const} */ ('optional'),
    fallbacks: ['Arial Narrow', 'Helvetica Neue', 'sans-serif'],
    options: {
      variants: [
        {
          weight: 400,
          style: /** @type {const} */ ('normal'),
          src: ['@fontsource/league-gothic/files/league-gothic-latin-400-normal.woff2'],
        },
      ],
    },
  },
  {
    provider: local,
    name: 'Archivo Variable',
    cssVariable: '--font-archivo',
    display: /** @type {const} */ ('optional'),
    fallbacks: ['system-ui', '-apple-system', 'sans-serif'],
    options: {
      variants: [
        {
          weight: '100 900',
          style: /** @type {const} */ ('normal'),
          src: ['@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2'],
        },
      ],
    },
  },
  {
    provider: local,
    name: 'JetBrains Mono Variable',
    cssVariable: '--font-jetbrains-mono',
    display: /** @type {const} */ ('optional'),
    fallbacks: ['ui-monospace', 'SF Mono', 'monospace'],
    options: {
      variants: [
        {
          weight: '100 800',
          style: /** @type {const} */ ('normal'),
          src: ['@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'],
        },
      ],
    },
  },
];

export default defineConfig({
  // Published on a custom domain via GitHub Pages (see public/CNAME), so it
  // serves from the root rather than a project sub-path. Every internal link
  // still goes through u() in src/lib/url.js, which is a no-op at base '/'.
  site: 'https://lacavalcata.com',
  base: '/',
  build: { format: 'directory' },
  fonts,
  image: {
    // Only the five photographs in src/assets/ ever pass through the optimiser.
    responsiveStyles: true,
  },
  devToolbar: { enabled: false },
});
