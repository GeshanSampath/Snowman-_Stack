import React, { useEffect, useRef, useState } from "react";
import Snowfall from "../components/Snowfall";
import HandDetector from "../components/HandDetector";

export default function Game() {
  // --- GAME STATES ---
  const [hasStarted, setHasStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  
  // --- USER DATA STATE ---
  const [userDetails, setUserDetails] = useState({ name: "", phone: "" });
  const [userId, setUserId] = useState(null);
  const [loginError, setLoginError] = useState("");

  // --- GAMEPLAY STATES ---
  const [objects, setObjects] = useState([]);
  const [stack, setStack] = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [cursor, setCursor] = useState({ x: 0, y: 0, isPinching: false });
  
  // --- END GAME MODAL STATE ---
  const [modalStats, setModalStats] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle, success, error

  // --- REFS ---
  const pointerRef = useRef({ x: 0, y: 0, isPinching: false });
  const heldRef = useRef(null);
  const objectsRef = useRef([]);
  const stackRef = useRef([]); 

  // --- SCORING CONSTANTS ---
  const MARKS_PER_PART = 10; 
  const BASE = Math.min(window.innerWidth, window.innerHeight);
  const centerX = window.innerWidth / 2;
  const baseY = window.innerHeight - (BASE * 0.2); 

  // --- SNOWMAN STRUCTURE ---
  const snowmanStructure = [
    { type: "snowball-base", x: centerX, y: baseY, r: BASE * 0.13, z: 1 },
    { type: "hand-left", x: centerX - (BASE * 0.13), y: baseY - (BASE * 0.16), r: BASE * 0.08, z: 1 },
    { type: "hand-right", x: centerX + (BASE * 0.13), y: baseY - (BASE * 0.16), r: BASE * 0.08, z: 1 },
    { type: "snowball-middle", x: centerX, y: baseY - (BASE * 0.16), r: BASE * 0.10, z: 2 },
    { type: "scarf", x: centerX - (BASE * 0.02), y: baseY - (BASE * 0.18), r: BASE * 0.09, z: 5 },
    { type: "snowball-head", x: centerX, y: baseY - (BASE * 0.29), r: BASE * 0.075, z: 4 },
    { type: "mouth", x: centerX, y: baseY - (BASE * 0.26), r: BASE * 0.05, z: 6 },
    { type: "eyes", x: centerX, y: baseY - (BASE * 0.31), r: BASE * 0.06, z: 6 },
    { type: "carrot", x: centerX + (BASE * 0.01), y: baseY - (BASE * 0.28), r: BASE * 0.05, z: 6 },
    { type: "hat", x: centerX, y: baseY - (BASE * 0.38), r: BASE * 0.09, z: 6 },
  ];

  // --- INITIALIZATION ---
  useEffect(() => {
    const snowballs = [
      { id: 1, type: "snowball-base", img: "/snowball.png", r: BASE * 0.13 },
      { id: 2, type: "snowball-middle", img: "/snowball.png", r: BASE * 0.10 },
      { id: 3, type: "snowball-head", img: "/snowball.png", r: BASE * 0.075 },
    ];
    
    const accessories = [
      { id: 100, type: "carrot", img: "/carrot.png", r: BASE * 0.05 },
      { id: 101, type: "eyes", img: "/eyes.png", r: BASE * 0.06 },
      { id: 102, type: "mouth", img: "/mouth.png", r: BASE * 0.05 },
      { id: 103, type: "hat", img: "/hat.png", r: BASE * 0.09 },
      { id: 104, type: "hand-left", img: "/hand-left.png", r: BASE * 0.08 },
      { id: 105, type: "hand-right", img: "/hand-right.png", r: BASE * 0.08 },
      { id: 106, type: "scarf", img: "/scarf.png", r: BASE * 0.09 },
    ];

    let items = [];
    const leftX = 120;
    const spacingLeft = (window.innerHeight - 100) / snowballs.length;
    snowballs.forEach((sb, index) => {
      items.push({ ...sb, x: leftX, y: 100 + (index * spacingLeft), locked: false });
    });

    const rightX = window.innerWidth - 120;
    const spacingRight = (window.innerHeight - 100) / accessories.length;
    accessories.forEach((acc, index) => {
      items.push({ ...acc, x: rightX, y: 80 + (index * spacingRight), locked: false });
    });

    setObjects(items);
    objectsRef.current = items;
  }, []);

  useEffect(() => { objectsRef.current = objects; }, [objects]);
  useEffect(() => { stackRef.current = stack; }, [stack]);

  // --- WIN CONDITION ---
  useEffect(() => {
    if (stack.length === 0) return;
    const allPlaced = snowmanStructure.every((target) => 
      stack.find((s) => s.type === target.type)
    );
    if (allPlaced && !gameFinished) {
      handleGameOver(true);
    }
  }, [stack]);

  // --- TIMER ---
  useEffect(() => {
    if (!hasStarted || gameFinished) return; 

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleGameOver(false); 
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, gameFinished]);

  // --- AUTOMATIC REDIRECT LOGIC ---
  useEffect(() => {
    let timeout;
    
    // 1. If Game Finished AND Lost -> Reload after 3s
    if (gameFinished && modalStats && !modalStats.isWin) {
      timeout = setTimeout(() => {
        window.location.reload();
      }, 3000);
    }

    // 2. If Submitted Successfully -> Reload after 3s
    if (submitStatus === "success") {
      timeout = setTimeout(() => {
        window.location.reload();
      }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [gameFinished, modalStats, submitStatus]);


  // --- POINTER LOGIC ---
  const handlePointer = (pointer) => {
    if (!hasStarted || gameFinished) return; 

    if (!pointer) {
      pointerRef.current.isPinching = false;
      heldRef.current = null;
      return;
    }

    const prevPinch = pointerRef.current.isPinching;
    pointerRef.current = pointer;

    // Pick
    if (pointer.isPinching && !prevPinch && !heldRef.current) {
      let nearest = null;
      let minD = Infinity;
      for (const o of objectsRef.current) {
        if (o.locked) continue;
        const d = Math.hypot(pointer.x - o.x, pointer.y - o.y);
        if (d < o.r + 60 && d < minD) {
          minD = d;
          nearest = o;
        }
      }
      if (nearest) heldRef.current = nearest.id;
    }

    // Release
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

    if (dist < 150) {
      setStack((prev) => [...prev, { ...heldObj, x: target.x, y: target.y, locked: true }]);
      setObjects((prev) => prev.filter((o) => o.id !== id));
    }
  };

  // --- STEP 1: LOGIN (CREATE USER) ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!userDetails.name || !userDetails.phone) return;

    try {
      const response = await fetch("http://localhost:3000/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: userDetails.name,
            phone: userDetails.phone
        })
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      setUserId(data.id); 
      setHasStarted(true); 

    } catch (err) {
      console.error(err);
      setLoginError("Could not start game. Check connection.");
    }
  };

  // --- GAME OVER HANDLER ---
  const handleGameOver = (isWin) => {
    if (gameFinished) return;
    setGameFinished(true);

    const partsCount = stackRef.current.length;
    const totalParts = snowmanStructure.length;
    const finalScore = partsCount * MARKS_PER_PART; 
    
    setModalStats({
      title: isWin ? "🎉 You built the snowman!" : "⏰ Time's up!",
      score: finalScore,
      parts: `${partsCount} / ${totalParts}`,
      isWin: isWin,
      timeTaken: 120 - timeLeft
    });
  };

  // --- STEP 2: FINISH (UPDATE SCORE) ---
  const submitScore = async () => {
    if (!userId || !modalStats) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`http://localhost:3000/user/${userId}/finish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: modalStats.score,
          timeTaken: modalStats.timeTaken
        })
      });

      if (response.ok) {
        setSubmitStatus("success");
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-screen relative overflow-hidden" style={{ backgroundImage: "url('/bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <Snowfall />

      {/* --- HUD (CENTERED) --- */}
      {hasStarted && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-8 z-50 pointer-events-none">
          
          {/* Time */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl shadow-xl flex flex-col items-center">
             <span className="text-white text-xs font-bold uppercase tracking-widest opacity-80">Time</span>
             <span className={`text-4xl font-black ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>
                {timeLeft}s
             </span>
          </div>

          {/* Score */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl shadow-xl flex flex-col items-center">
             <span className="text-white text-xs font-bold uppercase tracking-widest opacity-80">Score</span>
             <span className="text-4xl font-black text-yellow-400">
                {stack.length * MARKS_PER_PART}
             </span>
          </div>

        </div>
      )}

      {/* --- GAME OBJECTS --- */}
      {snowmanStructure.map((part, i) => (
        <div key={i} className="absolute border-2 border-white border-dashed rounded-full opacity-30" 
             style={{ left: part.x - part.r, top: part.y - part.r, width: part.r * 2, height: part.r * 2, zIndex: 0 }} 
        />
      ))}

      {stack.map((o, i) => {
        const struct = snowmanStructure.find(s => s.type === o.type);
        return (
          <img key={i} src={o.img} alt={o.type}
            style={{ position: "absolute", left: o.x - o.r, top: o.y - o.r, width: o.r * 2, height: o.r * 2, pointerEvents: "none", zIndex: struct ? struct.z : 1 }} 
          />
        );
      })}

      {objects.map((o) => (
        <img key={o.id} src={o.img} alt={o.type} className="transition-transform duration-100"
             style={{ position: "absolute", left: o.x - o.r, top: o.y - o.r, width: o.r * 2, height: o.r * 2, pointerEvents: "none", zIndex: 99, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }} />
      ))}

      {/* Hand Cursor */}
      <img src={cursor.isPinching ? "/hand-close.png" : "/hand-open.png"} alt="cursor" 
           style={{ position: "absolute", left: cursor.x - 25, top: cursor.y - 25, width: 50, height: 50, zIndex: 9999, pointerEvents: "none", transition: "transform 0.1s" }} draggable="false" />

      {/* --- MODAL 1: LOGIN (Start of Game) --- */}
      {!hasStarted && (
        <div className="absolute inset-0 bg-black/80 z-10000 flex items-center justify-center backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-8 shadow-2xl w-96 border-4 border-blue-400">
             <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">Snowman Builder</h1>
             <p className="text-gray-500 text-center mb-6">Enter your details to start playing!</p>
             
             <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
               <div>
                 <label className="text-xs font-bold text-gray-700 uppercase">Name</label>
                 <input type="text" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={userDetails.name} onChange={e => setUserDetails({...userDetails, name: e.target.value})} placeholder="Your Name" />
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-700 uppercase">Phone</label>
                 <input type="tel" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={userDetails.phone} onChange={e => setUserDetails({...userDetails, phone: e.target.value})} placeholder="07X XXX XXXX" />
               </div>
               
               {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}

               <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition transform hover:scale-105 shadow-lg mt-2">
                 Start Game 🎮
               </button>
             </form>
           </div>
        </div>
      )}

      {/* --- MODAL 2: GAME OVER (End of Game) --- */}
      {gameFinished && modalStats && (
        <div className="absolute inset-0 bg-black/70 z-10000 flex items-center justify-center backdrop-blur-md">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center border-4 border-blue-300 max-w-md w-full animate-bounce-in">
            
            <h2 className="text-3xl font-bold mb-2 text-gray-800">{modalStats.title}</h2>
            
            {modalStats.isWin ? (
              <div className="bg-blue-50 rounded-xl p-4 my-6 border border-blue-100">
                <p className="text-gray-500 text-sm uppercase font-bold tracking-wider">Final Score</p>
                <p className="text-6xl font-extrabold text-blue-600 my-2">{modalStats.score}</p>
                <div className="flex justify-between px-8 text-sm text-gray-600 mt-2">
                  <span>Player: <strong>{userDetails.name}</strong></span>
                  <span>Time: <strong>{modalStats.timeTaken}s</strong></span>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 rounded-xl p-4 my-6 border border-red-100">
                <p className="text-gray-600 mb-2">You didn't finish in time!</p>
                <p className="text-red-500 font-bold text-xl">Don't give up!</p>
                <p className="text-sm text-gray-500 mt-4">Restarting in 3s...</p>
              </div>
            )}

            {modalStats.isWin ? (
              <>
                {submitStatus === "success" ? (
                  <div>
                    <div className="text-green-500 text-5xl mb-2">✓</div>
                    <h3 className="text-xl font-bold text-gray-800">Score Saved!</h3>
                    <p className="text-sm text-gray-500 mt-2">Restarting in 3s...</p>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={submitScore} 
                      disabled={isSubmitting}
                      className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition transform active:scale-95 ${isSubmitting ? 'bg-gray-400' : 'bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'}`}
                    >
                      {isSubmitting ? "Saving..." : "Submit Score 🏆"}
                    </button>
                    {submitStatus === "error" && <p className="text-red-500 text-sm mt-2">Failed. Please try again.</p>}
                  </>
                )}
              </>
            ) : (
              // If lost, show loading/waiting message instead of manual button
              <div className="w-full py-4 text-gray-400 font-bold">
                Resetting Game...
              </div>
            )}

          </div>
        </div>
      )}

      <HandDetector onPointer={handlePointer} />
    </div>
  );
}