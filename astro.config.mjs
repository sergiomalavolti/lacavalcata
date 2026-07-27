// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Published as a GitHub Pages project site, which serves from a sub-path.
  // Every internal link goes through u() in src/lib/url.js so this stays the
  // single place the sub-path is named — set it to '/' to serve from a root.
  site: 'https://sergiomalavolti.github.io',
  base: '/lacavalcata',
  build: { format: 'directory' },
  image: {
    // Only the five photographs in src/assets/ ever pass through the optimiser.
    responsiveStyles: true,
  },
  devToolbar: { enabled: false },
});
