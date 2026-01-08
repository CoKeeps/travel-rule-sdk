import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  root: 'widget',
  plugins: [vue()],
  build: {
    outDir: '../dist-widget',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'travel-sdk': resolve(__dirname, './dist'),
      '@sdk': resolve(__dirname, './dist'),
      '@': resolve(__dirname, './widget'),
      '@src': resolve(__dirname, './src'),
    },
  },
});
