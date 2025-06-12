import { BodySegmentationRenderer } from './body-segmentation-renderer.js';

class BodySegmentation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.video = null;
    this.canvas = null;
    this.renderer = null;
    
    // Configuration
    this.glitchFrequency = 3;
  }
  
  static get observedAttributes() {
    return ['glitch-frequency', 'width', 'height'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'glitch-frequency':
        this.glitchFrequency = parseInt(newValue || '3');
        if (this.renderer) {
          this.renderer.updateConfig({ glitchFrequency: this.glitchFrequency });
        }
        break;
      case 'width':
      case 'height':
        this.resizeCanvas();
        break;
    }
  }
  
  connectedCallback() {
    this.render();
    this.setupCanvas();
    this.initialize();
  }
  
  disconnectedCallback() {
    this.stop();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        video {
          display: none;
        }
        
        canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .status {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: #00ffff;
          padding: 10px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          z-index: 100;
          pointer-events: auto;
        }
      </style>
      <video id="video" autoplay muted playsinline></video>
      <canvas id="canvas"></canvas>
      <div class="status" id="status">Loading...</div>
    `;
  }
  
  setupCanvas() {
    this.video = this.shadowRoot.getElementById('video');
    this.canvas = this.shadowRoot.getElementById('canvas');
    this.status = this.shadowRoot.getElementById('status');
    
    this.resizeCanvas();
    
    // Handle resize
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  resizeCanvas() {
    if (!this.canvas) return;
    
    const width = parseInt(this.getAttribute('width')) || window.innerWidth;
    const height = parseInt(this.getAttribute('height')) || window.innerHeight;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    if (this.renderer) {
      this.renderer.updateCanvasSize();
    }
  }
  
  async initialize() {
    try {
      this.updateStatus('Setting up camera...');
      await this.setupCamera();
      
      // Create renderer
      this.renderer = new BodySegmentationRenderer(this.video, this.canvas, {
        glitchFrequency: this.glitchFrequency
      });
      
      // Set up status update callback
      this.renderer.onStatusChange = (message) => this.updateStatus(message);
      
      // Load model and start
      await this.renderer.loadModel();
      this.updateStatus('Ready');
      this.renderer.start();
      
    } catch (error) {
      this.updateStatus(`Error: ${error.message}`);
      console.error('Body segmentation initialization error:', error);
    }
  }
  
  async setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: 'user'
      },
      audio: false,
    });
    
    this.video.srcObject = stream;
    
    return new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.video.play();
        resolve();
      };
    });
  }
  
  updateStatus(message) {
    if (this.status) {
      this.status.textContent = message;
    }
    
    // Dispatch event for external status updates
    this.dispatchEvent(new CustomEvent('status-change', {
      detail: { status: message }
    }));
  }
  
  start() {
    if (this.renderer) {
      this.renderer.start();
    }
  }
  
  stop() {
    if (this.renderer) {
      this.renderer.stop();
    }
    
    // Stop camera
    if (this.video && this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  }
  
  // Public API methods
  setGlitchFrequency(frequency) {
    this.glitchFrequency = frequency;
    if (this.renderer) {
      this.renderer.setGlitchFrequency(frequency);
    }
  }
  
  getCurrentStatus() {
    return this.status ? this.status.textContent : '';
  }
}

// Register the custom element
customElements.define('body-segmentation', BodySegmentation);

export default BodySegmentation; 