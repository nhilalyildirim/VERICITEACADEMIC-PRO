
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cast process to any to avoid TS error: Property 'cwd' does not exist on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID || ''),
      'process.env.MS_CLIENT_ID': JSON.stringify(env.MS_CLIENT_ID || ''),
      'process.env.ORCID_CLIENT_ID': JSON.stringify(env.ORCID_CLIENT_ID || '')
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
