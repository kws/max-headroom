import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/max-headroom.js',
      name: 'MaxHeadroom',
      fileName: 'max-headroom',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}) 