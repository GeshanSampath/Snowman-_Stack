import React, { useEffect, useRef, useState } from "react";
import Snowfall from "../components/Snowfall";
import HandDetector from "../components/HandDetector";

export default function Game() {
  const [objects, setObjects] = useState([]);
  const [stack, setStack] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [gameFinished, setGameFinished] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, isPinching: false });

  const pointerRef = useRef({ x: 0, y: 0, isPinching: false });
  const heldRef = useRef(null);
  const stackRef = useRef([]);
  stackRef.current = stack;

  const BASE = Math.min(window.innerWidth, window.innerHeight);

  // --- Initialize objects ---
  useEffect(() => {
    const lineY = window.innerHeight - 150;

    const snowballs = [
      { id: 1, type: "snowball", img: "/snowball.png", r: BASE * 0.12 },
      { id: 2, type: "snowball", img: "/snowball.png", r: BASE * 0.09 },
      { id: 3, type: "snowball", img: "/snowball.png", r: BASE * 0.07 },
    ];

    const accessories = [
      { id: 100, type: "carrot", img: "/carrot.png", r: BASE * 0.045 },
      { id: 101, type: "eyes", img: "/eyes.png", r: BASE * 0.06 },
      { id: 102, type: "mouth", img: "/mouth.png", r: BASE * 0.05 },
      { id: 103, type: "hat", img: "/hat.png", r: BASE * 0.08 },
      { id: 104, type: "hand-left", img: "/hand-left.png", r: BASE * 0.07 },
      { id: 105, type: "hand-right", img: "/hand-right.png", r: BASE * 0.07 },
    ];

    let items = [];
    let y = lineY;
    snowballs.forEach((sb) => {
      items.push({ ...sb, x: 150, y });
      y -= 150;
    });

    let ay = lineY;
    accessories.forEach((a) => {
      items.push({ ...a, x: window.innerWidth - 150, y: ay });
      ay -= 150;
    });

    setObjects(items);
  }, []);

  // --- Timer ---
  useEffect(() => {
    if (gameFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setGameFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameFinished]);

  // --- Handle Hand Pointer ---
  const handlePointer = (hand) => {
    if (!hand) {
      pointerRef.current.isPinching = false;
      heldRef.current = null;
      return;
    }

    pointerRef.current.x = hand.x * window.innerWidth;
    pointerRef.current.y = hand.y * window.innerHeight;
    pointerRef.current.isPinching = hand.isPinching;

    // Pick object
    if (hand.isPinching && !heldRef.current) {
      let nearest = null;
      let minD = Infinity;
      for (const o of objects) {
        const d = Math.hypot(pointerRef.current.x - o.x, pointerRef.current.y - o.y);
        if (d < o.r + 50 && d < minD) {
          minD = d;
          nearest = o;
        }
      }
      if (nearest) heldRef.current = nearest.id;
    }

    // Release object if not pinching
    if (!hand.isPinching && heldRef.current) {
      tryDrop(heldRef.current);
      heldRef.current = null;
    }
  };

  // --- Smooth Drag Loop ---
  useEffect(() => {
    let animationId;

    const loop = () => {
      // Update cursor state every frame
      setCursor({
        x: pointerRef.current.x,
        y: pointerRef.current.y,
        isPinching: pointerRef.current.isPinching,
      });

      // Drag held object
      if (heldRef.current) {
        setObjects((prev) =>
          prev.map((o) =>
            o.id === heldRef.current
              ? { ...o, x: pointerRef.current.x, y: pointerRef.current.y }
              : o
          )
        );
      }

      animationId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationId);
  }, []);

  // --- Drop Logic ---
  const tryDrop = (id) => {
    const heldObj = objects.find((o) => o.id === id);
    if (!heldObj) return;

    const centerX = window.innerWidth / 2;

    // Snap snowball to stack
    if (heldObj.type === "snowball") {
      const newY = window.innerHeight - 160 - stackRef.current.length * 150;
      if (Math.abs(heldObj.x - centerX) < 200) {
        setStack((prev) => [...prev, { ...heldObj, x: centerX, y: newY }]);
        setObjects((prev) => prev.filter((o) => o.id !== id));
        return;
      }
    }

    // Attach accessories to top snowball
    const topBall = stackRef.current[stackRef.current.length - 1];
    if (topBall && heldObj.type !== "snowball") {
      setStack((prev) =>
        prev.map((b, idx) => {
          if (idx !== prev.length - 1) return b;
          return { ...b, [heldObj.type]: { x: heldObj.x, y: heldObj.y } };
        })
      );
      setObjects((prev) => prev.filter((o) => o.id !== id));
    }
  };

  // --- Render ---
  return (
    <div
      className="w-full h-screen relative overflow-hidden"
      style={{
        backgroundImage: "url('/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Snowfall />

      {/* Timer */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-4xl font-bold z-50">
        ⏱ {timeLeft}s
      </div>

      {/* Snowman Stack */}
      {stack.map((ball, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: ball.x - ball.r,
            top: ball.y - ball.r,
            width: ball.r * 2,
            height: ball.r * 2,
          }}
        >
          <img src="/snowball.png" style={{ width: "100%", height: "100%" }} />
          {/* Accessories */}
          {ball.carrot && (
            <img
              src="/carrot.png"
              style={{
                position: "absolute",
                left: ball.carrot.x - ball.r,
                top: ball.carrot.y - ball.r,
                width: BASE * 0.09,
                height: BASE * 0.09,
              }}
            />
          )}
          {ball.eyes && (
            <img
              src="/eyes.png"
              style={{
                position: "absolute",
                left: ball.eyes.x - ball.r,
                top: ball.eyes.y - ball.r,
                width: BASE * 0.12,
                height: BASE * 0.12,
              }}
            />
          )}
          {ball.mouth && (
            <img
              src="/mouth.png"
              style={{
                position: "absolute",
                left: ball.mouth.x - ball.r,
                top: ball.mouth.y - ball.r,
                width: BASE * 0.1,
                height: BASE * 0.1,
              }}
            />
          )}
          {ball.hat && (
            <img
              src="/hat.png"
              style={{
                position: "absolute",
                left: ball.hat.x - ball.r,
                top: ball.hat.y - ball.r,
                width: BASE * 0.14,
                height: BASE * 0.14,
              }}
            />
          )}
        </div>
      ))}

      {/* Draggable Objects */}
      {objects.map((o) => (
        <img
          key={o.id}
          src={o.img}
          style={{
            position: "absolute",
            left: o.x - o.r,
            top: o.y - o.r,
            width: o.r * 2,
            height: o.r * 2,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Hand Cursor */}
      <img
        src={cursor.isPinching ? "/hand-close.png" : "/hand-open.png"}
        style={{
          position: "absolute",
          left: cursor.x - 25,
          top: cursor.y - 25,
          width: 50,
          height: 50,
          zIndex: 9999,
          pointerEvents: "none",
        }}
        draggable="false"
      />

      {/* Hand Tracking */}
      <HandDetector onPointer={handlePointer} />
    </div>
  );
}
