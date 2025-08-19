import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  // Only needed if you're accessing process in shared code
  server: {
    port: 1221,
  },
});
