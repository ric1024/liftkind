import React, { useContext } from "react";
import { DarkModeContext } from "../context/DarkModeContext";

const NavBar = () => {
  const { darkMode, setDarkMode } = useContext(DarkModeContext);

  return (
    <nav className={`p-4 flex items-center border-b ${
      darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"
    }`}>
      <h1 className="text-xl font-bold">LiftKind</h1>

      <button
        onClick={() => setDarkMode(!darkMode)}
        className="ml-auto px-3 py-1 border rounded"
      >
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </nav>
  );
};

export default NavBar;