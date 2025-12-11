import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Added loading state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Client-side Validation
    if (!name.trim() || !phone.trim()) {
      setError("Please enter both name and phone number.");
      return;
    }

    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      setError("Phone number must be 10-15 digits.");
      return;
    }

    setLoading(true);

    try {
      // 2. Send data to NestJS Backend
      const response = await fetch("http://localhost:3000/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone }),
      });

      if (!response.ok) {
        throw new Error("Server error: Unable to login.");
      }

      // 3. Get the real user data (including ID from MySQL)
      const userData = await response.json();

      // 4. Save to LocalStorage and Navigate
      localStorage.setItem("user", JSON.stringify(userData));
      navigate("/game");
      
    } catch (err) {
      console.error(err);
      setError("Connection failed. Is the backend server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-80 flex flex-col gap-4"
      >
        <h2 className="text-xl font-bold text-center">Login</h2>
        
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded w-full"
          disabled={loading}
        />
        
        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border p-2 rounded w-full"
          disabled={loading}
        />
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className={`text-white p-2 rounded transition ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Connecting..." : "Login"}
        </button>
      </form>
    </div>
  );
}