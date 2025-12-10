import React, { useEffect, useRef } from "react";
import { initializeHandDetection, detectHands, getNearestHand, isPinching } from "../utils/handDetection";

export default function HandDetector({ onPointer }) {
  const videoRef = useRef(null);
  let intervalId = useRef(null);

  useEffect(() => {
    const setup = async () => {
      await initializeHandDetection();

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      intervalId.current = setInterval(() => {
        if (!videoRef.current) return;
        const results = detectHands(videoRef.current);
        if (!results) {
          onPointer(null);
          return;
        }

        const hand = getNearestHand(results.landmarks);
        if (!hand) {
          onPointer(null);
          return;
        }

        onPointer({
          x: hand[8].x, // index finger tip
          y: hand[8].y,
          isPinching: isPinching(hand),
          isNormalized: true,
        });
      }, 16); // ~60fps
    };

    setup();

    return () => {
      if (intervalId.current) clearInterval(intervalId.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return <video ref={videoRef} style={{ display: "none" }} autoPlay muted playsInline />;
}
