import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export function handTrackInit(videoElement, onPointer) {
  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,          // fastest
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    smoothLandmarks: false,      // remove extra smoothing delay
  });

  hands.onResults((results) => {
    if (
      !results.multiHandLandmarks ||
      results.multiHandLandmarks.length === 0
    ) {
      onPointer(null);
      return;
    }

    const lm = results.multiHandLandmarks[0];

    // **MIRROR** x axis so hand moves correctly right/left
    const pointerX = 1 - lm[8].x;
    const pointerY = lm[8].y;

    // -------------------------------
    //  REAL HAND CLOSE (FIST) DETECTION
    // -------------------------------
    // finger tip IDs     => [thumb, index, middle, ring, pinky]
    const tipIds = [4, 8, 12, 16, 20];

    let closedCount = 0;
    for (let id of tipIds) {
      const tip = lm[id];
      const pip = lm[id - 2]; // joint below fingertip

      // If fingertip goes BELOW knuckle → finger folded
      if (tip.y > pip.y) {
        closedCount++;
      }
    }

    const handClosed = closedCount >= 3; // 3+ fingers folded = "hand is closed"

    // Output to game
    onPointer({
      x: pointerX,
      y: pointerY,
      handClosed,   // TRUE = grab, FALSE = drop
    });
  });

  // CAMERA
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });

  camera.start();
}
