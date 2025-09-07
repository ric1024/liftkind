import React from "react";

const DonateButton = ({ requestId, donorName, onClose }) => {
  const handleDonate = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, donorName: donorName || "Anonymous" }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session.");
      }
    } catch (err) {
      console.error("Donation failed:", err);
    } finally {
      if (onClose) onClose();
    }
  };

  return (
    <button
      onClick={handleDonate}
      className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
    >
      Proceed to Donate 💛
    </button>
  );
};

export default DonateButton;