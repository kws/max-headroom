export class MaxHeadroomVideoOverlayBase extends HTMLElement {
  constructor() {
    super();
    
    this.renderer = null;
    this.video = null;
    this.canvas = null;
    this.stream = null;
    this.currentStatus = 'Initializing...';
    
    // Configuration
    this.config = {
      glitchFrequency: 3,
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    this.setupDOM();
    this.setupEventListeners();
  }
  
  static get observedAttributes() {
    return ['glitch-frequency', 'width', 'height'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'glitch-frequency':
        this.config.glitchFrequency = parseFloat(newValue) || 3;
        if (this.renderer) {
          this.renderer.setGlitchFrequency(this.config.glitchFrequency);
        }
        break;
      case 'width':
        this.config.width = parseInt(newValue) || window.innerWidth;
        this.updateCanvasSize();
        break;
      case 'height':
        this.config.height = parseInt(newValue) || window.innerHeight;
        this.updateCanvasSize();
        break;
    }
  }
  
  setupDOM() {
    this.style.cssText = `
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `;
    
    // Create video element (hidden)
    this.video = document.createElement('video');
    this.video.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: 1px;
      height: 1px;
    `;
    this.video.autoplay = true;
    this.video.muted = true;
    this.video.playsInline = true;
    
    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      width: 100%;
      height: 100%;
      display: block;
    `;
    
    this.appendChild(this.video);
    this.appendChild(this.canvas);
    
    this.updateCanvasSize();
  }
  
  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
      if (!this.hasAttribute('width')) this.config.width = window.innerWidth;
      if (!this.hasAttribute('height')) this.config.height = window.innerHeight;
      this.updateCanvasSize();
    });
    
    // Video events
    this.video.addEventListener('loadedmetadata', () => {
      this.initializeRenderer();
    });
    
    this.video.addEventListener('error', () => {
      this.updateStatus('Camera error');
    });
  }
  
  updateCanvasSize() {
    if (this.canvas) {
      this.canvas.width = this.config.width;
      this.canvas.height = this.config.height;
      
      if (this.renderer) {
        this.renderer.updateCanvasSize();
      }
    }
  }

  // Abstract methods - must be implemented by subclasses
  getRendererClass() {
    throw new Error('getRendererClass() must be implemented by subclass');
  }

  getLoadingMessage() {
    throw new Error('getLoadingMessage() must be implemented by subclass');
  }
  
  async initializeRenderer() {
    try {
      this.updateStatus(this.getLoadingMessage());
      
      const RendererClass = this.getRendererClass();
      this.renderer = new RendererClass(this.video, this.canvas, {
        glitchFrequency: this.config.glitchFrequency
      });
      
      this.renderer.onStatusChange = (status) => {
        this.updateStatus(status);
      };
      
      await this.renderer.loadModel();
      this.updateStatus('Ready');
      this.renderer.start();
      
    } catch (error) {
      console.error('Failed to initialize renderer:', error);
      this.updateStatus('Initialization failed');
    }
  }
  
  updateStatus(status) {
    this.currentStatus = status;
    this.dispatchEvent(new CustomEvent('status-change', {
      detail: { status },
      bubbles: true
    }));
  }
  
  async connectedCallback() {
    // Start camera when component is added to DOM
    await this.startCamera();
  }
  
  disconnectedCallback() {
    // Clean up when component is removed from DOM
    this.stop();
  }
  
  async startCamera() {
    try {
      this.updateStatus('Requesting camera access...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      
      this.video.srcObject = this.stream;
      this.updateStatus('Camera connected');
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.updateStatus('Camera access denied');
    }
  }
  
  // Public API methods
  start() {
    if (this.renderer) {
      this.renderer.start();
    } else {
      this.startCamera();
    }
  }
  
  stop() {
    if (this.renderer) {
      this.renderer.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.updateStatus('Stopped');
  }
  
  setGlitchFrequency(frequency) {
    this.config.glitchFrequency = frequency;
    if (this.renderer) {
      this.renderer.setGlitchFrequency(frequency);
    }
    this.setAttribute('glitch-frequency', frequency);
  }
  
  getCurrentStatus() {
    return this.currentStatus;
  }
} 