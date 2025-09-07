// src/pages/DonationSuccess.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function DonationSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing your donation...");
  const [donation, setDonation] = useState(null);
  const [requestTitle, setRequestTitle] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const session_id = searchParams.get("session_id");

    async function confirmDonation() {
      try {
        if (!session_id) throw new Error("Invalid donation session.");

        // 1️⃣ Fetch Stripe checkout session
        const sessionRes = await fetch(`${API_BASE}/donations/checkout-session/${session_id}`);
        if (!sessionRes.ok) throw new Error("Failed to fetch donation session.");
        const session = await sessionRes.json();

        const { requestId, donorName, donorEmail, amount } = session;
        if (!requestId || amount <= 0) throw new Error("Invalid donation session data.");

        // 2️⃣ Fetch request title
        let title = "your request";
        try {
          const reqRes = await fetch(`${API_BASE}/requests/${requestId}`);
          if (reqRes.ok) {
            const reqData = await reqRes.json();
            title = reqData?.title || title;
          }
        } catch {}

        setRequestTitle(title);
        setDonation({ donorName, donorEmail, amount, requestId });
        setStatus("🎉 Thank you! Your donation was successful.");

        // ✅ Dispatch custom event for UI update
        const donationEvent = new CustomEvent("donation-success", {
          detail: { requestId, donorName, donorEmail, amount, sessionId: session_id },
        });
        window.dispatchEvent(donationEvent);

        // ✅ Dispatch refresh event to update totals
        const refreshEvent = new CustomEvent("refresh-totals", {
          detail: { requestId, amount },
        });
        window.dispatchEvent(refreshEvent);

        // 3️⃣ Redirect back to request detail after 3s
        setTimeout(() => {
          navigate(`/request/${requestId}?refresh=true`);
        }, 3000);
      } catch (err) {
        console.error(err);
        setStatus(err.message || "Something went wrong confirming your donation.");
      }
    }

    confirmDonation();
  }, [searchParams, API_BASE, navigate]);

  return (
    <div style={{ padding: "2rem", textAlign: "center", minHeight: "50vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <h1>Donation Success</h1>
      <p>{status}</p>

      {donation && (
        <div style={{ marginTop: "1rem" }}>
          <p><strong>Donor:</strong> {donation.donorName || "Anonymous"}</p>
          <p><strong>Amount:</strong> ${donation.amount.toFixed(2)}</p>
          <p><strong>Request:</strong> {requestTitle}</p>
        </div>
      )}
    </div>
  );
}