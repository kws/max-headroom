export class VideoOverlayRendererBase {
  constructor(video, canvas, options = {}) {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.model = null;
    this.isRunning = false;
    
    // Configuration
    this.config = {
      glitchFrequency: 3,
      ...options
    };
    
    // Glitch state management
    this.glitchState = {
      isGlitching: false,
      glitchType: 'none',
      glitchStartTime: 0,
      glitchDuration: 0,
      nextGlitchTime: 0,
      lastGlitchType: 'none',
      repeatCount: 0,
      maxRepeats: 0
    };
    
    // Create temporary canvas for transform operations
    this.tempCanvas = null;
    this.tempCtx = null;
    
    // Frame buffer for "skipping record" effect
    this.frameBuffer = [];
    this.frameBufferSize = 12;
    this.replayFrameIndex = 0;
    
    // Event callbacks
    this.onStatusChange = null;
    
    this.setupTempCanvas();
  }
  
  setupTempCanvas() {
    this.tempCanvas = document.createElement('canvas');
    this.tempCtx = this.tempCanvas.getContext('2d');
    this.updateCanvasSize();
  }
  
  updateCanvasSize() {
    if (!this.tempCanvas) return;
    
    this.tempCanvas.width = this.canvas.width;
    this.tempCanvas.height = this.canvas.height;
    
    // Clear frame buffer when resizing
    this.frameBuffer = [];
  }
  
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  
  // Abstract method - must be implemented by subclasses
  async loadModel() {
    throw new Error('loadModel() must be implemented by subclass');
  }
  
  // Abstract method - must be implemented by subclasses
  async getSegmentation() {
    throw new Error('getSegmentation() must be implemented by subclass');
  }
  
  // Abstract method - must be implemented by subclasses
  applySegmentationMask(imageData, segmentation, videoRect) {
    throw new Error('applySegmentationMask() must be implemented by subclass');
  }
  
  updateStatus(message) {
    if (this.onStatusChange) {
      this.onStatusChange(message);
    }
  }
  
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.renderFrame();
  }
  
  stop() {
    this.isRunning = false;
  }
  
  destroy() {
    this.stop();
    this.model = null;
    this.frameBuffer = [];
  }
  
  async renderFrame() {
    if (!this.isRunning || !this.model) return;
    
    try {
      const currentTime = Date.now();
      
      // Update glitch state
      this.updateGlitchState(currentTime);
      
      // Get segmentation (implemented by subclass)
      const segmentation = await this.getSegmentation();
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Calculate video scaling
      const videoRect = this.calculateVideoRect();
      
      let currentFrameCanvas = null;
      
      // Check if we should use a replay frame (skipping record effect)
      if (this.glitchState.isGlitching && this.glitchState.glitchType === 'skip') {
        currentFrameCanvas = this.getReplayFrame();
      }
      
      if (currentFrameCanvas) {
        // Use buffered frame (skip effect)
        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        this.tempCtx.drawImage(currentFrameCanvas, 0, 0);
      } else {
        // Normal processing: draw current video frame
        this.ctx.drawImage(this.video, videoRect.offsetX, videoRect.offsetY, videoRect.width, videoRect.height);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply segmentation mask (implemented by subclass)
        const maskedImageData = await this.applySegmentationMask(imageData, segmentation, videoRect);
        
        // Put the masked image data on temp canvas
        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        this.tempCtx.putImageData(maskedImageData, 0, 0);
        
        // Capture this processed frame for potential future replay
        if (!this.glitchState.isGlitching || this.glitchState.glitchType !== 'skip') {
          this.captureCurrentFrame(maskedImageData);
        }
      }
      
      // Clear main canvas for final render
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Apply glitch transform for final render
      const wasTransformed = this.applyGlitchTransform(videoRect, currentTime);
      
      // Draw the temp canvas with transforms applied
      this.ctx.drawImage(this.tempCanvas, 0, 0);
      
      // Restore transform
      this.restoreGlitchTransform(wasTransformed);
      
    } catch (error) {
      console.error('Frame rendering error:', error);
    }
    
    if (this.isRunning) {
      requestAnimationFrame(() => this.renderFrame());
    }
  }
  
  calculateVideoRect() {
    const videoAspect = this.video.videoWidth / this.video.videoHeight;
    const canvasAspect = this.canvas.width / this.canvas.height;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (videoAspect > canvasAspect) {
      drawHeight = this.canvas.height;
      drawWidth = drawHeight * videoAspect;
      offsetX = (this.canvas.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = this.canvas.width;
      drawHeight = drawWidth / videoAspect;
      offsetX = 0;
      offsetY = (this.canvas.height - drawHeight) / 2;
    }
    
    return { offsetX, offsetY, width: drawWidth, height: drawHeight };
  }
  
  captureCurrentFrame(maskedImageData) {
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = this.canvas.width;
    frameCanvas.height = this.canvas.height;
    const frameCtx = frameCanvas.getContext('2d');
    
    frameCtx.putImageData(maskedImageData, 0, 0);
    this.frameBuffer.push(frameCanvas);
    
    if (this.frameBuffer.length > this.frameBufferSize) {
      this.frameBuffer.shift();
    }
  }
  
  getReplayFrame() {
    if (this.frameBuffer.length === 0) return null;
    
    const frame = this.frameBuffer[this.replayFrameIndex];
    this.replayFrameIndex++;
    
    if (this.replayFrameIndex >= this.frameBuffer.length) {
      this.replayFrameIndex = Math.max(0, this.frameBuffer.length - 6);
    }
    
    return frame;
  }
  
  updateGlitchState(currentTime) {
    if (!this.glitchState.isGlitching && currentTime >= this.glitchState.nextGlitchTime) {
      if (this.config.glitchFrequency > 0) {
        this.glitchState.isGlitching = true;
        this.glitchState.glitchStartTime = currentTime;
        this.glitchState.glitchDuration = 80 + Math.random() * 200;
        
        const shouldRepeat = this.glitchState.lastGlitchType !== 'none' && 
                            this.glitchState.repeatCount < this.glitchState.maxRepeats &&
                            Math.random() < 0.7;
        
        if (shouldRepeat) {
          this.glitchState.glitchType = this.glitchState.lastGlitchType;
          this.glitchState.repeatCount++;
        } else {
          const glitchTypes = ['flipH', 'flipV', 'flipBoth', 'mirror', 'offset', 'skip'];
          this.glitchState.glitchType = glitchTypes[Math.floor(Math.random() * glitchTypes.length)];
          this.glitchState.lastGlitchType = this.glitchState.glitchType;
          this.glitchState.repeatCount = 1;
          
          if (this.glitchState.glitchType === 'skip') {
            this.glitchState.maxRepeats = 2 + Math.floor(Math.random() * 5);
            this.replayFrameIndex = Math.max(0, this.frameBuffer.length - 8);
          } else {
            this.glitchState.maxRepeats = 1 + Math.floor(Math.random() * 4);
          }
        }
      }
      
      if (this.config.glitchFrequency > 0) {
        if (this.glitchState.repeatCount < this.glitchState.maxRepeats) {
          this.glitchState.nextGlitchTime = currentTime + 150 + Math.random() * 200;
        } else {
          const minInterval = 500;
          const maxInterval = 5000;
          const interval = maxInterval - ((this.config.glitchFrequency - 1) / 9) * (maxInterval - minInterval);
          this.glitchState.nextGlitchTime = currentTime + interval + Math.random() * interval * 0.5;
          
          this.glitchState.lastGlitchType = 'none';
          this.glitchState.repeatCount = 0;
          this.glitchState.maxRepeats = 0;
        }
      } else {
        this.glitchState.nextGlitchTime = currentTime + 10000;
      }
    }
    
    if (this.glitchState.isGlitching && 
        currentTime >= this.glitchState.glitchStartTime + this.glitchState.glitchDuration) {
      this.glitchState.isGlitching = false;
      this.glitchState.glitchType = 'none';
    }
  }
  
  applyGlitchTransform(videoRect, currentTime) {
    if (!this.glitchState.isGlitching) return false;
    
    const centerX = videoRect.offsetX + videoRect.width / 2;
    const centerY = videoRect.offsetY + videoRect.height / 2;
    
    this.ctx.save();
    
    switch (this.glitchState.glitchType) {
      case 'flipH':
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(-1, 1);
        this.ctx.translate(-centerX, -centerY);
        break;
        
      case 'flipV':
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(1, -1);
        this.ctx.translate(-centerX, -centerY);
        break;
        
      case 'flipBoth':
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(-1, -1);
        this.ctx.translate(-centerX, -centerY);
        break;
        
      case 'mirror':
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(-1, 1);
        this.ctx.translate(-centerX + (Math.sin(currentTime * 0.01) * 20), -centerY);
        break;
        
      case 'offset':
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 20;
        this.ctx.translate(offsetX, offsetY);
        break;
        
      case 'skip':
        const jitterX = (Math.random() - 0.5) * 6;
        const jitterY = (Math.random() - 0.5) * 6;
        this.ctx.translate(jitterX, jitterY);
        break;
    }
    
    return true;
  }
  
  restoreGlitchTransform(wasTransformed) {
    if (wasTransformed) {
      this.ctx.restore();
    }
  }
  
  // Public API methods
  setGlitchFrequency(frequency) {
    this.config.glitchFrequency = frequency;
  }
} 