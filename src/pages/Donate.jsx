// src/pages/Donate.jsx
import React, { useState, useEffect, useContext } from "react";
import StripeCheckout from "../components/StripeCheckout";
import { useRequest } from "../context/RequestContext";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const PLATFORM_FEE_PERCENT = 0.05;

export default function Donate() {
  const { requests } = useRequest();
  const { token, user } = useContext(AuthContext);
  const [checkoutInfo, setCheckoutInfo] = useState(null);
  const [donationHistory, setDonationHistory] = useState([]);

  // Open Stripe Checkout
  const openCheckout = (request) => {
    if (!token) return alert("Please log in to donate.");

    const amount = Number(request.amount);
    if (!amount || amount <= 0) return alert("Invalid donation amount.");

    const requestOwnerId = request.userId || request.email;
    const donorId = user?.id || user?.email;
    if (requestOwnerId === donorId) return alert("You cannot donate to your own request.");

    const totalCharge = Math.round(amount / (1 - PLATFORM_FEE_PERCENT) * 100) / 100;

    setCheckoutInfo({
      requestId: request._id,
      amount,
      totalCharge,
      donorName: user?.name || "Anonymous", // ✅ ensure passed
      donorEmail: user?.email || "anonymous@example.com", // ✅ ensure passed
    });
  };

  const closeCheckout = () => setCheckoutInfo(null);

  // Fetch donation history
  const fetchDonationHistory = async (email) => {
    if (!email) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/donations/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonationHistory(res.data);
    } catch (err) {
      console.error("💥 Failed to fetch donation history:", err);
    }
  };

  useEffect(() => {
    if (user?.email && token) fetchDonationHistory(user.email);
  }, [user?.email, token]);

  return (
    <div className="donate-page max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Donate to Requests</h2>

      {!token && (
        <p className="mb-4 text-red-600 font-semibold">
          Please log in to donate.
        </p>
      )}

      {/* Request List */}
      <ul className="space-y-4 mb-8">
        {requests
          .filter((r) => r.status === "approved")
          .map((request) => {
            const totalCharge = Math.round(Number(request.amount) / (1 - PLATFORM_FEE_PERCENT) * 100) / 100;
            return (
              <li
                key={request._id}
                className="border p-4 rounded shadow-md flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-lg">{request.title}</p>
                  <p className="text-gray-700">
                    ${Number(request.amount).toFixed(2)} &nbsp;
                    <span className="text-sm text-gray-500">(you pay ~${totalCharge.toFixed(2)})</span>
                  </p>
                </div>
                <button
                  onClick={() => openCheckout(request)}
                  disabled={!token}
                  className={`px-4 py-2 rounded text-white ${
                    token ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {token ? "Donate" : "Login to Donate"}
                </button>
              </li>
            );
          })}
      </ul>

      {/* Stripe Checkout */}
      {checkoutInfo && token && (
        <StripeCheckout
          requestId={checkoutInfo.requestId}
          amount={checkoutInfo.amount}
          donorName={checkoutInfo.donorName}   // ✅ now passed
          donorEmail={checkoutInfo.donorEmail} // ✅ now passed
          totalCharge={checkoutInfo.totalCharge}
          onCancel={closeCheckout}
        />
      )}

      {/* Donation History */}
      {donationHistory.length > 0 && (
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-4">Your Past Donations</h3>
          <ul className="space-y-2">
            {donationHistory.map((d) => (
              <li key={`${d.requestId}-${d.donatedAt}`} className="border p-3 rounded">
                <p>
                  <strong>{d.requestTitle}</strong> — ${d.amount.toFixed(2)} <span className="text-gray-500">({d.donorName})</span>
                </p>
                <p className="text-gray-500 text-sm">
                  Donated on {new Date(d.donatedAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}