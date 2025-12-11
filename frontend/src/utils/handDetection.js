import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export function handTrackInit(videoElement, onPointer) {
  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    smoothLandmarks: true,
  });

  hands.onResults((results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      onPointer(null);
      return;
    }

    const lm = results.multiHandLandmarks[0];
    const indexTip = lm[8];
    const thumbTip = lm[4];

    // Mirror X and map to screen coordinates
    const x = (1 - indexTip.x) * window.innerWidth;
    const y = indexTip.y * window.innerHeight;

    const dx = indexTip.x - thumbTip.x;
    const dy = indexTip.y - thumbTip.y;
    const pinchDistance = Math.hypot(dx, dy);
    const isPinching = pinchDistance < 0.12; // easier grab

    onPointer({ x, y, isPinching });
  });

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });

  camera.start();

  return () => camera.stop();
}
