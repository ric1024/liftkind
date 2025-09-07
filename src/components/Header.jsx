// src/components/Header.jsx
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header
      className="header-container"
      style={{
        padding: "0.75rem 1rem",
        borderBottom: "1px solid #444",
        marginBottom: "0.25rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "rgba(30, 30, 30, 0.9)",
        color: "#eee",
      }}
    >
      <Link
        to="/"
        style={{ fontWeight: "bold", fontSize: "1.5rem", color: "#ff8a80" }}
      >
        LiftKind
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {user ? (
          <>
            <span style={{ marginLeft: "1rem" }}>Welcome, {user.email}</span>
            <button
              onClick={handleLogout}
              style={{
                cursor: "pointer",
                marginLeft: "1rem",
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#e74c3c",
                color: "white",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button style={{ cursor: "pointer" }}>Login</button>
            </Link>
            <Link to="/register">
              <button style={{ cursor: "pointer" }}>Register</button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}