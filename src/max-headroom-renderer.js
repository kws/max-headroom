// Import shaders as text
import vertexShaderSource from './shaders/vertex.glsl?raw'
import fragmentShaderSource from './shaders/fragment.glsl?raw'
import fisheyeVertexShaderSource from './shaders/fisheye-vertex.glsl?raw'
import fisheyeFragmentShaderSource from './shaders/fisheye-fragment.glsl?raw'

export class MaxHeadroomRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    this.program = null;
    this.fisheyeProgram = null;
    this.framebuffer = null;
    this.colorTexture = null;
    this.depthBuffer = null;
    this.animationId = null;
    this.startTime = Date.now();
    this.isRunning = false;
    
    this.uniforms = {
      u_modelViewMatrix: null,
      u_projectionMatrix: null,
      u_lineWidth: null,
      u_lineSpacing: null
    };
    
    this.fisheyeUniforms = {
      u_texture: null,
      u_resolution: null,
      u_time: null,
      u_strength: null
    };
    
    this.attributeLocations = {
      a_position: null,
      a_color: null,
      a_texCoord: null
    };
    
    this.fisheyeAttributeLocations = {
      a_position: null,
      a_texCoord: null
    };
    
    this.buffers = {
      position: null,
      color: null,
      texCoord: null,
      indices: null,
      quadPosition: null,
      quadTexCoord: null
    };
    
    this.currentRotation = { x: 0, y: 0, z: 0 };
    this.rotationX = 0.003;
    this.rotationY = 0.003;
    this.rotationZ = 0.003;
    
    // Configuration defaults
    this.config = {
      speed: 0.3,
      fisheyeStrength: 0.1,
      cameraDistance: 0.5,
      lineWidth: 0.2,
      lineSpacing: 80.0
    };
    
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }
    
    this.init();
  }

  async init() {
    await this.loadShaders();
    this.setupFramebuffer();
    this.setupCubeGeometry();
    this.setupQuadGeometry();
    this.setupUniforms();
    this.setupEventListeners();
    this.resizeCanvas();
  }

  async loadShaders() {
    try {
      this.program = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
      this.fisheyeProgram = this.createShaderProgram(fisheyeVertexShaderSource, fisheyeFragmentShaderSource);
    } catch (error) {
      console.error('Failed to load shaders:', error);
      throw error;
    }
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

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.updateRotationSpeeds();
  }

  updateRotationSpeeds() {
    // Random rotation speeds for each axis, scaled by speed
    this.rotationX = (Math.random() * 0.01 + 0.003) * this.config.speed;
    this.rotationY = (Math.random() * 0.01 + 0.003) * this.config.speed;
    this.rotationZ = (Math.random() * 0.01 + 0.003) * this.config.speed;
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // Resize framebuffer textures
    if (this.colorTexture && this.depthBuffer) {
      // Resize color texture
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.colorTexture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.canvas.width, this.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
      
      // Resize depth buffer
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffer);
      this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.canvas.width, this.canvas.height);
    }
  }
  
  setupFramebuffer() {
    // Enable depth testing for 3D
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);

    // Create framebuffer
    this.framebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    
    // Create color texture
    this.colorTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.colorTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.canvas.width, this.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    
    // Attach color texture to framebuffer
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.colorTexture, 0);
    
    // Create depth buffer
    this.depthBuffer = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffer);
    this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.canvas.width, this.canvas.height);
    
    // Attach depth buffer to framebuffer
    this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.depthBuffer);
    
    // Check framebuffer status
    if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer not complete');
    }
    
    // Unbind framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
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
  
  setupQuadGeometry() {
    // Full-screen quad vertices (NDC coordinates)
    const quadPositions = [
      -1.0, -1.0,
       1.0, -1.0,
       1.0,  1.0,
      -1.0,  1.0,
    ];
    
    // Texture coordinates for the quad
    const quadTexCoords = [
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ];
    
    // Create and bind quad position buffer
    this.buffers.quadPosition = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.quadPosition);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadPositions), this.gl.STATIC_DRAW);
    
    // Create and bind quad texture coordinate buffer
    this.buffers.quadTexCoord = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.quadTexCoord);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadTexCoords), this.gl.STATIC_DRAW);
  }
  
  setupUniforms() {
    this.uniforms.u_modelViewMatrix = this.gl.getUniformLocation(this.program, 'u_modelViewMatrix');
    this.uniforms.u_projectionMatrix = this.gl.getUniformLocation(this.program, 'u_projectionMatrix');
    this.uniforms.u_lineWidth = this.gl.getUniformLocation(this.program, 'u_lineWidth');
    this.uniforms.u_lineSpacing = this.gl.getUniformLocation(this.program, 'u_lineSpacing');
    
    this.attributeLocations.a_position = this.gl.getAttribLocation(this.program, 'a_position');
    this.attributeLocations.a_color = this.gl.getAttribLocation(this.program, 'a_color');
    this.attributeLocations.a_texCoord = this.gl.getAttribLocation(this.program, 'a_texCoord');

    // Setup fisheye shader uniforms and attributes
    this.fisheyeUniforms.u_texture = this.gl.getUniformLocation(this.fisheyeProgram, 'u_texture');
    this.fisheyeUniforms.u_resolution = this.gl.getUniformLocation(this.fisheyeProgram, 'u_resolution');
    this.fisheyeUniforms.u_time = this.gl.getUniformLocation(this.fisheyeProgram, 'u_time');
    this.fisheyeUniforms.u_strength = this.gl.getUniformLocation(this.fisheyeProgram, 'u_strength');
    
    this.fisheyeAttributeLocations.a_position = this.gl.getAttribLocation(this.fisheyeProgram, 'a_position');
    this.fisheyeAttributeLocations.a_texCoord = this.gl.getAttribLocation(this.fisheyeProgram, 'a_texCoord');
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

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.render();
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  render() {
    if (!this.isRunning) return;

    const currentTime = (Date.now() - this.startTime) / 1000.0;
    
    // Update rotations
    this.currentRotation.x += this.rotationX;
    this.currentRotation.y += this.rotationY;
    this.currentRotation.z += this.rotationZ;
    
    // Check if fisheye effect is needed
    const useFisheye = this.config.fisheyeStrength > 0;
    
    // Choose render target: framebuffer for fisheye, direct to screen for no fisheye
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, useFisheye ? this.framebuffer : null);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    
    this.gl.useProgram(this.program);
    
    // Clear the render target
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    // Enable depth testing for cube rendering
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    
    // Set up projection matrix
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = this.canvas.width / this.canvas.height;
    const projectionMatrix = this.createPerspectiveMatrix(fieldOfView, aspect, 0.1, 100.0);
    
    // Radial camera distance from center
    const distance = this.config.cameraDistance;
    
    // Use spherical coordinates for full 3D rotation around the cube
    const theta = this.currentRotation.x; // Polar angle (0 to π)
    const phi = this.currentRotation.y;   // Azimuthal angle (0 to 2π)

    // Camera position on spherical surface around origin
    const camX = distance * Math.sin(theta) * Math.cos(phi);
    const camY = distance * Math.cos(theta);
    const camZ = distance * Math.sin(theta) * Math.sin(phi);

    // Look-at matrix: camera looks from spherical position toward cube center (0,0,0)
    const modelViewMatrix = this.lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]);
    
    // Set uniforms
    this.gl.uniformMatrix4fv(this.uniforms.u_projectionMatrix, false, projectionMatrix);
    this.gl.uniformMatrix4fv(this.uniforms.u_modelViewMatrix, false, modelViewMatrix);
    this.gl.uniform1f(this.uniforms.u_lineWidth, this.config.lineWidth);
    this.gl.uniform1f(this.uniforms.u_lineSpacing, this.config.lineSpacing);
    
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

    // SECOND PASS: Apply fisheye effect (only if needed)
    if (useFisheye) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      
      this.gl.useProgram(this.fisheyeProgram);
      
      // Disable depth testing for full-screen quad
      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.disable(this.gl.CULL_FACE);
      
      // Clear the screen
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      
      // Bind the rendered texture
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.colorTexture);
      this.gl.uniform1i(this.fisheyeUniforms.u_texture, 0);
      
      // Set fisheye uniforms
      this.gl.uniform2f(this.fisheyeUniforms.u_resolution, this.canvas.width, this.canvas.height);
      this.gl.uniform1f(this.fisheyeUniforms.u_time, currentTime);
      this.gl.uniform1f(this.fisheyeUniforms.u_strength, this.config.fisheyeStrength);
      
      // Bind quad position buffer
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.quadPosition);
      this.gl.vertexAttribPointer(this.fisheyeAttributeLocations.a_position, 2, this.gl.FLOAT, false, 0, 0);
      this.gl.enableVertexAttribArray(this.fisheyeAttributeLocations.a_position);
      
      // Bind quad texture coordinate buffer
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.quadTexCoord);
      this.gl.vertexAttribPointer(this.fisheyeAttributeLocations.a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
      this.gl.enableVertexAttribArray(this.fisheyeAttributeLocations.a_texCoord);
      
      // Draw the full-screen quad
      this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
    }
    
    this.animationId = requestAnimationFrame(() => this.render());
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', () => this.resizeCanvas());
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
    if (this.fisheyeProgram) {
      this.gl.deleteProgram(this.fisheyeProgram);
    }
    if (this.framebuffer) {
      this.gl.deleteFramebuffer(this.framebuffer);
    }
    if (this.colorTexture) {
      this.gl.deleteTexture(this.colorTexture);
    }
    if (this.depthBuffer) {
      this.gl.deleteRenderbuffer(this.depthBuffer);
    }
  }
} 