import React, { useEffect, useRef } from "react";
import { handTrackInit } from "../utils/handTracking";

export default function HandDetector({ onPointer }) {
  const videoRef = useRef(null);
  const onPointerRef = useRef(onPointer);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onPointerRef.current = onPointer;
  }, [onPointer]);

  useEffect(() => {
    const stopCamera = handTrackInit(videoRef.current, (pointer) => {
      // Call the latest function from the ref
      if (onPointerRef.current) {
        onPointerRef.current(pointer);
      }
    });

    return stopCamera;
  }, []);

  return (
    <video
      ref={videoRef}
      style={{ display: "none" }}
      autoPlay
      muted
      playsInline
    />
  );
}