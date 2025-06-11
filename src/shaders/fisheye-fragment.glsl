precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_strength;

varying vec2 v_texCoord;

void main() {
  vec2 uv = v_texCoord;
  vec2 center = vec2(0.5, 0.5);
  
  // Distance from center
  vec2 delta = uv - center;
  float distance = length(delta);
  
  // Fisheye distortion with animated strength
  float animatedStrength = u_strength * (1.0 + 0.2 * sin(u_time * 2.0));
  float distortion = 1.0 + animatedStrength * distance * distance;
  
  // Apply distortion
  vec2 distortedUV = center + delta / distortion;
  
  // Add chromatic aberration for extra effect
  float aberration = animatedStrength * 0.01;
  vec2 redOffset = distortedUV + delta * aberration;
  vec2 greenOffset = distortedUV;
  vec2 blueOffset = distortedUV - delta * aberration;
  
  // Sample color channels with slight offset
  float r = texture2D(u_texture, redOffset).r;
  float g = texture2D(u_texture, greenOffset).g;
  float b = texture2D(u_texture, blueOffset).b;
  
  // Vignette effect
  float vignette = 1.0 - distance * 0.7;
  vignette = smoothstep(0.0, 1.0, vignette);
  
  gl_FragColor = vec4(r, g, b, 1.0) * vignette;
} 