import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function StripeCheckout({
  requestId,
  amount,       // what requester receives
  totalCharge,  // what donor pays
  donorName,
  donorEmail,
  onCancel,
}) {
  const [loading, setLoading] = useState(false);
  const [requesterReady, setRequesterReady] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const checkStripeAccount = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/requests/${requestId}`);
        if (!res.ok) throw new Error("Failed to fetch request details");
        const requestData = await res.json();

        if (requestData.stripeAccountId) {
          setRequesterReady(true);
        } else {
          setRequesterReady(false);
          setError("The requester has not connected their Stripe account yet.");
        }
      } catch (err) {
        console.error("💥 Error checking requester Stripe account:", err);
        setError(err.message || "Failed to check requester account.");
      }
    };

    checkStripeAccount();
  }, [requestId]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/donations/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          amount,
          donorName: donorName?.trim() || "Anonymous",
          donorEmail: donorEmail?.trim() || "anonymous@example.com",
        }),
      });

      const data = await res.json();

      // If backend returns onboarding URL
      if (!res.ok && data.onboardingUrl) {
        setOnboardingUrl(data.onboardingUrl);
        setError("The requester needs to connect their Stripe account before donations can proceed.");
        return;
      }

      if (!res.ok) throw new Error(data.error || "Failed to create Stripe session");

      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stripe-checkout p-4 border rounded">
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <p>
        You are donating <strong>${amount.toFixed(2)}</strong> to the requester.
      </p>
      <p className="text-sm text-gray-600 mt-1">
        To support our platform, your total charge will be <strong>${totalCharge.toFixed(2)}</strong>.
        <br />
        The requester will receive <strong>${amount.toFixed(2)}</strong> — exactly what you intended.
      </p>
      <p className="mt-1">Donor: <strong>{donorName || "Anonymous"}</strong></p>

      <div className="mt-2 flex gap-2">
        {!requesterReady && onboardingUrl ? (
          <a
            href={onboardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Connect Stripe
          </a>
        ) : (
          <button
            onClick={handleCheckout}
            disabled={loading || !requesterReady}
            className={`px-4 py-2 rounded text-white ${requesterReady ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
          >
            {loading ? "Processing..." : "Proceed to Checkout"}
          </button>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}