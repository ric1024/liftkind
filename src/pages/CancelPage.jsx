// src/pages/CancelPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./CancelPage.css"; // New CSS file for spacing overrides

const CancelPage = () => (
  <div className="cancel-container">
    <h1 className="cancel-title">
      Donation Cancelled
    </h1>

    <p className="cancel-message">
      No worries! You didn’t complete your donation this time. You can always come back later to support this cause and make a difference.
    </p>

    <Link
      to="/explore"
      className="cancel-back-button"
    >
      Back to Explore
    </Link>
  </div>
);

export default CancelPage;