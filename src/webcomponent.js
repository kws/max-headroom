import { MaxHeadroomRenderer } from './renderer.js';

class MaxHeadroomBackground extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.canvas = null;
    this.renderer = null;
  }
  
  static get observedAttributes() {
    return ['speed', 'fisheye-strength', 'camera-distance', 'line-width', 'line-spacing'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (this.renderer) {
      const config = {};
      
      switch (name) {
        case 'speed':
          config.speed = parseFloat(newValue || '0.3');
          break;
        case 'fisheye-strength':
          config.fisheyeStrength = parseFloat(newValue || '0.1');
          break;
        case 'camera-distance':
          config.cameraDistance = parseFloat(newValue || '0.5');
          break;
        case 'line-width':
          config.lineWidth = parseFloat(newValue || '0.2');
          break;
        case 'line-spacing':
          config.lineSpacing = parseFloat(newValue || '80.0');
          break;
      }
      
      this.renderer.updateConfig(config);
    }
  }
  
  connectedCallback() {
    this.render();
    this.setupRenderer();
  }
  
  disconnectedCallback() {
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        canvas {
          width: 100%;
          height: 100%;
          display: block;
        }
      </style>
      <canvas id="max-headroom-canvas"></canvas>
    `;
    
    this.canvas = this.shadowRoot.getElementById('max-headroom-canvas');
  }
  
  async setupRenderer() {
    try {
      this.renderer = new MaxHeadroomRenderer(this.canvas);
      
      // Set initial configuration from attributes
      const config = {
        speed: parseFloat(this.getAttribute('speed') || '0.3'),
        fisheyeStrength: parseFloat(this.getAttribute('fisheye-strength') || '0'),
        cameraDistance: parseFloat(this.getAttribute('camera-distance') || '0.5'),
        lineWidth: parseFloat(this.getAttribute('line-width') || '0.2'),
        lineSpacing: parseFloat(this.getAttribute('line-spacing') || '80.0')
      };
      
      this.renderer.updateConfig(config);
      this.renderer.start();
    } catch (error) {
      console.error('Failed to initialize Max Headroom renderer:', error);
    }
  }
}

// Register the custom element
customElements.define('max-headroom-bg', MaxHeadroomBackground);

export default MaxHeadroomBackground; 