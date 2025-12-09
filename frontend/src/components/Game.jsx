import React, { useEffect, useState, useRef } from "react";
import Snowfall from "../components/Snowfall";
import HandDetector from "../components/HandDetector";

function worldToScreen(nx, ny) {
  return { x: nx * window.innerWidth, y: ny * window.innerHeight };
}

export default function Game() {
  const [objects, setObjects] = useState([]);
  const [stack, setStack] = useState([]);
  const pointerRef = useRef(null);
  const heldRef = useRef(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const lineY = window.innerHeight - 150;
    const leftX = 150; // left zone
    const rightX = window.innerWidth - 150; // right zone

    const items = [];

    // --- SNOWBALLS (LEFT SIDE) ---
    const snowballs = [
      { id: 1, type: "snowball-big", img: "/snowball.png", r: 70 },
      { id: 2, type: "snowball-medium", img: "/snowball.png", r: 55 },
      { id: 3, type: "snowball-small", img: "/snowball.png", r: 45 },
    ];

    let yPos = lineY;

    snowballs.forEach((sb) => {
      items.push({
        id: sb.id,
        type: "snowball",
        size: sb.type,
        x: leftX,
        y: yPos,
        r: sb.r,
        img: sb.img,
      });
      yPos -= 150;
    });

    // --- ACCESSORIES (RIGHT SIDE) ---
    const accessories = [
      { id: 100, type: "carrot", img: "/carrot.png", r: 25 },
      { id: 101, type: "eyes", img: "/eyes.png", r: 30 },
      { id: 102, type: "mouth", img: "/mouth.png", r: 25 },
      { id: 103, type: "hat", img: "/hat.png", r: 45 },
      { id: 104, type: "hand-left", img: "/hand-left.png", r: 40 },
      { id: 105, type: "hand-right", img: "/hand-right.png", r: 40 },
    ];

    let accY = lineY;

    accessories.forEach((a) => {
      items.push({
        id: a.id,
        type: a.type,
        x: rightX,
        y: accY,
        r: a.r,
        img: a.img,
      });
      accY -= 150;
    });

    setObjects(items);
  }, []);

  // Drag follow loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (pointerRef.current && heldRef.current !== null) {
        setObjects((prev) =>
          prev.map((o) =>
            o.id === heldRef.current
              ? { ...o, x: pointerRef.current.x, y: pointerRef.current.y }
              : o
          )
        );
      }
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const onPointer = (p) => {
    if (!p) {
      pointerRef.current = null;
      heldRef.current = null;
      return;
    }

    const sc = p.isNormalized
      ? worldToScreen(p.x, p.y)
      : { x: p.x, y: p.y };

    pointerRef.current = { x: sc.x, y: sc.y, isPinching: p.isPinching };

    if (p.isPinching || draggingRef.current) {
      if (heldRef.current === null) {
        let nearest = null;
        let minD = Infinity;

        for (const o of objects) {
          const d = Math.hypot(o.x - sc.x, o.y - sc.y);
          if (d < 100 && d < minD) {
            minD = d;
            nearest = o;
          }
        }

        if (nearest) heldRef.current = nearest.id;
      }
    } else {
      if (heldRef.current !== null) releaseObject();
    }
  };

  const releaseObject = () => {
    const heldId = heldRef.current;
    const heldObj = objects.find((o) => o.id === heldId);
    if (!heldObj) return;

    const centerX = window.innerWidth / 2;

    // --- Stack snowballs ---
    if (heldObj.type === "snowball") {
      if (Math.abs(heldObj.x - centerX) < 150) {
        const newY =
          window.innerHeight - 160 -
          stack.length * 150 -
          (heldObj.r === 70 ? 50 : 0);

        setStack((prev) => [
          ...prev,
          { ...heldObj, x: centerX, y: newY },
        ]);

        setObjects((prev) => prev.filter((o) => o.id !== heldId));
        heldRef.current = null;
        return;
      }
    }

    // --- Attach accessories ---
    const topBall = stack[stack.length - 1];
    if (topBall) {
      const d = Math.hypot(heldObj.x - topBall.x, heldObj.y - topBall.y);
      if (d < topBall.r + 70) {
        setStack((prev) =>
          prev.map((ball, idx) =>
            idx === prev.length - 1
              ? { ...ball, [heldObj.type]: { x: heldObj.x, y: heldObj.y } }
              : ball
          )
        );

        setObjects((prev) => prev.filter((o) => o.id !== heldId));
      }
    }

    heldRef.current = null;
  };

  // Mouse Controls
  const handleMouseDown = (e) => {
    draggingRef.current = true;
    onPointer({ x: e.clientX, y: e.clientY, isPinching: true });
  };

  const handleMouseMove = (e) => {
    if (!draggingRef.current) return;
    onPointer({ x: e.clientX, y: e.clientY, isPinching: true });
  };

  const handleMouseUp = () => {
    draggingRef.current = false;
    onPointer(null);
  };

  return (
    <div
      className="w-full h-screen relative overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        backgroundImage: "url('/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        WebkitBackgroundSize: "cover",
      }}
    >
      <Snowfall />

      {/* Snowman stack */}
      {stack.map((ball, i) => (
        <div
          key={i}
          className="absolute z-50"
          style={{
            left: ball.x - ball.r,
            top: ball.y - ball.r,
            width: ball.r * 2,
            height: ball.r * 2,
          }}
        >
          <img src="/snowball.png" width={ball.r * 2} />

          {ball.eyes && (
            <img
              src="/eyes.png"
              style={{
                position: "absolute",
                left: ball.eyes.x - ball.x,
                top: ball.eyes.y - ball.y,
                width: 50,
              }}
            />
          )}

          {ball.carrot && (
            <img
              src="/carrot.png"
              style={{
                position: "absolute",
                left: ball.carrot.x - ball.x,
                top: ball.carrot.y - ball.y,
                width: 40,
                transform: "rotate(90deg)",
              }}
            />
          )}

          {ball.mouth && (
            <img
              src="/mouth.png"
              style={{
                position: "absolute",
                left: ball.mouth.x - ball.x,
                top: ball.mouth.y - ball.y,
                width: 45,
              }}
            />
          )}

          {ball.hat && (
            <img
              src="/hat.png"
              style={{
                position: "absolute",
                left: ball.hat.x - ball.x - 20,
                top: ball.hat.y - ball.y - 80,
                width: 90,
              }}
            />
          )}

          {ball["hand-left"] && (
            <img
              src="/hand-left.png"
              style={{
                position: "absolute",
                left: ball["hand-left"].x - ball.x - 100,
                top: ball["hand-left"].y - ball.y,
                width: 100,
              }}
            />
          )}

          {ball["hand-right"] && (
            <img
              src="/hand-right.png"
              style={{
                position: "absolute",
                left: ball["hand-right"].x - ball.x + 30,
                top: ball["hand-right"].y - ball.y,
                width: 100,
              }}
            />
          )}
        </div>
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
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      ))}

      <HandDetector onPointer={onPointer} />
    </div>
  );
}
