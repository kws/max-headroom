# Max Headroom WebGL Background

A Vite-packed web component that recreates the iconic 80s cyberpunk Max Headroom background using WebGL shaders.

## Features

🎮 **WebGL-Powered**: Smooth 60fps animations using custom fragment shaders  
🎨 **Authentic 80s Aesthetic**: Neon colors, digital grids, and glitch effects  
🖱️ **Interactive**: Mouse movement creates ripple effects  
📱 **Responsive**: Automatically adapts to any screen size  
🧩 **Web Component**: Easy integration into any web project  
⚡ **Vite-Packed**: Optimized build with modern tooling  

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

## Usage

### Basic Integration
```html
<!-- Import the component -->
<script type="module" src="path/to/max-headroom.js"></script>

<!-- Add to your HTML -->
<max-headroom-bg></max-headroom-bg>

<!-- Position as background -->
<style>
  max-headroom-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
</style>
```

### Custom Styling
The component responds to CSS positioning and sizing like any other HTML element.

## Visual Effects

- **Animated Grid Patterns**: Moving geometric grids with digital distortion
- **Neon Color Palette**: Authentic cyan, magenta, and green-cyan colors
- **Scanlines**: Classic CRT monitor effects
- **Digital Noise**: Random artifacts and glitch effects
- **Mouse Interaction**: Ripple effects that follow cursor movement
- **Interference Patterns**: Animated wave distortions

## Browser Support

- Modern browsers with WebGL support
- Graceful fallback for unsupported browsers

## Technical Details

- Built with vanilla JavaScript and WebGL
- Uses custom GLSL fragment shaders for effects
- Implements proper cleanup and resize handling
- Shadow DOM encapsulation for style isolation

## License

MIT License 