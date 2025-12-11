import React, { useEffect, useRef, useState } from "react";
import Snowfall from "../components/Snowfall";
import HandDetector from "../components/HandDetector";

export default function Game() {
  const [objects, setObjects] = useState([]);
  const [stack, setStack] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [gameFinished, setGameFinished] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, isPinching: false });
  const [modalMessage, setModalMessage] = useState("");

  const pointerRef = useRef({ x: 0, y: 0, isPinching: false });
  const heldRef = useRef(null);
  const stackRef = useRef([]);
  stackRef.current = stack;

  const BASE = Math.min(window.innerWidth, window.innerHeight);
  const centerX = window.innerWidth / 2;
  const baseY = window.innerHeight - 150;

  const snowmanStructure = [
    { type: "snowball-base", x: centerX, y: baseY, r: BASE * 0.12 },
    { type: "snowball-middle", x: centerX, y: baseY - 150, r: BASE * 0.09 },
    { type: "snowball-head", x: centerX, y: baseY - 270, r: BASE * 0.07 },
    { type: "eyes", x: centerX, y: baseY - 270, r: BASE * 0.06 },
    { type: "mouth", x: centerX, y: baseY - 250, r: BASE * 0.05 },
    { type: "carrot", x: centerX, y: baseY - 240, r: BASE * 0.045 },
    { type: "hat", x: centerX, y: baseY - 320, r: BASE * 0.08 },
    { type: "hand-left", x: centerX - 90, y: baseY - 200, r: BASE * 0.07 },
    { type: "hand-right", x: centerX + 90, y: baseY - 200, r: BASE * 0.07 },
  ];

  useEffect(() => {
    const lineY = window.innerHeight - 150;

    const snowballs = [
      { id: 1, type: "snowball-base", img: "/snowball.png", r: BASE * 0.12 },
      { id: 2, type: "snowball-middle", img: "/snowball.png", r: BASE * 0.09 },
      { id: 3, type: "snowball-head", img: "/snowball.png", r: BASE * 0.07 },
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

  // Timer
  useEffect(() => {
    if (gameFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          endGame("⏰ Time's up! You lost!");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameFinished]);

  // Handle pointer
  const handlePointer = (pointer) => {
    if (!pointer) {
      pointerRef.current.isPinching = false;
      heldRef.current = null;
      return;
    }

    pointerRef.current = pointer;

    // Pick object
    if (pointer.isPinching && !heldRef.current) {
      let nearest = null;
      let minD = Infinity;
      for (const o of objects) {
        const d = Math.hypot(pointer.x - o.x, pointer.y - o.y);
        if (d < o.r + 50 && d < minD) {
          minD = d;
          nearest = o;
        }
      }
      if (nearest) heldRef.current = nearest.id;
    }

    // Release object
    if (!pointer.isPinching && heldRef.current) {
      tryDrop(heldRef.current);
      heldRef.current = null;
    }
  };

  // Mouse support
  useEffect(() => {
    const onMouseMove = (e) => {
      handlePointer({ x: e.clientX, y: e.clientY, isPinching: e.buttons === 1 });
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseMove);
    window.addEventListener("mouseup", () => {
      pointerRef.current.isPinching = false;
      heldRef.current = null;
    });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseMove);
      window.removeEventListener("mouseup", () => {});
    };
  }, [objects]);

  // Smooth drag loop
  useEffect(() => {
    let animationId;
    const loop = () => {
      setCursor({ ...pointerRef.current });

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

  // Drop logic
  const tryDrop = (id) => {
    const heldObj = objects.find((o) => o.id === id);
    if (!heldObj) return;

    const target = snowmanStructure.find((s) => s.type === heldObj.type);
    if (!target) return;

    const dx = heldObj.x - target.x;
    const dy = heldObj.y - target.y;

    if (Math.hypot(dx, dy) < 50) {
      setStack((prev) => [...prev, { ...heldObj, x: target.x, y: target.y }]);
      setObjects((prev) => prev.filter((o) => o.id !== id));

      if (checkWin()) endGame("🎉 You built the snowman! You win!");
    }
  };

  const checkWin = () => {
    for (const target of snowmanStructure) {
      if (!stackRef.current.find((s) => s.type === target.type)) return false;
    }
    return true;
  };

  const endGame = (message) => {
    setGameFinished(true);
    setModalMessage(message);
  };

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

      {/* Snowman outline */}
      {snowmanStructure.map((part, i) => (
        <div
          key={i}
          className="absolute border-2 border-white rounded-full"
          style={{
            left: part.x - part.r,
            top: part.y - part.r,
            width: part.r * 2,
            height: part.r * 2,
            opacity: 0.3,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Placed objects */}
      {stack.map((o, i) => (
        <img
          key={i}
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

      {/* Draggable objects */}
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

      {/* Hand cursor */}
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

      {/* In-game modal */}
      {modalMessage && (
        <div
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 bg-white rounded-xl p-6 shadow-xl z-50 w-80 text-center"
          style={{ pointerEvents: "auto" }}
        >
          <h2 className="text-xl font-bold mb-4">{modalMessage}</h2>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-600 transition"
          >
            Restart Game
          </button>
        </div>
      )}

      {/* Hand tracking */}
      <HandDetector onPointer={handlePointer} />
    </div>
  );
}
