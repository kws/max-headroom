import { VideoOverlayRendererBase } from './video-overlay-renderer-common.js';

export class VideoOverlayRendererMediaPipe extends VideoOverlayRendererBase {
  constructor(video, canvas, options = {}) {
    super(video, canvas, options);
    this.segmenter = null;
  }

  async loadModel() {
    this.updateStatus('Loading MediaPipe SelfieSegmentation model...');
    
    try {
      // Dynamically import TensorFlow.js core, WebGL backend, and MediaPipe body segmentation
      const [tfCore, tfBackendWebgl, bodySegmentation] = await Promise.all([
        import('@tensorflow/tfjs-core'),
        import('@tensorflow/tfjs-backend-webgl'),
        import('@tensorflow-models/body-segmentation')
      ]);
      
      // Also import the MediaPipe backend
      await import('@mediapipe/selfie_segmentation');
      
      // Register the WebGL backend
      tfCore.registerBackend('webgl', () => new tfBackendWebgl.WebGLBackend());
      
      // Set the backend and wait for it to be ready
      await tfCore.setBackend('webgl');
      await tfCore.ready();
      
      this.updateStatus('Creating segmenter...');
      
      // Create the segmenter with MediaPipe SelfieSegmentation
      const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
      const segmenterConfig = {
        runtime: 'mediapipe',
        modelType: 'general', // 'general' for higher accuracy, 'landscape' for speed
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation'
      };
      
      this.segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);
      this.model = this.segmenter; // Set base class model property
      
      this.updateStatus('Model loaded');
    } catch (error) {
      this.updateStatus('Failed to load model');
      console.error('Error loading MediaPipe SelfieSegmentation:', error);
      throw error;
    }
  }

  async getSegmentation() {
    // Get segmentation using MediaPipe
    const segmentations = await this.segmenter.segmentPeople(this.video);
    return segmentations[0]; // MediaPipe returns array with single segmentation
  }

  async applySegmentationMask(imageData, segmentation, videoRect) {
    const data = imageData.data;
    
    // Get the segmentation mask as ImageData
    const maskImageData = await segmentation.mask.toImageData();
    const maskData = maskImageData.data;
    const maskWidth = maskImageData.width;
    const maskHeight = maskImageData.height;
    
    const scaleX = videoRect.width / maskWidth;
    const scaleY = videoRect.height / maskHeight;
    
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const pixelIndex = (y * imageData.width + x) * 4;
        
        if (x >= videoRect.offsetX && x < videoRect.offsetX + videoRect.width &&
            y >= videoRect.offsetY && y < videoRect.offsetY + videoRect.height) {
          
          const videoX = x - videoRect.offsetX;
          const videoY = y - videoRect.offsetY;
          const maskX = Math.floor(videoX / scaleX);
          const maskY = Math.floor(videoY / scaleY);
          
          if (maskX >= 0 && maskX < maskWidth && maskY >= 0 && maskY < maskHeight) {
            const maskIndex = (maskY * maskWidth + maskX) * 4;
            
            // MediaPipe uses alpha channel for segmentation probability
            // Values closer to 255 indicate higher probability of being a person
            const segmentationProbability = maskData[maskIndex + 3];
            
            // Apply threshold - if probability is low, make transparent
            if (segmentationProbability < 128) { // threshold of 0.5 (128/255)
              data[pixelIndex + 3] = 0; // Make background transparent
            }
          }
        } else {
          data[pixelIndex + 3] = 0; // Outside video area - transparent
        }
      }
    }
    
    return imageData;
  }

  destroy() {
    super.destroy();
    this.segmenter = null;
  }
} 