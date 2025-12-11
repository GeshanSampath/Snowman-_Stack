import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export function handTrackInit(videoElement, onPointer) {
  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,          // Faster, lower delay
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    smoothLandmarks: false,      // Remove lag completely
  });

  hands.onResults((results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      onPointer(null);
      return;
    }

    const lm = results.multiHandLandmarks[0];

    // Finger tips
    const indexTip = lm[8];
    const thumbTip = lm[4];

    // MIRROR FIX (right -> right)
    const mirroredX = 1 - indexTip.x;

    // Improved pinch detection
    const dx = indexTip.x - thumbTip.x;
    const dy = indexTip.y - thumbTip.y;
    const pinchDistance = Math.hypot(dx, dy);

    // Slightly increased threshold = more responsive grab
    const isPinching = pinchDistance < 0.06;

    // Send cleaned pointer data
    onPointer({
      x: mirroredX,   // FIXED LEFT/RIGHT
      y: indexTip.y,
      isPinching,
    });
  });

  // Camera initialization
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      // NO pipeline lag
      await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });

  camera.start();
}
