import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export function handTrackInit(videoElement, onPointer) {
  if (!videoElement) return () => {};

  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  });

  hands.onResults((results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      // Optional: Pass null or keep last known position. Passing null hides cursor/resets pinch.
      onPointer(null);
      return;
    }

    const lm = results.multiHandLandmarks[0];
    const indexTip = lm[8]; // index fingertip
    const thumbTip = lm[4]; // thumb tip

    // Convert to screen coordinates (Mirror horizontal)
    const x = (1 - indexTip.x) * window.innerWidth;
    const y = indexTip.y * window.innerHeight;

    // Pinch detection
    const dx = indexTip.x - thumbTip.x;
    const dy = indexTip.y - thumbTip.y;
    const pinchDistance = Math.hypot(dx, dy);
    
    // 0.1 is usually a good "tight pinch" threshold, 0.12 is a bit looser
    const isPinching = pinchDistance < 0.1; 

    onPointer({ x, y, isPinching });
  });

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      if(videoElement) await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });

  camera.start();

  return () => {
    camera.stop();
    hands.close();
  };
}