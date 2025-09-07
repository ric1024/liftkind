// src/pages/MyActivity.jsx
import React, { useState, useContext, useEffect } from "react";
import DonationHistory from "../components/DonationHistory";
import MyRequests from "../components/MyRequests";
import { RequestContext } from "../context/RequestContext";

export default function MyActivity() {
  const [activeTab, setActiveTab] = useState("donations");
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const { recentDonations } = useContext(RequestContext);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // Force re-render on donation-success
  useEffect(() => {
    const handleDonation = () => setRefreshTrigger(prev => !prev);
    window.addEventListener("donation-success", handleDonation);
    return () => window.removeEventListener("donation-success", handleDonation);
  }, []);

  // Button styles
  const buttonBaseStyle = {
    padding: "0.5rem 1.5rem",
    borderRadius: "8px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  const activeButtonStyle = {
    backgroundColor: "#ff5252",
    color: "white",
    boxShadow: "0 4px 12px rgba(255, 82, 82, 0.6)",
  };

  const inactiveButtonStyle = {
    backgroundColor: "#1e1e1e",
    color: "#ddd",
    boxShadow: "none",
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="text-2xl font-bold mb-6">My Activity</h1>

      {/* Tab Buttons */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setActiveTab("donations")}
          style={{ ...buttonBaseStyle, ...(activeTab === "donations" ? activeButtonStyle : inactiveButtonStyle) }}
        >
          Donations
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          style={{ ...buttonBaseStyle, ...(activeTab === "requests" ? activeButtonStyle : inactiveButtonStyle) }}
        >
          My Requests
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "donations" ? (
          <DonationHistory
            user={user}
            token={token}
            donations={recentDonations}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <MyRequests user={user} token={token} />
        )}
      </div>
    </div>
  );
}