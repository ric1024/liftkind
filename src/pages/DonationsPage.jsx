// src/pages/DonationsPage.jsx
import React from "react";
import DonationHistory from "../components/DonationHistory";

export default function DonationsPage() {
  // Example: get donorId from localStorage
  const donorId = localStorage.getItem("donorId");

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Your Donations</h1>
      <DonationHistory donorId={donorId} />
    </div>
  );
}