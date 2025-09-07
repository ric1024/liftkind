// src/pages/RequestDetail.jsx
import React, { useEffect, useState, useContext, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import RequestInfoDashboard from "../components/RequestInfoDashboard";
import { AuthContext } from "../context/AuthContext";
import "../components/RequestInfoDashboard.css";
import "./RequestDetail.css";

const DONATIONS_PER_PAGE = 5;
const PLATFORM_FEE_PERCENT = 0.05;

const RequestDetail = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

  // ------------------------
  // Check if logged-in user is owner
  // ------------------------
  const isOwner = useMemo(() => {
    if (!user || !request) return false;
    const userId = user.id || user._id;
    return (
      String(userId) === String(request.userId) ||
      user.email?.toLowerCase() === request.email?.toLowerCase()
    );
  }, [user, request]);

  // ------------------------
  // Fetch request details
  // ------------------------
  const fetchRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/requests/${id}`);
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();

      if (!data.userId && data.email) data.userId = data.email;

      const amountRaised = (data.donations || []).reduce(
        (sum, d) => sum + Number(d.amount || 0),
        0
      );

      setRequest({ ...data, amountRaised });
    } catch (err) {
      console.error("💥 Error fetching request:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------
  // Stripe onboarding: manual only
  // ------------------------
  const handleConnectStripe = async () => {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/stripe-account-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Could not generate Stripe onboarding link.");
      }
    } catch (err) {
      console.error("💥 Stripe onboarding error:", err);
      setError("Failed to generate Stripe link. Try again.");
    }
  };

  // ------------------------
  // Initial load
  // ------------------------
  useEffect(() => {
    fetchRequest();
    setDonorName("");
    setDonorEmail("");
    setDonationAmount("");
    setError("");
    setSuccessMessage("");
    setIsProcessing(false);
  }, [id]);

  // ------------------------
  // Handle donation success from Stripe redirect
  // ------------------------
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get("success");
    const sessionId = params.get("session_id");

    if (success === "true" && sessionId) {
      const updateAfterDonation = async () => {
        try {
          const resSession = await fetch(
            `${API_BASE}/donations/checkout-session/${sessionId}`
          );
          if (!resSession.ok) throw new Error("Failed to fetch donation session info");
          const sessionData = await resSession.json();

          if (sessionData) {
            const donationEvent = new CustomEvent("donation-success", {
              detail: {
                requestId: sessionData.requestId,
                donorName: sessionData.donorName,
                donorEmail: sessionData.donorEmail,
                amount: sessionData.amount,
                sessionId,
              },
            });
            window.dispatchEvent(donationEvent);
          }

          await fetchRequest();
          setSuccessMessage("🎉 Thank you! Your donation was successful 💛");

          navigate(`/request/${id}`, { replace: true });
        } catch (err) {
          console.error("💥 Error updating request after donation:", err);
          setError("Failed to update donation. Please refresh.");
        }
      };

      updateAfterDonation();
    }
  }, [location.search, id, navigate]);

  // ------------------------
  // Handle Stripe Checkout
  // ------------------------
  const handleStartCheckout = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const donationNumber = Number(donationAmount);

    if (!donationNumber || donationNumber <= 0) {
      setError("Please enter a valid donation amount.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(donationAmount)) {
      setError("Donation must be a number with up to 2 decimal places.");
      return;
    }

    if (!token) {
      setError("You must be logged in to donate.");
      return;
    }

    if (!request.stripeAccountReady) {
      setError(
        "This requester has not connected Stripe yet. Donations are disabled until they do."
      );
      return;
    }

    const requestOwnerId = request.userId || request.email;
    const donorId = user.id || user._id || user.email;

    if (String(requestOwnerId) === String(donorId)) {
      setError("You cannot donate to your own request.");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE}/donations/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: id,
          amount: donationNumber,
          donorName: donorName || user?.name || "Anonymous",
          donorEmail: donorEmail || user?.email || "anonymous@example.com",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout session");

      const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (error) throw error;
    } catch (err) {
      console.error("💥 Checkout error:", err);
      setError(err.message || "Something went wrong during checkout.");
      setIsProcessing(false);
    }
  };

  // ------------------------
  // Derived values
  // ------------------------
  const donationsToShow = useMemo(() => {
    return (request?.donations || [])
      .slice()
      .sort((a, b) => new Date(b.donatedAt || 0) - new Date(a.donatedAt || 0))
      .slice(0, DONATIONS_PER_PAGE);
  }, [request?.donations]);

  const totalRaised = request?.amountRaised || 0;
  const donationNumber = Number(donationAmount) || 0;
  const platformFee = Math.round(donationNumber * PLATFORM_FEE_PERCENT * 100) / 100;
  const goalReached = totalRaised >= (request?.amount || 0);
  const stripeAccountReady = request?.stripeAccountReady; // ✅ use backend value

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  // ------------------------
  // Render
  // ------------------------
  return (
    <div className="max-w-4xl mx-auto p-10 bg-gray-800 rounded-lg shadow-lg space-y-10 text-white">
      {loading ? (
        <p className="text-center mt-8">Loading request...</p>
      ) : (
        request && (
          <>
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <h1 className="text-4xl md:text-5xl font-extrabold flex-1">{request.title}</h1>
            </header>

            <RequestInfoDashboard request={request} />

            <div className="w-full bg-gray-300 rounded-full h-8 overflow-hidden mb-4">
              <div
                className="bg-green-600 h-full transition-all duration-1000"
                style={{
                  width: `${Math.min((totalRaised / (request.amount || 1)) * 100, 100)}%`,
                }}
              />
            </div>

            <p
              className={`text-center font-bold ${
                goalReached ? "text-green-400" : "text-gray-300"
              }`}
            >
              {goalReached
                ? `🎉 Goal reached! The requester has received ${formatCurrency(
                    request.amount
                  )}. You can still donate to support them and our platform. 💛`
                : `${formatCurrency((request.amount || 0) - totalRaised)} remaining to reach the goal.`}
            </p>

            {/* Stripe onboarding banner for owners without a Stripe account */}
            {isOwner && !stripeAccountReady && (
              <div className="bg-yellow-600 text-black p-4 rounded mb-6 text-center space-y-2">
                <p className="font-bold">
                  You must connect a Stripe account before receiving donations.
                </p>
                <p className="text-sm">
                  Click the button below to create or complete your Stripe account setup. You don't need a real website or product, just enter a placeholder!
                </p>
                <button
                  onClick={handleConnectStripe}
                  className="underline mt-2 inline-block font-semibold"
                >
                  Connect Stripe now
                </button>
              </div>
            )}

            {/* Donation section */}
            <section className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto text-gray-900">
              {successMessage && (
                <p className="text-green-700 font-bold text-center mb-4">{successMessage}</p>
              )}

              {!user ? (
                <div className="text-center space-y-4">
                  <p className="text-gray-800 font-bold">
                    You need an account to donate. Create one or log in to continue.
                  </p>
                  <a
                    href="/signup"
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 inline-block"
                  >
                    Create Account / Log In
                  </a>
                </div>
              ) : isOwner ? (
                <p className="text-center text-gray-600 font-bold">
                  You cannot donate to your own request.
                </p>
              ) : !stripeAccountReady ? (
                <p className="text-center text-red-600 font-bold">
                  This requester has not connected Stripe yet. Donations are disabled until they do.
                </p>
              ) : (
                <>
                  <form onSubmit={handleStartCheckout} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Your Name (optional)"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      disabled={isProcessing}
                    />
                    <input
                      type="email"
                      placeholder="Your Email (optional)"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      disabled={isProcessing}
                    />
                    <input
                      type="number"
                      placeholder="Donation Amount"
                      min="1"
                      step="0.01"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2"
                      disabled={isProcessing}
                    />
                    {donationNumber > 0 && (
                      <p className="text-sm text-gray-600">
                        You are donating <strong>{formatCurrency(donationNumber)}</strong>.<br />
                        A small platform fee of{" "}
                        <strong>{formatCurrency(platformFee)}</strong> is included, but the requester
                        will still receive the full donation amount. 💛
                      </p>
                    )}
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Donate"}
                    </button>
                  </form>

                  {error && <p className="text-red-600 text-center mt-4 font-bold">{error}</p>}
                </>
              )}
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Recent Donations 💛</h2>
              {donationsToShow.length > 0 ? (
                <ul className="space-y-2">
                  {donationsToShow.map((donation, idx) => (
                    <li key={idx} className="border p-3 rounded bg-gray-700">
                      <strong>{donation.donorName}</strong> donated{" "}
                      {formatCurrency(donation.amount)} –{" "}
                      {formatDistanceToNow(new Date(donation.donatedAt || 0), { addSuffix: true })}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No donations yet. Be the first to donate!</p>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
};

export default RequestDetail;