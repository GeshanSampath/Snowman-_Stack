import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Snowfall from "../components/Snowfall";
import HandDetector from "../components/HandDetector";

export default function Game() {
  const navigate = useNavigate();

  const [objects, setObjects] = useState([]);
  const [stack, setStack] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameResult, setGameResult] = useState("");

  const pointerRef = useRef({ x: 0, y: 0, isPinching: false });
  const heldRef = useRef(null);

  const getBase = () => Math.min(window.innerWidth, window.innerHeight);

  useEffect(() => {
    const BASE = getBase();
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

  useEffect(() => {
    if (gameFinished) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameFinished(true);
          setGameResult("lose");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameFinished]);

  const handlePointer = (hand) => {
    if (!hand) {
      pointerRef.current.isPinching = false;
      heldRef.current = null;
      return;
    }

    pointerRef.current.x = hand.x * window.innerWidth;
    pointerRef.current.y = hand.y * window.innerHeight;
    pointerRef.current.isPinching = hand.isPinching;

    // pick object
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

    if (!hand.isPinching) {
      heldRef.current = null;
    }
  };

  useEffect(() => {
    const loop = setInterval(() => {
      if (!heldRef.current) return;

      setObjects((prev) =>
        prev.map((o) =>
          o.id === heldRef.current
            ? { ...o, x: pointerRef.current.x, y: pointerRef.current.y }
            : o
        )
      );
    }, 16);

    return () => clearInterval(loop);
  }, []);

  // dropping logic
  useEffect(() => {
    const checkDrop = () => {
      if (!heldRef.current) return;
      const heldObj = objects.find((o) => o.id === heldRef.current);
      if (!heldObj) return;

      const centerX = window.innerWidth / 2;

      if (heldObj.type === "snowball") {
        if (Math.abs(heldObj.x - centerX) < 200) {
          const newY = window.innerHeight - 160 - stack.length * 150;

          setStack((prev) => [...prev, { ...heldObj, x: centerX, y: newY }]);
          setObjects((prev) => prev.filter((o) => o.id !== heldRef.current));

          heldRef.current = null;
        }
      }

      const topBall = stack[stack.length - 1];

      if (topBall) {
        const d = Math.hypot(heldObj.x - topBall.x, heldObj.y - topBall.y);

        if (d < 120) {
          setStack((prev) =>
            prev.map((b, idx) =>
              idx === prev.length - 1
                ? { ...b, [heldObj.type]: { x: heldObj.x, y: heldObj.y } }
                : b
            )
          );

          setObjects((prev) => prev.filter((o) => o.id !== heldRef.current));
          heldRef.current = null;
        }
      }
    };

    const interval = setInterval(checkDrop, 100);
    return () => clearInterval(interval);
  }, [objects, stack]);

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

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-4xl font-bold z-50">
        ⏱ {timeLeft}s
      </div>

      {/* SNOWMAN STACK */}
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
        </div>
      ))}

      {/* DRAGGABLE OBJECTS */}
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

      {/* HAND CURSOR (ICON) */}
      <img
        src={pointerRef.current.isPinching ? "/hand-close.png" : "/hand-open.png"}
        style={{
          position: "absolute",
          left: pointerRef.current.x - 25,
          top: pointerRef.current.y - 25,
          width: 50,
          height: 50,
          zIndex: 9999,
          pointerEvents: "none",
        }}
        draggable="false"
      />

      <HandDetector onPointer={handlePointer} />
    </div>
  );
}
