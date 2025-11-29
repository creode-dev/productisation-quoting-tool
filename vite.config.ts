import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
  },
  publicDir: 'public',
  // Copy Documentation folder to public for runtime access
  build: {
    rollupOptions: {
      // Ensure markdown files are treated as assets
    }
  }
})

