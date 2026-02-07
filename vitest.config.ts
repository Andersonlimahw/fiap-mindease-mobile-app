import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'android', 'ios'],
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/store/**/*.ts', 'src/domain/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/index.ts'],
    },
  },
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './src/config'),
      '@core': path.resolve(__dirname, './src/core'),
      '@assets': path.resolve(__dirname, './public/assets'),
      '@data': path.resolve(__dirname, './src/data'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@components': path.resolve(__dirname, './src/presentation/components'),
      '@view-models': path.resolve(__dirname, './src/presentation/viewmodels'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
