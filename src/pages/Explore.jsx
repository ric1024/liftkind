// src/pages/Explore.jsx
import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { RequestContext } from "../context/RequestContext";
import { useAuth } from "../context/AuthContext";
import "./Explore.css";

export default function Explore() {
  const {
    requests,
    setRequests,
    loading,
    currentPage,
    totalPages,
    categoryFilter,
    setCurrentPage,
    setCategoryFilter,
    totalDonations,
    refreshAll,
  } = useContext(RequestContext);

  const { user } = useAuth(); // current logged-in user
  const apiUrl = "http://localhost:5001";
  const [carouselIndex, setCarouselIndex] = useState({});
  const [recentDonations, setRecentDonations] = useState([]);
  const [modalImage, setModalImage] = useState(null);

  // ------------------------
  // Carousel navigation
  // ------------------------
  const nextImage = (reqId, total) => {
    setCarouselIndex((prev) => ({
      ...prev,
      [reqId]: ((prev[reqId] || 0) + 1) % total,
    }));
  };

  const prevImage = (reqId, total) => {
    setCarouselIndex((prev) => ({
      ...prev,
      [reqId]: ((prev[reqId] || 0) - 1 + total) % total,
    }));
  };

  // ------------------------
  // Handle live donations
  // ------------------------
  useEffect(() => {
    const handleDonation = (e) => {
      const { requestId, donorName, donorEmail, amount, sessionId } = e.detail;
      if (!sessionId) return;

      setRecentDonations((prev) => {
        if (prev.some((d) => d.sessionId === sessionId)) return prev;
        return [
          {
            requestId,
            donorName: donorName || "Anonymous",
            donorEmail,
            amount: Number(amount) || 0,
            sessionId,
            donatedAt: new Date(),
          },
          ...prev,
        ].slice(0, 10);
      });

      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req._id === requestId
            ? { ...req, amountRaised: (Number(req.amountRaised) || 0) + Number(amount || 0) }
            : req
        )
      );

      refreshAll();
    };

    window.addEventListener("donation-success", handleDonation);
    window.addEventListener("refresh-totals", refreshAll);

    return () => {
      window.removeEventListener("donation-success", handleDonation);
      window.removeEventListener("refresh-totals", refreshAll);
    };
  }, [refreshAll, setRequests]);

  const uniqueDonations = Array.from(
    new Map(recentDonations.map((d) => [d.sessionId, d])).values()
  );

  const timeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return "less than a minute ago";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // ------------------------
  // Render a single request card
  // ------------------------
  const renderRequestCard = (req) => {
    const images = req.fileUrls || [];
    const imgIndex = carouselIndex[req._id] || 0;
    const imageSrc =
      images.length > 0
        ? images[imgIndex].startsWith("http")
          ? images[imgIndex]
          : `${apiUrl}${images[imgIndex]}`
        : null;

    const amount = Number(req.amount) || 0;
    const income = Number(req.income) || 0;
    const amountRaised = Number(req.amountRaised) || 0;
    const progressPercent = amount > 0 ? Math.min((amountRaised / amount) * 100, 100) : 0;

    return (
      <div className="request-card" key={req._id}>
        <h3>{req.category || "Uncategorized"}</h3>

        {imageSrc && (
          <div className="carousel-container">
            <img
              src={imageSrc}
              alt={req.category}
              className="request-image"
              style={{ cursor: "pointer" }}
              onClick={() => setModalImage(imageSrc)}
            />
            {images.length > 1 && (
              <>
                <button className="carousel-btn left" onClick={() => prevImage(req._id, images.length)}>←</button>
                <button className="carousel-btn right" onClick={() => nextImage(req._id, images.length)}>→</button>
                <span className="carousel-indicator">{imgIndex + 1}/{images.length}</span>
              </>
            )}
          </div>
        )}

        <p><strong>Name:</strong> {req.name || "Anonymous"}</p>
        <p className="short-desc">{req.description || "No description"}</p>
        <p><strong>Monthly Income:</strong> ${income.toFixed(2)}</p>
        <p><strong>Goal:</strong> ${amount.toFixed(2)}</p>
        <p><strong>Raised:</strong> ${amountRaised.toFixed(2)}</p>

        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* ONLY show Stripe message to request owner */}
        {user?.email === req.email && !req.stripeAccountId && (
          <p style={{ color: "red", fontWeight: "bold" }}>
            You must connect a Stripe account before receiving donations.
          </p>
        )}

        <Link to={`/request/${req._id}`} className="view-link">View Full Request →</Link>
      </div>
    );
  };

  return (
    <div className="explore-container">
      <h2>💰 All Total Donations</h2>
      <div className="donation-counter">
        <span className="live-amount">${totalDonations.toLocaleString()}</span>
      </div>

      {uniqueDonations.length > 0 && (
        <div className="recent-donations">
          <h3>Recent Donations</h3>
          {uniqueDonations.map((d) => (
            <p key={d.sessionId}>
              {d.donorName} donated ${Number(d.amount).toFixed(2)} – {timeAgo(d.donatedAt)}
            </p>
          ))}
        </div>
      )}

      <div className="requests-header">
        <h2>All Community Requests</h2>
        <div className="filters">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Food">Food</option>
            <option value="Bills">Bills</option>
            <option value="Medical">Medical</option>
            <option value="Rent">Rent</option>
            <option value="Transportation">Transportation</option>
            <option value="Other">Other</option>
          </select>
          <button onClick={refreshAll}>⟳ Refresh</button>
        </div>
      </div>

      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length > 0 ? (
        <div className="request-grid">{requests.map(renderRequestCard)}</div>
      ) : (
        <p>No requests found in this category.</p>
      )}

      <div className="pagination">
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>← Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next →</button>
      </div>

      {modalImage && (
        <div
          className="image-modal"
          onClick={() => setModalImage(null)}
        >
          <img
            src={modalImage}
            alt="Enlarged"
            className="modal-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="close-modal-btn" onClick={() => setModalImage(null)}>×</button>
        </div>
      )}
    </div>
  );
}