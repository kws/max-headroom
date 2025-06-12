import { VideoOverlayRendererMediaPipe } from './video-overlay-renderer-mediapipe.js';
import { MaxHeadroomVideoOverlayBase } from './video-overlay-webcomponent-common.js';

class MaxHeadroomVideoOverlayMediaPipe extends MaxHeadroomVideoOverlayBase {
  getRendererClass() {
    return VideoOverlayRendererMediaPipe;
  }

  getLoadingMessage() {
    return 'Loading MediaPipe SelfieSegmentation model...';
  }
}

// Register the custom element
customElements.define('max-headroom-video-overlay-mediapipe', MaxHeadroomVideoOverlayMediaPipe);

export { MaxHeadroomVideoOverlayMediaPipe }; 