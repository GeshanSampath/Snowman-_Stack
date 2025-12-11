import React, { useEffect, useRef } from "react";
import { handTrackInit } from "../utils/handTracking"; // Adjust path if needed

export default function HandDetector({ onPointer }) {
  const videoRef = useRef(null);
  // Store the latest callback in a ref so the camera loop always accesses the newest version
  const onPointerRef = useRef(onPointer);

  // Update the ref whenever the parent passes a new function
  useEffect(() => {
    onPointerRef.current = onPointer;
  }, [onPointer]);

  useEffect(() => {
    // Initialize hand tracking
    const stopCamera = handTrackInit(videoRef.current, (pointer) => {
      // Always call the current version of the function
      if (onPointerRef.current) {
        onPointerRef.current(pointer);
      }
    });

    return stopCamera; // stop camera on unmount
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