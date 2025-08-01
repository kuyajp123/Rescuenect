import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from "@tailwindcss/vite";
import svgr from 'vite-plugin-svgr';
import { resolve } from 'path'
import path from 'path';

// Load environment variables
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    // resolve: {
    //   alias: {
    //     '@': path.resolve(__dirname, './src')
    //   }
    // },
    server: {
      // host: '0.0.0.0',
      port: Number(env.VITE_PORT)
    },
  }
})
