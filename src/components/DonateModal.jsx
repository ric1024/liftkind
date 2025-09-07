// src/components/DonateModal.jsx
import React, { useState } from "react";
import "./DonateModal.css";

export default function DonateModal({ request, onClose }) {
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return alert("Please enter a valid donation amount");
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/donations/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request._id,
          amount: parseFloat(amount),
          donorName: donorName || "Anonymous",
          donorEmail: donorEmail || "anonymous@example.com",
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe checkout
      } else {
        alert("Failed to create donation session.");
      }
    } catch (err) {
      console.error("Donation failed:", err);
      alert("Failed to create donation session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Donate to {request.name || "this request"}</h2>
        <p><strong>Category:</strong> {request.category}</p>
        <p><strong>Description:</strong> {request.description}</p>

        <input
          type="text"
          placeholder="Your Name (optional)"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Your Email (optional)"
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount ($)"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button
          className="confirm-button"
          onClick={handleDonate}
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : `Donate $${amount || "0.00"} as ${donorName || "Anonymous"} 💛`}
        </button>

        <button className="close-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}