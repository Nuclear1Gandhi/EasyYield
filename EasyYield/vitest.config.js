import { configDotenv } from 'dotenv';
import { defineConfig } from 'vitest/config';
import path from 'path';

configDotenv({ path: '.env.test' });

export default defineConfig({
  test: {
    testTimeout: 12000000,
  },
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, 'src/lib'),
      $server: path.resolve(__dirname, 'src/lib/server'),
      $client: path.resolve(__dirname, 'src/lib/client'),
      $shared: path.resolve(__dirname, 'src/lib/shared'),
    },
  },
});
