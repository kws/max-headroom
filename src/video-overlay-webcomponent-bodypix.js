import { VideoOverlayRendererBodyPix } from './video-overlay-renderer-bodypix.js';
import { MaxHeadroomVideoOverlayBase } from './video-overlay-webcomponent-common.js';

class MaxHeadroomVideoOverlayBodyPix extends MaxHeadroomVideoOverlayBase {
  getRendererClass() {
    return VideoOverlayRendererBodyPix;
  }

  getLoadingMessage() {
    return 'Loading BodyPix model...';
  }
}

// Register the custom element
customElements.define('max-headroom-video-overlay-bodypix', MaxHeadroomVideoOverlayBodyPix);

export { MaxHeadroomVideoOverlayBodyPix }; 