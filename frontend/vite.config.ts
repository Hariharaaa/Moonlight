import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // @ts-ignore
    wasm(),
    // @ts-ignore
    topLevelAwait(),
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'managed': path.resolve(__dirname, '../managed'),
      // Fix Vercel's strict node_modules resolution for imports coming from outside the root directory
      '@midnight-ntwrk/compact-runtime': path.resolve(__dirname, 'node_modules/@midnight-ntwrk/compact-runtime'),
      // Node.js polyfills
      buffer: 'buffer',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  server: {
    port: 3000,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    target: 'es2022',
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
});
