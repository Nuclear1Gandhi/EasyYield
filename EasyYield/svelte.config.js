import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess({
    // PostCSS: let Tailwind process @tailwind directives
    postcss: true,
  }),

  kit: {
    adapter: adapter({ out: 'build' }),
    alias: {
      $server: 'src/lib/server',
      $client: 'src/lib/client',
      $shared: 'src/lib/shared',
    },
  },
};

export default config;
//i wonder how this change will make you feel about work productivity or mindset
