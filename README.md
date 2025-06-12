# Max Headroom WebGL

A collection of WebGL-powered web components that recreate the iconic 80s cyberpunk Max Headroom aesthetic. Includes both background effects and real-time video overlays with AI-powered person segmentation.

## 🚀 Features

🎮 **WebGL-Powered**: Smooth 60fps animations using custom fragment shaders  
🎨 **Authentic 80s Aesthetic**: Neon colors, digital grids, and glitch effects  
📱 **Responsive**: Automatically adapts to any screen size  
🧩 **Web Components**: Easy integration into any web project  
⚡ **Vite-Packed**: Optimized build with modern tooling  
🎥 **Video Overlay**: Real-time video processing with TensorFlow.js  
🤖 **AI-Powered**: Person segmentation for realistic video overlays  

## 📦 Components

This package includes two web components:

### 1. `<max-headroom-bg>` - Background Component
Creates the classic Max Headroom animated background with geometric grids and digital effects.

### 2. `<max-headroom-video-overlay>` - Video Overlay Component (MediaPipe)
Applies Max Headroom effects to live camera feed with AI-powered person segmentation using MediaPipe SelfieSegmentation.

### 3. `<max-headroom-video-overlay-mediapipe>` - Video Overlay Component (MediaPipe)
Explicit MediaPipe version with the same functionality as the main component.

### 4. `<max-headroom-video-overlay-bodypix>` - Video Overlay Component (BodyPix)
Alternative version using BodyPix for broader compatibility with older systems.

## 🛠️ Development

### Prerequisites
- Node.js 16+
- pnpm (recommended) or npm

### Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

### Build Commands
```bash
# Build all formats
pnpm run build

# Build individual components
pnpm run build:umd-main      # Background component as UMD
pnpm run build:umd-overlay   # Video overlay component as UMD
```

## 🎮 Usage

### Background Component (`<max-headroom-bg>`)

#### Basic Usage
```html
<!-- Include the component -->
<script type="module" src="https://unpkg.com/webgl-max-headroom/dist/max-headroom.esm.js"></script>

<!-- Add to your HTML -->
<max-headroom-bg></max-headroom-bg>

<!-- Position as fullscreen background -->
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

#### With Custom Settings
```html
<max-headroom-bg 
  speed="0.5"
  fisheye-strength="0.2"
  camera-distance="0.3"
  line-width="0.15"
  line-spacing="60.0">
</max-headroom-bg>
```

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `speed` | number | `0.3` | Animation speed multiplier |
| `fisheye-strength` | number | `0.0` | Fisheye distortion effect strength |
| `camera-distance` | number | `0.5` | Camera distance from the grid |
| `line-width` | number | `0.2` | Width of the grid lines |
| `line-spacing` | number | `80.0` | Spacing between grid lines |

### MediaPipe Video Overlay Components (Recommended)

#### Main Component (`<max-headroom-video-overlay>`)
```html
<!-- Include the component -->
<script type="module" src="https://unpkg.com/webgl-max-headroom/dist/max-headroom-video-overlay.esm.js"></script>

<!-- Add to your HTML -->
<max-headroom-video-overlay glitch-frequency="3"></max-headroom-video-overlay>
```

#### Explicit MediaPipe Component (`<max-headroom-video-overlay-mediapipe>`)
```html
<!-- Include the component -->
<script type="module" src="https://unpkg.com/webgl-max-headroom/dist/max-headroom-video-overlay-mediapipe.esm.js"></script>

<!-- Add to your HTML -->
<max-headroom-video-overlay-mediapipe glitch-frequency="3"></max-headroom-video-overlay-mediapipe>
```

### BodyPix Video Overlay Component (`<max-headroom-video-overlay-bodypix>`)

#### Basic Usage
```html
<!-- Include the component -->
<script type="module" src="https://unpkg.com/webgl-max-headroom/dist/max-headroom-video-overlay-bodypix.esm.js"></script>

<!-- Add to your HTML -->
<max-headroom-video-overlay-bodypix glitch-frequency="3"></max-headroom-video-overlay-bodypix>
```

#### With Custom Settings (All Components)
```html
<max-headroom-video-overlay 
  glitch-frequency="5"
  width="1920"
  height="1080">
</max-headroom-video-overlay>
```

#### Attributes (Both Components)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `glitch-frequency` | number | `3` | Frequency of glitch effects |
| `width` | number | `window.innerWidth` | Canvas width |
| `height` | number | `window.innerHeight` | Canvas height |

#### Methods (Both Components)

| Method | Description |
|--------|-------------|
| `start()` | Start the video processing |
| `stop()` | Stop the video processing and camera |
| `setGlitchFrequency(number)` | Change the glitch frequency |
| `getCurrentStatus()` | Get current status message |

#### Events (Both Components)

| Event | Description |
|-------|-------------|
| `status-change` | Fired when processing status changes |

## 💾 CDN Usage

### UMD Builds (for direct inclusion)
```html
<!-- Background component -->
<script src="https://unpkg.com/webgl-max-headroom/dist/max-headroom-bg.umd.js"></script>

<!-- MediaPipe video overlay component (requires TensorFlow.js and MediaPipe) -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/body-segmentation"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation"></script>
<script src="https://unpkg.com/webgl-max-headroom/dist/max-headroom-video-overlay.umd.js"></script>
<!-- OR -->
<script src="https://unpkg.com/webgl-max-headroom/dist/max-headroom-video-overlay-mediapipe.umd.js"></script>

<!-- BodyPix video overlay component (requires TensorFlow.js and BodyPix) -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix"></script>
<script src="https://unpkg.com/webgl-max-headroom/dist/max-headroom-video-overlay-bodypix.umd.js"></script>
```

### ES Module Builds
```html
<script type="module">
  import 'https://unpkg.com/webgl-max-headroom/dist/max-headroom-bg.esm.js';
  
  // MediaPipe versions (recommended):
  import 'https://unpkg.com/webgl-max-headroom/dist/max-headroom-video-overlay.esm.js';
  // OR
  // import 'https://unpkg.com/webgl-max-headroom/dist/max-headroom-video-overlay-mediapipe.esm.js';
  
  // BodyPix version:
  // import 'https://unpkg.com/webgl-max-headroom/dist/max-headroom-video-overlay-bodypix.esm.js';
</script>
```

## 🎨 Visual Effects

### Background Component
- **Animated Grid Patterns**: Moving geometric grids
- **Neon Color Palette**: Authentic cyan, magenta, and green-cyan colors
- **Fisheye Distortion**: Optional camera lens distortion effect

### Video Overlay Components

#### MediaPipe Components (Recommended)
- **Real-time Person Segmentation**: AI-powered background removal using MediaPipe SelfieSegmentation
- **Better Performance**: Faster inference on most devices
- **Higher Accuracy**: Optimized for selfie/video call scenarios
- **Max Headroom Glitch Effects**: Digital artifacts and distortions

#### BodyPix Component
- **Broader Compatibility**: Works on older systems and browsers
- **Real-time Person Segmentation**: AI-powered background removal using BodyPix
- **Max Headroom Glitch Effects**: Digital artifacts and distortions

## 🗂️ Project Structure
```
src/
├── webcomponent.js                      # Background web component
├── video-overlay-webcomponent.js       # MediaPipe video overlay web component
├── video-overlay-webcomponent-bodypix.js # BodyPix video overlay web component
├── renderer.js                          # Background WebGL renderer
├── video-overlay-renderer.js           # MediaPipe video overlay renderer
├── video-overlay-renderer-bodypix.js   # BodyPix video overlay renderer
└── shaders/
    ├── vertex.glsl                     # Background vertex shader
    ├── fragment.glsl                   # Background fragment shader
    ├── fisheye-vertex.glsl             # Fisheye vertex shader
    └── fisheye-fragment.glsl           # Fisheye fragment shader
```

## 🌐 Browser Support

- Chrome 51+ (WebGL support required)
- Firefox 52+ (WebGL support required)
- Safari 10+ (WebGL support required)
- Edge 79+ (WebGL support required)

**Video Overlay Component Additional Requirements:**
- Camera access (`getUserMedia` API)
- WebAssembly support (for TensorFlow.js)

## 🤝 Dependencies

### Runtime Dependencies
- `@tensorflow/tfjs-core` - TensorFlow.js core for machine learning
- `@tensorflow/tfjs-backend-webgl` - WebGL backend for TensorFlow.js
- `@tensorflow-models/body-segmentation` - Body segmentation API
- `@mediapipe/selfie_segmentation` - MediaPipe SelfieSegmentation model

### Development Dependencies
- `vite` - Build tool and development server

## 📝 License

MIT License

## 🛠️ Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 