import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/max-headroom.js',
      name: 'MaxHeadroom',
      fileName: (format) => {
        if (format === 'umd') return 'max-headroom.umd.js'
        if (format === 'es') return 'max-headroom.esm.js'
        return `max-headroom.${format}.js`
      },
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  assetsInclude: ['**/*.glsl'],
  server: {
    port: 3000,
    open: true
  }
}) 