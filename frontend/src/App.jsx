import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Game from "./components/Game"; 

export default function App() {
  return (
    <Router>
      <Routes>
    
        <Route path="/" element={<Game />} />
        
   
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}