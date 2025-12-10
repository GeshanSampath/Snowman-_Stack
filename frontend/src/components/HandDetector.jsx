import React, { useEffect, useRef } from "react";
import { handTrackInit } from "../utils/handDetection";

export default function HandDetector({ onPointer }) {
  const videoRef = useRef(null);

  useEffect(() => {
    handTrackInit(videoRef.current, (pointer) => {
      if (onPointer) onPointer(pointer);
    });
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
