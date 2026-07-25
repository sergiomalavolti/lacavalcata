// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Local archive: served from the root by `npm run preview`.
  base: '/',
  build: { format: 'directory' },
  image: {
    // Only the five photographs in src/assets/ ever pass through the optimiser.
    responsiveStyles: true,
  },
  devToolbar: { enabled: false },
});
