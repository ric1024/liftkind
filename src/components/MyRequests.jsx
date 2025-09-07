// src/components/MyRequests.jsx
import React, { useEffect, useState } from "react";
import "./MyActivityCards.css";

export default function MyRequests({ user }) {
  const [myRequests, setMyRequests] = useState([]);
  const apiUrl = "http://localhost:5001/api/requests";

  useEffect(() => {
    if (!user?.email) return;

    const fetchMyRequests = async () => {
      try {
        const res = await fetch(`${apiUrl}/my-requests?email=${user.email}`);
        if (!res.ok) throw new Error("Failed to fetch my requests");
        const data = await res.json();
        setMyRequests(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMyRequests();
  }, [user]);

  if (!myRequests.length) return <p>No requests yet.</p>;

  return (
    <div className="activity-grid">
      {myRequests.map((r) => {
        // Calculate progress percentage
        let progress = 0;
        let progressText = "";
        if (r.amount > 0) {
          progress = Math.min((r.amountRaised / r.amount) * 100, 100);
          progressText = `${Math.round(progress)}%`;
        } else if (r.amount === 0 && r.amountRaised > 0) {
          // show partial fill if goal is 0 but something was raised
          progress = Math.min((r.amountRaised / 1000) * 100, 100); // treat 1000 as arbitrary max for display
          progressText = "Goal N/A";
        } else {
          progress = 0;
          progressText = "Goal N/A";
        }

        return (
          <div className="activity-card" key={r._id}>
            <h3>{r.title || "Untitled Request"}</h3>
            <p>
              <strong>Category:</strong> {r.category || "N/A"}
            </p>
            <p className="short-desc">{r.description || "No description"}</p>
            <p>
              <strong>Goal:</strong> ${r.amount.toLocaleString()} |{" "}
              <strong>Raised:</strong> ${r.amountRaised.toLocaleString()}
            </p>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              >
                <span className="progress-percentage">{progressText}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}