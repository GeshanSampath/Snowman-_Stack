import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let handLandmarker;
let runningMode = "VIDEO";

// Initialize hand detection model
export const initializeHandDetection = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    },
    runningMode,
    numHands: 2,
  });
};

// Detect hands for a video element
export const detectHands = (videoElement) => {
  if (!handLandmarker || !videoElement || videoElement.readyState < 2) return null;

  try {
    const results = handLandmarker.detectForVideo(videoElement, performance.now());
    if (!results?.landmarks?.length) return null;
    return results;
  } catch (err) {
    console.error("Hand detection error:", err);
    return null;
  }
};

// Get the largest/nearest hand
export const getNearestHand = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return null;

  let nearestHand = null;
  let maxSize = 0;

  landmarks.forEach((hand) => {
    const wrist = hand[0];
    const indexTip = hand[8];
    const middleTip = hand[12];
    const size = (p1, p2) =>
      Math.sqrt(
        (p1.x - p2.x) ** 2 +
        (p1.y - p2.y) ** 2 +
        (p1.z - p2.z) ** 2
      );
    const handSize = (size(wrist, indexTip) + size(wrist, middleTip)) / 2;

    if (handSize > maxSize) {
      maxSize = handSize;
      nearestHand = hand;
    }
  });

  return nearestHand;
};

// Pinch detection (index tip + thumb tip)
export const isPinching = (hand) => {
  if (!hand || hand.length < 21) return false;
  const indexTip = hand[8];
  const thumbTip = hand[4];

  const distance = Math.sqrt(
    (indexTip.x - thumbTip.x) ** 2 +
    (indexTip.y - thumbTip.y) ** 2 +
    (indexTip.z - thumbTip.z) ** 2
  );

  return distance < 0.05; // adjust for sensitivity
};
