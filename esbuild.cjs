#!/usr/bin/env node

const esbuild = require('esbuild')

esbuild.build({
  entryPoints: ['./src/index.ts'],
  outdir: 'build/',
  bundle: true,
  minify: false,
  platform: 'node',
  format: 'esm',
  sourcemap: true,
  packages: 'external',
  target: 'es2021'
}).catch(() => process.exit(1))
