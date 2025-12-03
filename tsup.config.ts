import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'], // Usar CommonJS para compatibilidade
  dts: true,
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2022',
  platform: 'node',
  esbuildOptions(options) {
    options.banner = {
      js: '"use strict";',
    };
  },
});

