import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Exclude mediapipe from pre-bundling — it uses WASM workers
    exclude: ['@mediapipe/tasks-vision'],
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer / WASM threading
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})