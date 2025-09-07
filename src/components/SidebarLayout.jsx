import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import "./SidebarLayout.css";

export default function SidebarLayout() {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <div className={`layout ${darkMode ? "dark" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <h2>LiftKind</h2>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="dark-toggle"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/explore"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Explore
          </NavLink>

          <NavLink
            to="/submit"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Submit a Need
          </NavLink>

          {/* Removed Admin Login and Donation History */}

          <NavLink
            to="/my-activity"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            My Activity
          </NavLink>

          <NavLink
            to="/donate"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Donate
          </NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}