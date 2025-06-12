import { defineConfig } from 'vite'

// Define common rollup options
const commonRollupOptions = {
  output: {
    assetFileNames: 'assets/[name].[ext]'
  }
}

export default defineConfig(({ command, mode }) => {
  // Check for specific build target
  const buildTarget = process.env.BUILD_TARGET

  if (buildTarget === 'umd-main') {
    // Build main component as UMD
    return {
      build: {
        emptyOutDir: false, // Don't clear dist folder
        lib: {
          entry: 'src/webcomponent.js',
          name: 'MaxHeadroom',
          fileName: (format) => {
            if (format === 'umd') return 'max-headroom-bg.umd.js'
            if (format === 'es') return 'max-headroom-bg.esm.js'
            return `max-headroom-bg.${format}.js`
          },
          formats: ['es', 'umd']
        },
        rollupOptions: commonRollupOptions
      }
    }
  }

  if (buildTarget === 'umd-overlay') {
    // Build video overlay component as UMD
    return {
      build: {
        emptyOutDir: false, // Don't clear dist folder
        lib: {
          entry: 'src/video-overlay-webcomponent.js',
          name: 'MaxHeadroomVideoOverlay',
          fileName: (format) => {
            if (format === 'umd') return 'max-headroom-video-overlay.umd.js'
            if (format === 'es') return 'max-headroom-video-overlay.esm.js'
            return `max-headroom-video-overlay.${format}.js`
          },
          formats: ['es', 'umd']
        },
        rollupOptions: {
          ...commonRollupOptions,
          external: ['@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl', '@tensorflow-models/body-segmentation', '@mediapipe/selfie_segmentation'],
          output: {
            ...commonRollupOptions.output,
            globals: {
              '@tensorflow/tfjs-core': 'tf',
              '@tensorflow/tfjs-backend-webgl': 'tfBackendWebgl',
              '@tensorflow-models/body-segmentation': 'bodySegmentation',
              '@mediapipe/selfie_segmentation': 'SelfieSegmentation'
            }
          }
        }
      }
    }
  }

  // Default: Build both as ES modules (for development and multi-entry)
  return {
    build: {
      lib: {
        entry: {
          'max-headroom': 'src/webcomponent.js',
          'max-headroom-video-overlay': 'src/video-overlay-webcomponent.js'
        },
        fileName: (format, entryName) => {
          if (format === 'es') return `${entryName}.esm.js`
          return `${entryName}.${format}.js`
        },
        formats: ['es']
      },
      rollupOptions: {
        ...commonRollupOptions,
        external: ['@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl', '@tensorflow-models/body-segmentation', '@mediapipe/selfie_segmentation']
      }
    },
    assetsInclude: ['**/*.glsl'],
    server: {
      port: 3000,
      open: true
    }
  }
}) 