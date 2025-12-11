import React, { useEffect, useRef, useState } from "react";
import Snowfall from "../components/Snowfall";
import HandDetector from "../components/HandDetector";

export default function Game() {
  const [objects, setObjects] = useState([]);
  const [stack, setStack] = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameFinished, setGameFinished] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, isPinching: false });
  const [modalMessage, setModalMessage] = useState("");

  const pointerRef = useRef({ x: 0, y: 0, isPinching: false });
  const heldRef = useRef(null);
  const objectsRef = useRef([]);

  const BASE = Math.min(window.innerWidth, window.innerHeight);
  const centerX = window.innerWidth / 2;
  const baseY = window.innerHeight - 150;

  // --- FINAL CREATIVE ALIGNMENT ---
  const snowmanStructure = [
    // 1. Bottom Layer (Base Body) - z:1
    { type: "snowball-base", x: centerX, y: baseY, r: BASE * 0.12, z: 1 },
    
    // 2. Middle Layer (Middle Body) - z:2
    { type: "snowball-middle", x: centerX, y: baseY - 140, r: BASE * 0.09, z: 2 },
    
    // HANDS: BIGGER & REALISTIC
    { type: "hand-left", x: centerX - (BASE * 0.13), y: baseY - 140, r: BASE * 0.10, z: 1 },
    { type: "hand-right", x: centerX + (BASE * 0.13), y: baseY - 140, r: BASE * 0.10, z: 1 },

    // 3. Top Layer (Head Body) - z:3
    { type: "snowball-head", x: centerX, y: baseY - 250, r: BASE * 0.07, z: 3 },
    
    // 4. Accessories Layer (Face on Head)
    { type: "hat", x: centerX, y: baseY - 320, r: BASE * 0.08, z: 4 },
    { type: "eyes", x: centerX, y: baseY - 280, r: BASE * 0.06, z: 4 },
    { type: "mouth", x: centerX, y: baseY - 220, r: BASE * 0.05, z: 4 },
    
    // CARROT: Bigger & Moved slightly RIGHT for creative alignment
    // (BASE * 0.02) pushes it slightly off-center to the right
    { type: "carrot", x: centerX + (BASE * 0.02), y: baseY - 250, r: BASE * 0.055, z: 5 }, 
  ];

  // Initialize objects
  useEffect(() => {
    const lineY = window.innerHeight - 150;
    const snowballs = [
      { id: 1, type: "snowball-base", img: "/snowball.png", r: BASE * 0.12 },
      { id: 2, type: "snowball-middle", img: "/snowball.png", r: BASE * 0.09 },
      { id: 3, type: "snowball-head", img: "/snowball.png", r: BASE * 0.07 },
    ];
    const accessories = [
      { id: 100, type: "carrot", img: "/carrot.png", r: BASE * 0.055 }, // Updated radius
      { id: 101, type: "eyes", img: "/eyes.png", r: BASE * 0.06 },
      { id: 102, type: "mouth", img: "/mouth.png", r: BASE * 0.05 },
      { id: 103, type: "hat", img: "/hat.png", r: BASE * 0.08 },
      { id: 104, type: "hand-left", img: "/hand-left.png", r: BASE * 0.10 },
      { id: 105, type: "hand-right", img: "/hand-right.png", r: BASE * 0.10 },
    ];

    let items = [];
    let y = lineY;
    snowballs.forEach((sb) => items.push({ ...sb, x: 150, y, locked: false }) && (y -= 150));
    let ay = lineY;
    accessories.forEach((a) => items.push({ ...a, x: window.innerWidth - 150, y: ay, locked: false }) && (ay -= 150));

    setObjects(items);
    objectsRef.current = items;
  }, []);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  // Win Condition
  useEffect(() => {
    if (stack.length === 0) return;
    const allPlaced = snowmanStructure.every((target) => 
      stack.find((s) => s.type === target.type)
    );
    if (allPlaced && !gameFinished) {
      endGame("🎉 You built the snowman! You win!");
    }
  }, [stack]);

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

  const handlePointer = (pointer) => {
    if (!pointer) {
      pointerRef.current.isPinching = false;
      heldRef.current = null;
      return;
    }

    const prevPinch = pointerRef.current.isPinching;
    pointerRef.current = pointer;

    // Pick nearest object
    if (pointer.isPinching && !prevPinch && !heldRef.current) {
      let nearest = null;
      let minD = Infinity;
      for (const o of objectsRef.current) {
        if (o.locked) continue;
        const d = Math.hypot(pointer.x - o.x, pointer.y - o.y);
        // Grab radius
        if (d < o.r + 50 && d < minD) {
          minD = d;
          nearest = o;
        }
      }
      if (nearest) heldRef.current = nearest.id;
    }

    // Release object
    if (!pointer.isPinching && prevPinch && heldRef.current) {
      tryDrop(heldRef.current);
      heldRef.current = null;
    }
  };

  // Animation Loop
  useEffect(() => {
    let animationId;
    const loop = () => {
      setCursor({ ...pointerRef.current });
      if (heldRef.current) {
        setObjects((prev) => {
          const next = prev.map((o) =>
            o.id === heldRef.current
              ? { ...o, x: pointerRef.current.x, y: pointerRef.current.y }
              : o
          );
          objectsRef.current = next;
          return next;
        });
      }
      animationId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, []);

  const tryDrop = (id) => {
    const heldObj = objectsRef.current.find((o) => o.id === id);
    if (!heldObj) return;

    const target = snowmanStructure.find((s) => s.type === heldObj.type);
    if (!target) return;

    const dx = target.x - heldObj.x;
    const dy = target.y - heldObj.y;
    const dist = Math.hypot(dx, dy);

    // Drop distance threshold
    if (dist < 150) {
      setStack((prev) => [...prev, { ...heldObj, x: target.x, y: target.y, locked: true }]);
      setObjects((prev) => prev.filter((o) => o.id !== id));
    }
  };

  const endGame = (message) => {
    setGameFinished(true);
    setModalMessage(message);
  };

  return (
    <div className="w-full h-screen relative overflow-hidden" style={{ backgroundImage: "url('/bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <Snowfall />

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-4xl font-bold z-50">
        ⏱ {timeLeft}s
      </div>

      {/* Guide Outlines */}
      {snowmanStructure.map((part, i) => (
        <div key={i} className="absolute border-2 border-white rounded-full" style={{ left: part.x - part.r, top: part.y - part.r, width: part.r * 2, height: part.r * 2, opacity: 0.2, pointerEvents: "none", zIndex: 0 }} />
      ))}

      {/* Stacked/Completed Objects (Using dynamic zIndex) */}
      {stack.map((o, i) => {
        const struct = snowmanStructure.find(s => s.type === o.type);
        return (
          <img 
            key={i} 
            src={o.img} 
            alt={o.type}
            style={{ 
              position: "absolute", 
              left: o.x - o.r, 
              top: o.y - o.r, 
              width: o.r * 2, 
              height: o.r * 2, 
              pointerEvents: "none",
              zIndex: struct ? struct.z : 1 
            }} 
          />
        );
      })}

      {/* Active Objects (Draggable) */}
      {objects.map((o) => (
        <img key={o.id} src={o.img} alt={o.type} style={{ position: "absolute", left: o.x - o.r, top: o.y - o.r, width: o.r * 2, height: o.r * 2, pointerEvents: "none", zIndex: 99 }} />
      ))}

      {/* Hand Cursor */}
      <img src={cursor.isPinching ? "/hand-close.png" : "/hand-open.png"} alt="cursor" style={{ position: "absolute", left: cursor.x - 25, top: cursor.y - 25, width: 50, height: 50, zIndex: 9999, pointerEvents: "none" }} draggable="false" />

      {/* In-game modal */}
      {modalMessage && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 bg-white rounded-xl p-6 shadow-xl z-50 w-80 text-center" style={{ pointerEvents: "auto" }}>
          <h2 className="text-xl font-bold mb-4">{modalMessage}</h2>
          <button onClick={() => window.location.reload()} className="bg-blue-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-600 transition">Restart Game</button>
        </div>
      )}

      <HandDetector onPointer={handlePointer} />
    </div>
  );
}