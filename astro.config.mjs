// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Published on a custom domain via GitHub Pages (see public/CNAME), so it
  // serves from the root rather than a project sub-path. Every internal link
  // still goes through u() in src/lib/url.js, which is a no-op at base '/'.
  site: 'https://lacavalcata.com',
  base: '/',
  build: { format: 'directory' },
  image: {
    // Only the five photographs in src/assets/ ever pass through the optimiser.
    responsiveStyles: true,
  },
  devToolbar: { enabled: false },
});
