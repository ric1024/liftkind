import React, { useEffect, useState, useContext } from "react";
import { RequestContext } from "../context/RequestContext";
import "./MyActivityCards.css";

export default function DonationHistory({ user, token, donations: externalDonations, refreshTrigger }) {
  const { requests, setRequests } = useContext(RequestContext);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

  const fetchDonations = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/donations/history?email=${user.email}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch donations: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      setDonations(data.sort((a, b) => new Date(b.donatedAt) - new Date(a.donatedAt)));
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  // Sync donations from props or refresh trigger
  useEffect(() => {
    if (externalDonations) {
      setDonations([...externalDonations].sort((a, b) => new Date(b.donatedAt) - new Date(a.donatedAt)));
      setLoading(false);
    } else {
      fetchDonations();
    }
  }, [externalDonations, refreshTrigger]);

  // Live updates on donation-success
  useEffect(() => {
    const handleDonation = (e) => {
      const { requestId, donorName, amount, sessionId, requestTitle, requestAmount } = e.detail;
      if (!sessionId) return;

      // Prevent duplicates
      setDonations((prev) => {
        if (prev.some((d) => d.sessionId === sessionId)) return prev;
        return [
          {
            requestId,
            donorName: donorName || "Anonymous",
            amount: Number(amount) || 0,
            sessionId,
            donatedAt: new Date(),
            requestTitle: requestTitle || "Unknown Request",
            requestAmount: requestAmount || null,
          },
          ...prev,
        ];
      });

      // Update request's amountRaised in context
      setRequests((prev) =>
        prev.map((req) =>
          req._id === requestId
            ? { ...req, amountRaised: (Number(req.amountRaised) || 0) + Number(amount || 0) }
            : req
        )
      );
    };

    window.addEventListener("donation-success", handleDonation);
    return () => window.removeEventListener("donation-success", handleDonation);
  }, [setRequests]);

  if (loading) return <p>Loading donation history...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!donations.length) return <p>No donations found.</p>;

  // Calculate cumulative total per request
  const cumulativeMap = donations.reduce((acc, d) => {
    if (!acc[d.requestTitle]) acc[d.requestTitle] = 0;
    acc[d.requestTitle] += d.amount;
    return acc;
  }, {});

  return (
    <div className="activity-grid">
      {donations.map((d, index) => {
        const totalRaised = cumulativeMap[d.requestTitle] || d.amount;
        const progress =
          d.requestAmount && d.requestAmount > 0
            ? Math.min((totalRaised / d.requestAmount) * 100, 100)
            : 0;

        return (
          <div className="activity-card" key={index}>
            <h3>{d.requestTitle || "Unknown Request"}</h3>
            <p>
              <strong>Amount Donated:</strong>{" "}
              ${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(d.donatedAt).toLocaleDateString()}{" "}
              {new Date(d.donatedAt).toLocaleTimeString()}
            </p>
            <p>
              <strong>Donor:</strong> {d.donorName || "Anonymous"}
            </p>

            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
                <span className="progress-percentage">
                  {d.requestAmount && d.requestAmount > 0 ? `${Math.round(progress)}% of goal` : "Goal N/A"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}