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
    // Build main video overlay component as UMD (backward compatibility)
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

  if (buildTarget === 'umd-overlay-mediapipe') {
    // Build MediaPipe video overlay component as UMD
    return {
      build: {
        emptyOutDir: false, // Don't clear dist folder
        lib: {
          entry: 'src/video-overlay-webcomponent-mediapipe.js',
          name: 'MaxHeadroomVideoOverlayMediaPipe',
          fileName: (format) => {
            if (format === 'umd') return 'max-headroom-video-overlay-mediapipe.umd.js'
            if (format === 'es') return 'max-headroom-video-overlay-mediapipe.esm.js'
            return `max-headroom-video-overlay-mediapipe.${format}.js`
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

  if (buildTarget === 'umd-overlay-bodypix') {
    // Build BodyPix video overlay component as UMD
    return {
      build: {
        emptyOutDir: false, // Don't clear dist folder
        lib: {
          entry: 'src/video-overlay-webcomponent-bodypix.js',
          name: 'MaxHeadroomVideoOverlayBodyPix',
          fileName: (format) => {
            if (format === 'umd') return 'max-headroom-video-overlay-bodypix.umd.js'
            if (format === 'es') return 'max-headroom-video-overlay-bodypix.esm.js'
            return `max-headroom-video-overlay-bodypix.${format}.js`
          },
          formats: ['es', 'umd']
        },
        rollupOptions: {
          ...commonRollupOptions,
          external: ['@tensorflow/tfjs', '@tensorflow-models/body-pix'],
          output: {
            ...commonRollupOptions.output,
            globals: {
              '@tensorflow/tfjs': 'tf',
              '@tensorflow-models/body-pix': 'bodyPix'
            }
          }
        }
      }
    }
  }

  // Default: Build all components as ES modules (for development and multi-entry)
  return {
    build: {
      lib: {
        entry: {
          'max-headroom': 'src/webcomponent.js',
          'max-headroom-video-overlay': 'src/video-overlay-webcomponent.js',
          'max-headroom-video-overlay-mediapipe': 'src/video-overlay-webcomponent-mediapipe.js',
          'max-headroom-video-overlay-bodypix': 'src/video-overlay-webcomponent-bodypix.js'
        },
        fileName: (format, entryName) => {
          if (format === 'es') return `${entryName}.esm.js`
          return `${entryName}.${format}.js`
        },
        formats: ['es']
      },
      rollupOptions: {
        ...commonRollupOptions,
        external: [
          '@tensorflow/tfjs',
          '@tensorflow/tfjs-core', 
          '@tensorflow/tfjs-backend-webgl', 
          '@tensorflow-models/body-segmentation', 
          '@mediapipe/selfie_segmentation',
          '@tensorflow-models/body-pix'
        ]
      }
    },
    assetsInclude: ['**/*.glsl'],
    server: {
      port: 3000,
      open: true
    }
  }
}) 