import React from "react";
import Game from "../components/Game";

export default function GamePage() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="w-full h-screen">
      <h1 className="absolute top-2 left-2 text-white font-bold text-lg z-50">
        Hello, {user?.name}!
      </h1>
      <Game />
    </div>
  );
}
