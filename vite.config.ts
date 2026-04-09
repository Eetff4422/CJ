import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// IMPORTANT: update `base` with your GitHub repo name when deploying to GitHub Pages
// Example: if repo is github.com/esnopoly/sgcj-gabon-mvp → base: '/sgcj-gabon-mvp/'
export default defineConfig({
  plugins: [react()],
  base: '/sgcj-gabon-mvp/',
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@application': path.resolve(__dirname, 'src/application'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@ui': path.resolve(__dirname, 'src/ui'),
    },
  },
});
