import React from "react";
import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="px-3 py-1 rounded bg-orange-200 text-orange-800 hover:bg-orange-300 transition"
      aria-label="Go back"
    >
      ← Back
    </button>
  );
}