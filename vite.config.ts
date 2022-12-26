// vite.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      all: true,
      src: ['./src'],
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './test/coverageReports'
    },
  },
});
