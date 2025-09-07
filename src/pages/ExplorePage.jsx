import React, { useEffect, useState } from "react";

const ExplorePage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/requests`)
      .then((res) => res.json())
      .then((data) => {
        setRequests(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load requests", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading requests...</p>;

  return (
    <div>
      <h1>Requests</h1>
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <ul>
          {requests.map((req) => (
            <li key={req._id}>
              <strong>{req.title}</strong>: {req.description} (Category: {req.category})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExplorePage;