// src/pages/StripeDonation.jsx
import React, { useState, useEffect, useContext } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useSearchParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./DonationSuccess.css";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const inFlightSessions = new Set();

export default function StripeDonation({ requestId, amount, donorName, donorEmail, onCancel, onRequestUpdate }) {
  const [requesterReady, setRequesterReady] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showButton, setShowButton] = useState(false);

  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

  const sessionId = searchParams.get("session_id");
  const showCheckoutButton = requesterReady && !sessionId;

  // ---------- Check requester Stripe connection ----------
  useEffect(() => {
    const fetchRequestData = async () => {
      if (!requestId) return;

      try {
        const res = await fetch(`${API_BASE}/requests/${requestId}`);
        if (!res.ok) throw new Error("Failed to fetch request details");
        const data = await res.json();

        if (data.stripeAccountId) {
          setRequesterReady(true);
        } else {
          setRequesterReady(false);
          setError("The requester has not connected their Stripe account yet.");

          const connectRes = await fetch(`${API_BASE}/stripe/connect-account`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId }),
          });
          const connectData = await connectRes.json();
          if (connectData.url) setOnboardingUrl(connectData.url);
        }
      } catch (err) {
        console.error("💥 Error fetching request data:", err);
        setError(err.message || "Failed to fetch request info");
      }
    };

    fetchRequestData();
  }, [requestId, API_BASE]);

  // ---------- Handle Stripe Checkout ----------
  const handleCheckout = async () => {
    if (!requesterReady) {
      setError("Cannot proceed. The requester must connect Stripe first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/donations/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          amount,
          donorName: donorName?.trim() || user?.name || "Anonymous",
          donorEmail: donorEmail?.trim() || user?.email || "anonymous@example.com",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create Stripe session");

      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Show donation success with polling ----------
  useEffect(() => {
    if (!sessionId || inFlightSessions.has(sessionId)) return;
    inFlightSessions.add(sessionId);

    const pollDonation = async () => {
      try {
        const sessionRes = await fetch(`${API_BASE}/donations/checkout-session/${sessionId}`);
        if (!sessionRes.ok) throw new Error("Failed to fetch donation session details");
        const session = await sessionRes.json();

        const requestRes = await fetch(`${API_BASE}/requests/${session.requestId}`);
        if (!requestRes.ok) throw new Error("Failed to fetch request data");
        const requestData = await requestRes.json();

        // Check if donation has been recorded in Request.donations
        const donationRecorded = requestData.donations?.some(d => d.sessionId === sessionId);

        if (donationRecorded) {
          const donorNameFinal = user?.name || session.donorName || "Anonymous";
          const amountFinal = session.amount || 0;
          const requestTitle = requestData.title || "Untitled Request";

          setMessage(`Thank you! Your donation of $${amountFinal.toFixed(2)} by ${donorNameFinal} to "${requestTitle}" has been recorded.`);
          setShowButton(true);
          localStorage.setItem(`donation_confirmed_${sessionId}`, "true");

          if (onRequestUpdate) onRequestUpdate(session.requestId);

          if (!window[`donation_dispatched_${sessionId}`]) {
            window.dispatchEvent(
              new CustomEvent("donation-success", {
                detail: { requestId: session.requestId, donorName: donorNameFinal, donorEmail: session.donorEmail, amount: amountFinal, sessionId },
              })
            );
            window[`donation_dispatched_${sessionId}`] = true;
          }

          inFlightSessions.delete(sessionId);
        } else {
          // Retry after 1s
          setTimeout(pollDonation, 1000);
        }
      } catch (err) {
        console.error("💥 Donation polling error:", err);
        setError(err.message || "Something went wrong.");
        setShowButton(true);
        inFlightSessions.delete(sessionId);
      }
    };

    pollDonation();
  }, [sessionId, user, API_BASE, onRequestUpdate]);

  return (
    <div className="stripe-donation-container p-4 border rounded text-center flex flex-col items-center justify-center min-h-[50vh]">
      {loading && <h1 className="donation-loading">Processing...</h1>}
      {!loading && message && <h1 className="donation-success-message mb-4">{message}</h1>}
      {!loading && error && <h1 className="donation-error-message mb-4">{error}</h1>}

      {!loading && !requesterReady && onboardingUrl && (
        <a
          href={onboardingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="donation-connect-button mb-4"
        >
          Connect Stripe to complete donations
        </a>
      )}

      {showCheckoutButton && (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 mb-4"
        >
          {loading ? "Processing..." : "Proceed to Checkout"}
        </button>
      )}

      {onCancel && (
        <button
          onClick={onCancel}
          disabled={loading}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 mt-2 mb-4"
        >
          Cancel
        </button>
      )}

      {!loading && showButton && (
        <Link
          to="/explore"
          className="donation-back-button mt-12 inline-block text-green-600 underline"
        >
          Back to Explore
        </Link>
      )}
    </div>
  );
}