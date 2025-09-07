// src/components/StripeCheckout.jsx
import React, { useState, useMemo, useContext } from "react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const PLATFORM_FEE_PERCENT = 0.05; // 5%

export default function StripeCheckout({ requestId, amount, donorName, donorEmail, onCancel }) {
  const { token, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const totalCharge = useMemo(
    () => Math.round(amount / (1 - PLATFORM_FEE_PERCENT) * 100) / 100,
    [amount]
  );

  const handleCheckout = async () => {
    if (!requestId || !amount) return alert("Missing request or amount");
    if (!token) return alert("You must be logged in to donate.");

    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/donations/create-checkout-session`,
        {
          requestId,
          amount,
          donorName: donorName?.trim() || user?.name || "Anonymous",
          donorEmail: donorEmail?.trim() || user?.email || "anonymous@example.com",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { sessionId } = res.data;
      if (!sessionId) throw new Error("Failed to create Stripe session");

      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;

    } catch (err) {
      console.error("💥 Checkout error:", err);
      alert(err.response?.data?.error || err.message || "Something went wrong during checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stripe-checkout p-4 border rounded max-w-md mx-auto bg-white text-gray-900">
      <p className="mb-2">
        You are donating <strong>${totalCharge.toFixed(2)}</strong> as <strong>{donorName || "Anonymous"}</strong>
      </p>
      <p className="mb-4 text-sm text-gray-700">
        💛 Don’t worry! The amount you entered, <strong>${amount.toFixed(2)}</strong>, is exactly what the requester will receive.
        The extra <strong>${(totalCharge - amount).toFixed(2)}</strong> helps support our platform.
      </p>

      <div className="flex gap-2">
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Proceed to Checkout"}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}