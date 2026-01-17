import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist'
  },
  define: {
    'import.meta.env.VITE_ALCHEMY_API_KEY': JSON.stringify(process.env.VITE_ALCHEMY_API_KEY)
  }
});
