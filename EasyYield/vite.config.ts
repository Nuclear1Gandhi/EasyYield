import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { svelte } from 'vite-plugin-svelte';

export default defineConfig({
  plugins: [sveltekit(), svelte()],
  // Only needed if you're accessing process in shared code
  server: {
    port: 1221,
  },
});
