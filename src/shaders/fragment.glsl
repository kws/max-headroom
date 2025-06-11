precision mediump float;
uniform float u_lineWidth;
uniform float u_lineSpacing;

varying vec4 v_color;
varying vec2 v_texCoord;

void main() {
  vec2 uv = v_texCoord;
  
  // Create line patterns based on face color
  float pattern = 0.0;
  float threshold = 1.0 - u_lineWidth;
  
  // Different line patterns for different faces
  if (v_color.r > 0.9 && v_color.g < 0.1 && v_color.b < 0.1) {
    // Red face - horizontal lines
    pattern = step(threshold, mod(uv.y * u_lineSpacing, 1.0));
  } else if (v_color.r < 0.1 && v_color.g > 0.9 && v_color.b < 0.1) {
    // Green face - vertical lines  
    pattern = step(threshold, mod(uv.x * u_lineSpacing, 1.0));
  } else if (v_color.r < 0.1 && v_color.g < 0.1 && v_color.b > 0.9) {
    // Blue face - horizontal lines with slightly different spacing
    pattern = step(threshold, mod(uv.y * (u_lineSpacing * 0.9), 1.0));
  } else if (v_color.r > 0.9 && v_color.g > 0.9 && v_color.b < 0.1) {
    // Yellow face - vertical lines with slightly different spacing
    pattern = step(threshold, mod(uv.x * (u_lineSpacing * 0.9), 1.0));
  } else if (v_color.r > 0.9 && v_color.g < 0.1 && v_color.b > 0.9) {
    // Magenta face - diagonal lines
    pattern = step(threshold, mod((uv.x + uv.y) * (u_lineSpacing * 0.75), 1.0));
  } else {
    // Cyan face - horizontal lines with slightly different spacing
    pattern = step(threshold, mod(uv.y * (u_lineSpacing * 1.1), 1.0));
  }
  
  // Add some glow effect
  float glow = pattern * 0.8 + 0.2;
  
  gl_FragColor = vec4(v_color.rgb * glow, 1.0);
} 