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
      u_modelViewMatrix: null,
      u_projectionMatrix: null
    };
    
    this.attributeLocations = {
      a_position: null,
      a_color: null,
      a_texCoord: null
    };
    
    this.buffers = {
      position: null,
      color: null,
      texCoord: null,
      indices: null
    };
    
    this.currentRotation = { x: 0, y: 0, z: 0 };
    this.updateRotationSpeeds();
  }
  
  static get observedAttributes() {
    return ['speed'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'speed' && oldValue !== newValue) {
      this.updateRotationSpeeds();
    }
  }
  
  updateRotationSpeeds() {
    // Get speed from attribute, default to 0.3 (slower than before)
    const speed = parseFloat(this.getAttribute('speed') || '0.3');
    
    // Random rotation speeds for each axis, scaled by speed
    this.rotationX = (Math.random() * 0.01 + 0.003) * speed;
    this.rotationY = (Math.random() * 0.01 + 0.003) * speed;
    this.rotationZ = (Math.random() * 0.01 + 0.003) * speed;
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
    
    // Enable depth testing for 3D
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
    
    // Vertex shader for 3D cube
    const vertexShaderSource = `
      attribute vec4 a_position;
      attribute vec4 a_color;
      attribute vec2 a_texCoord;
      
      uniform mat4 u_modelViewMatrix;
      uniform mat4 u_projectionMatrix;
      
      varying vec4 v_color;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
        v_color = a_color;
        v_texCoord = a_texCoord;
      }
    `;
    
    // Fragment shader with line patterns
    const fragmentShaderSource = `
      precision mediump float;
      varying vec4 v_color;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 uv = v_texCoord;
        
        // Create line patterns based on face color
        float pattern = 0.0;
        
        // Different line patterns for different faces - thin lines with more space
        if (v_color.r > 0.9 && v_color.g < 0.1 && v_color.b < 0.1) {
          // Red face - thin horizontal lines
          pattern = step(0.85, mod(uv.y * 20.0, 1.0));
        } else if (v_color.r < 0.1 && v_color.g > 0.9 && v_color.b < 0.1) {
          // Green face - thin vertical lines  
          pattern = step(0.85, mod(uv.x * 20.0, 1.0));
        } else if (v_color.r < 0.1 && v_color.g < 0.1 && v_color.b > 0.9) {
          // Blue face - thin horizontal lines
          pattern = step(0.85, mod(uv.y * 18.0, 1.0));
        } else if (v_color.r > 0.9 && v_color.g > 0.9 && v_color.b < 0.1) {
          // Yellow face - thin vertical lines
          pattern = step(0.85, mod(uv.x * 18.0, 1.0));
        } else if (v_color.r > 0.9 && v_color.g < 0.1 && v_color.b > 0.9) {
          // Magenta face - thin diagonal lines
          pattern = step(0.85, mod((uv.x + uv.y) * 15.0, 1.0));
        } else {
          // Cyan face - thin horizontal lines
          pattern = step(0.85, mod(uv.y * 22.0, 1.0));
        }
        
        // Add some glow effect
        float glow = pattern * 0.8 + 0.2;
        
        gl_FragColor = vec4(v_color.rgb * glow, 1.0);
      }
    `;
    
    this.program = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    this.setupCubeGeometry();
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
  
  setupCubeGeometry() {
    // Large cube vertices (camera is inside looking out)
    const size = 10.0; // Make cube much larger
    const positions = [
      // Front face (reversed winding for inner face)
      -size, -size,  size,
      -size,  size,  size,
       size,  size,  size,
       size, -size,  size,
      
      // Back face (reversed winding for inner face)  
      -size, -size, -size,
       size, -size, -size,
       size,  size, -size,
      -size,  size, -size,
      
      // Top face (reversed winding for inner face)
      -size,  size, -size,
       size,  size, -size,
       size,  size,  size,
      -size,  size,  size,
      
      // Bottom face (reversed winding for inner face)
      -size, -size, -size,
      -size, -size,  size,
       size, -size,  size,
       size, -size, -size,
      
      // Right face (reversed winding for inner face)
       size, -size, -size,
       size, -size,  size,
       size,  size,  size,
       size,  size, -size,
      
      // Left face (reversed winding for inner face)
      -size, -size, -size,
      -size,  size, -size,
      -size,  size,  size,
      -size, -size,  size,
    ];
    
    // Max Headroom colors - bright neon 80s palette
    const colors = [
      // Front face - Bright Cyan
      0.0, 1.0, 1.0, 1.0,
      0.0, 1.0, 1.0, 1.0,
      0.0, 1.0, 1.0, 1.0,
      0.0, 1.0, 1.0, 1.0,
      
      // Back face - Bright Magenta
      1.0, 0.0, 1.0, 1.0,
      1.0, 0.0, 1.0, 1.0,
      1.0, 0.0, 1.0, 1.0,
      1.0, 0.0, 1.0, 1.0,
      
      // Top face - Bright Yellow
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      
      // Bottom face - Bright Green
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
      
      // Right face - Bright Red
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      
      // Left face - Bright Blue
      0.0, 0.0, 1.0, 1.0,
      0.0, 0.0, 1.0, 1.0,
      0.0, 0.0, 1.0, 1.0,
      0.0, 0.0, 1.0, 1.0,
    ];
    
    // Indices for the cube faces
    const indices = [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
    ];
    
    // Create and bind position buffer
    this.buffers.position = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    
    // Create and bind color buffer
    this.buffers.color = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.color);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
    
    // Texture coordinates for each face (standard 0-1 mapping)
    const texCoords = [
      // Front face
      0.0, 0.0,  0.0, 1.0,  1.0, 1.0,  1.0, 0.0,
      // Back face  
      0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
      // Top face
      0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
      // Bottom face
      0.0, 0.0,  0.0, 1.0,  1.0, 1.0,  1.0, 0.0,
      // Right face
      0.0, 0.0,  0.0, 1.0,  1.0, 1.0,  1.0, 0.0,
      // Left face
      0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
    ];
    
    // Create and bind texture coordinate buffer
    this.buffers.texCoord = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.texCoord);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texCoords), this.gl.STATIC_DRAW);
    
    // Create and bind index buffer
    this.buffers.indices = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
  }
  
  setupUniforms() {
    this.uniforms.u_modelViewMatrix = this.gl.getUniformLocation(this.program, 'u_modelViewMatrix');
    this.uniforms.u_projectionMatrix = this.gl.getUniformLocation(this.program, 'u_projectionMatrix');
    
    this.attributeLocations.a_position = this.gl.getAttribLocation(this.program, 'a_position');
    this.attributeLocations.a_color = this.gl.getAttribLocation(this.program, 'a_color');
    this.attributeLocations.a_texCoord = this.gl.getAttribLocation(this.program, 'a_texCoord');
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  resizeCanvas() {
    const rect = this.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
  
  // Matrix math utilities
  createPerspectiveMatrix(fov, aspect, near, far) {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    const rangeInv = 1.0 / (near - far);
    
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  }
  
  createTranslationMatrix(tx, ty, tz) {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      tx, ty, tz, 1
    ];
  }
  
  createRotationXMatrix(angleInRadians) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ];
  }
  
  createRotationYMatrix(angleInRadians) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ];
  }
  
  createRotationZMatrix(angleInRadians) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    
    return [
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }
  
  multiplyMatrices(a, b) {
    const result = new Array(16);
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] = 
          a[i * 4 + 0] * b[0 * 4 + j] +
          a[i * 4 + 1] * b[1 * 4 + j] +
          a[i * 4 + 2] * b[2 * 4 + j] +
          a[i * 4 + 3] * b[3 * 4 + j];
      }
    }
    
    return result;
  }

  lookAt(eye, target, up) {
    const [ex, ey, ez] = eye;
    const [tx, ty, tz] = target;
    const [ux, uy, uz] = up;
  
    // Compute forward vector (target - eye)
    let fx = tx - ex, fy = ty - ey, fz = tz - ez;
    let rlf = 1 / Math.hypot(fx, fy, fz);
    fx *= rlf; fy *= rlf; fz *= rlf;
  
    // Compute right vector
    let rx = fy * uz - fz * uy;
    let ry = fz * ux - fx * uz;
    let rz = fx * uy - fy * ux;
    let rlr = 1 / Math.hypot(rx, ry, rz);
    rx *= rlr; ry *= rlr; rz *= rlr;
  
    // Compute up vector (recalculated)
    let ux_ = ry * fz - rz * fy;
    let uy_ = rz * fx - rx * fz;
    let uz_ = rx * fy - ry * fx;
  
    return [
      rx, ux_, -fx, 0,
      ry, uy_, -fy, 0,
      rz, uz_, -fz, 0,
      -(rx*ex + ry*ey + rz*ez),
      -(ux_*ex + uy_*ey + uz_*ez),
      fx*ex + fy*ey + fz*ez,
      1
    ];
  }
  
  
  animate() {
    const currentTime = (Date.now() - this.startTime) / 1000.0;
    
    // Update rotations
    this.currentRotation.x += this.rotationX;
    this.currentRotation.y += this.rotationY;
    this.currentRotation.z += this.rotationZ;
    
    this.gl.useProgram(this.program);
    
    // Clear the canvas
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    // Set up projection matrix
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = this.canvas.width / this.canvas.height;
    const projectionMatrix = this.createPerspectiveMatrix(fieldOfView, aspect, 0.1, 100.0);
    
    // Set up model-view matrix (camera is inside the cube at origin)
    const translationMatrix = this.createTranslationMatrix(0.0, 0.0, 0.0);
    const rotationXMatrix = this.createRotationXMatrix(this.currentRotation.x);
    const rotationYMatrix = this.createRotationYMatrix(this.currentRotation.y);
    const rotationZMatrix = this.createRotationZMatrix(this.currentRotation.z);
    
    // Radial camera distance from center
    const distance = 3.0; // Try values between 3 and 15
    const angle = this.currentRotation.y; // Use rotation to orbit around center

    // Camera position on a circular path around origin
    const camX = Math.sin(angle) * distance;
    const camZ = Math.cos(angle) * distance;
    const camY = Math.sin(this.currentRotation.x) * 0.5; // Optional vertical bobbing

    // Look-at matrix: camera looks from (camX, camY, camZ) toward (0,0,0)
    const modelViewMatrix = this.lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]);
    
    // Set uniforms
    this.gl.uniformMatrix4fv(this.uniforms.u_projectionMatrix, false, projectionMatrix);
    this.gl.uniformMatrix4fv(this.uniforms.u_modelViewMatrix, false, modelViewMatrix);
    
    // Bind position buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.vertexAttribPointer(this.attributeLocations.a_position, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.attributeLocations.a_position);
    
    // Bind color buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.color);
    this.gl.vertexAttribPointer(this.attributeLocations.a_color, 4, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.attributeLocations.a_color);
    
    // Bind texture coordinate buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.texCoord);
    this.gl.vertexAttribPointer(this.attributeLocations.a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.attributeLocations.a_texCoord);
    
    // Bind index buffer and draw
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

// Register the custom element
customElements.define('max-headroom-bg', MaxHeadroomBackground);

export default MaxHeadroomBackground; 