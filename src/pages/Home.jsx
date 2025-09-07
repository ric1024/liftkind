// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import postIcon from "../assets/icons/post.svg";
import displayIcon from "../assets/icons/display.svg";
import heartIcon from "../assets/icons/heart.svg";

import "./Home.css";

export default function Home() {
  const { user, initialLoading } = useAuth();

  // Show a loader while checking if user is logged in
  if (initialLoading) {
    return (
      <div className="home-wrapper flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <div className="home-wrapper">
      <div className="hero-section">
        <h1 className="hero-title">Where Kindness Lifts Lives</h1>
        <p className="tagline">
          Join a movement of care, dignity, and community-led giving.
        </p>

        {user ? (
          <div className="hero-buttons">
            <Link to="/explore">
              <button className="cta-button">Explore Requests</button>
            </Link>
            <Link to="/submit">
              <button className="cta-button">Submit a Need</button>
            </Link>
          </div>
        ) : (
          <div className="hero-buttons">
            <Link to="/login">
              <button className="cta-button">Login</button>
            </Link>
            <Link to="/register">
              <button className="cta-button">Register</button>
            </Link>
          </div>
        )}
      </div>

      <div className="impact-section">
        <h2 className="section-title">How LiftKind Works</h2>
        <div className="impact-grid">
          <div className="impact-card">
            <img src={postIcon} alt="Submit Icon" />
            <h3>1. Share a Need</h3>
            <p>Post a request. No judgment. Just truth.</p>
          </div>
          <div className="impact-card">
            <img src={displayIcon} alt="Display Icon" />
            <h3>2. On Display</h3>
            <p>Your need is shared publicly for the community to see.</p>
          </div>
          <div className="impact-card">
            <img src={heartIcon} alt="Heart Icon" />
            <h3>3. Kindness Lifts</h3>
            <p>Donors give directly, creating real impact. You’ll see the results.</p>
          </div>
        </div>
      </div>
    </div>
  );
}