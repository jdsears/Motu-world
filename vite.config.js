import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load from .env files
  const env = loadEnv(mode, process.cwd(), '');

  // Get API key - prioritize process.env (Railway) over .env files
  const alchemyApiKey = process.env.VITE_ALCHEMY_API_KEY || env.VITE_ALCHEMY_API_KEY || '';

  // Debug: Log during build to see if key is available
  console.log('=== VITE BUILD CONFIG ===');
  console.log('Mode:', mode);
  console.log('process.env.VITE_ALCHEMY_API_KEY:', process.env.VITE_ALCHEMY_API_KEY ? 'SET (' + process.env.VITE_ALCHEMY_API_KEY.slice(0, 8) + '...)' : 'NOT SET');
  console.log('env.VITE_ALCHEMY_API_KEY (from .env):', env.VITE_ALCHEMY_API_KEY ? 'SET' : 'NOT SET');
  console.log('Final alchemyApiKey:', alchemyApiKey ? 'SET (' + alchemyApiKey.slice(0, 8) + '...)' : 'NOT SET');
  console.log('=========================');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist'
    },
    define: {
      'import.meta.env.VITE_ALCHEMY_API_KEY': JSON.stringify(alchemyApiKey)
    }
  };
});
