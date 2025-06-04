import type { Plugin } from 'vite';

export default function wasmPlugin(): Plugin {
  return {
    name: 'vite-plugin-wasm-custom',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'a') {
        return '\0virtual:wasm-import';
      }
      return null;
    },
    load(id) {
      if (id === '\0virtual:wasm-import') {
        return 'export const a = {}; export const b = {};';
      }
      return null;
    }
  };
} 