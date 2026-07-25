import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // @ts-ignore
    wasm(),
    // @ts-ignore
    topLevelAwait(),
    react(),
    // Copy managed ZK artifacts (keys + zkir) into the public root so
    // FetchZkConfigProvider can fetch them at /keys/<circuit>.verifier etc.
    viteStaticCopy({
      targets: [
        {
          src: '../managed/keys/*',
          dest: 'keys',
        },
        {
          src: '../managed/zkir/*.bzkir',
          dest: 'zkir',
        },
      ],
    }),
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
    // Serve managed ZK artifacts during dev
    fs: {
      allow: ['..'],
    },
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
