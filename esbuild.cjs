#!/usr/bin/env node

const esbuild = require('esbuild')

// Automatically exclude all node_modules from the bundled version
const { nodeExternalsPlugin } = require('esbuild-node-externals')

esbuild.build({
  entryPoints: ['./src/index.ts'],
  outdir: 'build/',
  bundle: true,
  minify: false,
  platform: 'node',
  format: 'esm',
  sourcemap: true,
  plugins: [nodeExternalsPlugin()]
}).catch(() => process.exit(1))