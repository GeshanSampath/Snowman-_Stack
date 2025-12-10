import React, { useEffect, useState, useRef } from "react"; 
import { useNavigate } from "react-router-dom";
import Snowfall from "../components/Snowfall";
import HandDetector from "../components/HandDetector";

export default function Game() {
  const navigate = useNavigate();

  const [objects, setObjects] = useState([]);
  const [stack, setStack] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameResult, setGameResult] = useState("");

  const pointerRef = useRef({ x: 0, y: 0, isPinching: false });
  const heldRef = useRef(null);

  const getBase = () => Math.min(window.innerWidth, window.innerHeight);

  // -----------------------------
  // INITIAL OBJECT SETUP
  // -----------------------------
  useEffect(() => {
    const BASE = getBase();
    const lineY = window.innerHeight - 150;
    const leftX = 150;
    const rightX = window.innerWidth - 150;

    const snowballs = [
      { id: 1, type: "snowball", size: "big", img: "/snowball.png", r: BASE * 0.12 },
      { id: 2, type: "snowball", size: "medium", img: "/snowball.png", r: BASE * 0.09 },
      { id: 3, type: "snowball", size: "small", img: "/snowball.png", r: BASE * 0.07 },
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
      items.push({ ...sb, x: leftX, y });
      y -= 150;
    });

    let ay = lineY;
    accessories.forEach((a) => {
      items.push({ ...a, x: rightX, y: ay });
      ay -= 150;
    });

    setObjects(items);
  }, []);

  // -----------------------------
  // TIMER
  // -----------------------------
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

  // -----------------------------
  // HAND POINTER HANDLER
  // -----------------------------
  const handlePointer = (hand) => {
    if (!hand) {
      pointerRef.current.isPinching = false;
      heldRef.current = null;
      return;
    }

    pointerRef.current.x = hand.x * window.innerWidth;
    pointerRef.current.y = hand.y * window.innerHeight;
    pointerRef.current.isPinching = hand.isPinching;

    if (hand.isPinching && !heldRef.current) {
      // pick nearest object
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
    } else if (!hand.isPinching) {
      heldRef.current = null;
    }
  };

  // -----------------------------
  // DRAG LOOP
  // -----------------------------
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

  // -----------------------------
  // RELEASE OBJECT (DROP)
  // -----------------------------
  useEffect(() => {
    const checkDrop = () => {
      if (!heldRef.current) return;
      const heldObj = objects.find((o) => o.id === heldRef.current);
      if (!heldObj) return;

      const centerX = window.innerWidth / 2;

      // stack snowballs
      if (heldObj.type === "snowball") {
        if (Math.abs(heldObj.x - centerX) < 200) {
          const newY = window.innerHeight - 160 - stack.length * 150;
          setStack((prev) => [...prev, { ...heldObj, x: centerX, y: newY }]);
          setObjects((prev) => prev.filter((o) => o.id !== heldRef.current));
          heldRef.current = null;
        }
      }

      // attach accessories to top snowball
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

  const onRestart = () => navigate("/login");

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="w-full h-screen relative overflow-hidden"
      style={{ backgroundImage: "url('/bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <Snowfall />

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-4xl font-bold z-50">
        ⏱ {timeLeft}s
      </div>

      {gameFinished && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="text-center text-white">
            <div className="text-5xl font-bold mb-6">
              {gameResult === "win" ? "🎉 You Win!" : "⏳ Time's Up!"}
            </div>
            <button onClick={onRestart} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-lg font-semibold">
              Restart
            </button>
          </div>
        </div>
      )}

      {/* Snowman Stack */}
      {stack.map((ball, i) => (
        <div key={i} className="absolute" style={{ left: ball.x - ball.r, top: ball.y - ball.r, width: ball.r * 2, height: ball.r * 2 }}>
          <img src="/snowball.png" style={{ width: "100%", height: "100%" }} />
          {ball.eyes && <img src="/eyes.png" style={{ position: "absolute", left: ball.eyes.x - ball.x, top: ball.eyes.y - ball.y, width: ball.r }} />}
          {ball.carrot && <img src="/carrot.png" style={{ position: "absolute", left: ball.carrot.x - ball.x, top: ball.carrot.y - ball.y, width: ball.r * 0.6, transform: "rotate(90deg)" }} />}
          {ball.mouth && <img src="/mouth.png" style={{ position: "absolute", left: ball.mouth.x - ball.x, top: ball.mouth.y - ball.y, width: ball.r * 0.7 }} />}
          {ball.hat && <img src="/hat.png" style={{ position: "absolute", left: ball.hat.x - ball.x - ball.r, top: ball.hat.y - ball.y - ball.r * 1.8, width: ball.r * 2 }} />}
          {ball["hand-left"] && <img src="/hand-left.png" style={{ position: "absolute", left: ball["hand-left"].x - ball.x - ball.r, top: ball["hand-left"].y - ball.y, width: ball.r * 1.5 }} />}
          {ball["hand-right"] && <img src="/hand-right.png" style={{ position: "absolute", left: ball["hand-right"].x - ball.x, top: ball["hand-right"].y - ball.y, width: ball.r * 1.5 }} />}
        </div>
      ))}

      {/* Draggable Objects */}
      {objects.map((o) => (
        <img key={o.id} src={o.img} style={{ position: "absolute", left: o.x - o.r, top: o.y - o.r, width: o.r * 2, height: o.r * 2, pointerEvents: "none" }} />
      ))}

      {/* Hand Detector */}
      <HandDetector onPointer={handlePointer} />
    </div>
  );
}
