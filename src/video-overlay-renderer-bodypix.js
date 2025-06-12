import { VideoOverlayRendererBase } from './video-overlay-renderer-common.js';

export class VideoOverlayRendererBodyPix extends VideoOverlayRendererBase {
  constructor(video, canvas, options = {}) {
    super(video, canvas, options);
  }

  async loadModel() {
    this.updateStatus('Loading BodyPix model...');
    
    try {
      // Dynamically import TensorFlow.js and BodyPix
      const [tf, bodyPix] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/body-pix')
      ]);
      
      // Initialize TensorFlow backend if needed
      await tf.ready();
      
      this.model = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2,
      });
      
      this.updateStatus('Model loaded');
    } catch (error) {
      this.updateStatus('Failed to load model');
      console.error('Error loading TensorFlow.js or BodyPix:', error);
      throw error;
    }
  }

  async getSegmentation() {
    // Get segmentation
    return await this.model.segmentPerson(this.video, {
      flipHorizontal: true,
      internalResolution: 'medium',
      segmentationThreshold: 0.7,
    });
  }

  applySegmentationMask(imageData, segmentation, videoRect) {
    const data = imageData.data;
    const segmentationData = segmentation.data;
    const segWidth = segmentation.width;
    const segHeight = segmentation.height;
    
    const scaleX = videoRect.width / segWidth;
    const scaleY = videoRect.height / segHeight;
    
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const pixelIndex = (y * imageData.width + x) * 4;
        
        if (x >= videoRect.offsetX && x < videoRect.offsetX + videoRect.width &&
            y >= videoRect.offsetY && y < videoRect.offsetY + videoRect.height) {
          
          const videoX = x - videoRect.offsetX;
          const videoY = y - videoRect.offsetY;
          const segX = Math.floor(videoX / scaleX);
          const segY = Math.floor(videoY / scaleY);
          
          if (segX >= 0 && segX < segWidth && segY >= 0 && segY < segHeight) {
            const segIndex = segY * segWidth + segX;
            
            if (segmentationData[segIndex] === 0) {
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
} 