import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,

  },
  optimizeDeps: {
    include: [
      'next-themes',
      'react-router-dom',
      'class-variance-authority',
      'react-dom/client',
      '@tanstack/react-query',
      'sonner'
    ],
    exclude: ['occt-import-js'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'occt-import-js': ['occt-import-js']
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/occt-import-js/dist/occt-import-js.wasm',
          dest: 'assets/wasm'
        }
      ]
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ['**/*.wasm'],
}));
