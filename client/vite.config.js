import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@contexts': path.resolve(__dirname, './src/contexts')
    }
  },
  define: {
    global: 'globalThis'
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // Faster than terser, built into Vite
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          socket: ['socket.io-client'],
          webrtc: ['simple-peer'],
          ui: ['@radix-ui/react-avatar', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-separator', '@radix-ui/react-slot', '@radix-ui/react-tooltip']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  esbuild: {
    drop: ['console', 'debugger'] // Remove console.log in production
  }
})
