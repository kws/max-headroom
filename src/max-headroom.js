class MaxHeadroomBackground extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.animationId = null;
    this.startTime = Date.now();
    
    this.uniforms = {
      u_time: null,
      u_resolution: null,
      u_mouse: null
    };
    
    this.mouseX = 0;
    this.mouseY = 0;
  }
  
  connectedCallback() {
    this.render();
    this.setupWebGL();
    this.setupEventListeners();
    this.animate();
  }
  
  disconnectedCallback() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
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
  
  setupWebGL() {
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      console.error('WebGL not supported');
      return;
    }
    
    this.resizeCanvas();
    
    // Vertex shader
    const vertexShaderSource = `
      attribute vec4 a_position;
      void main() {
        gl_Position = a_position;
      }
    `;
    
    // Fragment shader with Max Headroom style effects
    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      
      // Noise function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      
      // 2D Noise
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        return mix(a, b, u.x) +
               (c - a)* u.y * (1.0 - u.x) +
               (d - b) * u.x * u.y;
      }
      
      // Grid function
      float grid(vec2 st, float res) {
        vec2 grid = fract(st * res);
        return (step(res, grid.x) * step(res, grid.y));
      }
      
      // Digital distortion
      vec2 digitalDistort(vec2 uv, float time) {
        float distortionStrength = 0.01;
        uv.x += sin(uv.y * 20.0 + time * 3.0) * distortionStrength;
        uv.y += cos(uv.x * 15.0 + time * 2.0) * distortionStrength;
        return uv;
      }
      
      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        vec2 mouse = u_mouse / u_resolution.xy;
        
        // Apply digital distortion
        st = digitalDistort(st, u_time);
        
        // Create animated grid
        float time = u_time * 0.5;
        vec2 gridSt = st * 10.0;
        gridSt += vec2(sin(time * 0.5), cos(time * 0.3)) * 0.5;
        
        float gridPattern = grid(gridSt, 0.02);
        
        // Add diagonal lines
        float diagonals = abs(sin((st.x + st.y) * 20.0 + time * 2.0));
        diagonals = smoothstep(0.8, 1.0, diagonals);
        
        // Create interference patterns
        float interference = sin(st.y * 100.0 + time * 10.0) * 0.1;
        interference += sin(st.x * 80.0 + time * 8.0) * 0.05;
        
        // Noise layer
        float noisePattern = noise(st * 5.0 + time * 0.1);
        
        // Mouse interaction - create ripples
        float mouseDistance = distance(st, mouse);
        float mouseRipple = sin(mouseDistance * 20.0 - time * 5.0) * 0.1;
        mouseRipple *= exp(-mouseDistance * 3.0);
        
        // Combine all patterns
        float pattern = gridPattern + diagonals * 0.3 + interference + noisePattern * 0.2 + mouseRipple;
        
        // Max Headroom color palette
        vec3 color1 = vec3(0.0, 0.8, 1.0);  // Cyan
        vec3 color2 = vec3(1.0, 0.0, 1.0);  // Magenta
        vec3 color3 = vec3(0.0, 1.0, 0.8);  // Green-cyan
        vec3 color4 = vec3(1.0, 0.5, 0.0);  // Orange
        
        // Create color bands
        float colorMix = sin(st.y * 3.0 + time) * 0.5 + 0.5;
        vec3 baseColor = mix(color1, color2, colorMix);
        baseColor = mix(baseColor, color3, sin(st.x * 2.0 + time * 0.7) * 0.5 + 0.5);
        
        // Add scanlines
        float scanline = sin(st.y * u_resolution.y * 0.5) * 0.1 + 0.9;
        
        // Apply pattern and effects
        vec3 finalColor = baseColor * pattern * scanline;
        
        // Add some glow
        finalColor += baseColor * 0.1;
        
        // Darken the background
        finalColor *= 0.7;
        
        // Add random digital artifacts
        if (random(floor(st * 100.0) + floor(time * 10.0)) > 0.996) {
          finalColor = vec3(1.0);
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    
    this.program = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    this.setupGeometry();
    this.setupUniforms();
  }
  
  createShaderProgram(vertexSource, fragmentSource) {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
    
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Error linking shader program:', this.gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }
  
  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Error compiling shader:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  setupGeometry() {
    const positions = [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ];
    
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    
    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
  }
  
  setupUniforms() {
    this.uniforms.u_time = this.gl.getUniformLocation(this.program, 'u_time');
    this.uniforms.u_resolution = this.gl.getUniformLocation(this.program, 'u_resolution');
    this.uniforms.u_mouse = this.gl.getUniformLocation(this.program, 'u_mouse');
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = rect.height - (e.clientY - rect.top);
    });
  }
  
  resizeCanvas() {
    const rect = this.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
  
  animate() {
    const currentTime = (Date.now() - this.startTime) / 1000.0;
    
    this.gl.useProgram(this.program);
    
    // Update uniforms
    this.gl.uniform1f(this.uniforms.u_time, currentTime);
    this.gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(this.uniforms.u_mouse, this.mouseX, this.mouseY);
    
    // Clear and draw
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

// Register the custom element
customElements.define('max-headroom-bg', MaxHeadroomBackground);

export default MaxHeadroomBackground; 