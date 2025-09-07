import React, { useMemo } from "react";
import "./RequestInfoDashboard.css";

const RequestInfoDashboard = ({ request }) => {
  const donations = request.donations || [];

  // Count unique donors by email (case-insensitive)
  const totalDonors = useMemo(() => {
    const unique = new Set(
      donations
        .map((d) => d.donorEmail?.toLowerCase())
        .filter(Boolean) // remove undefined/null
    );
    return unique.size;
  }, [donations]);

  const totalRaised = useMemo(
    () => donations.reduce((sum, d) => sum + Number(d.amount || 0), 0),
    [donations]
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <section className="request-info-dashboard">
      <div className="info-card">
        <div className="info-label" data-tooltip="Category">
          Category
        </div>
        <div className="info-value" data-tooltip={request.category}>
          {request.category}
        </div>
      </div>

      <div className="info-card">
        <div className="info-label" data-tooltip="Goal">
          Goal
        </div>
        <div className="info-value" data-tooltip={formatCurrency(request.amount)}>
          {formatCurrency(request.amount)}
        </div>
      </div>

      <div className="info-card">
        <div className="info-label" data-tooltip="Raised">
          Raised
        </div>
        <div className="info-value" data-tooltip={formatCurrency(totalRaised)}>
          {formatCurrency(totalRaised)}
        </div>
      </div>

      <div className="info-card">
        <div className="info-label" data-tooltip="Total Donors">
          Total Donors
        </div>
        <div className="info-value" data-tooltip={totalDonors}>{totalDonors}</div>
      </div>

      <div className="info-card full-width">
        <div className="info-label" data-tooltip="Total Donations">
          Total Donations
        </div>
        <div className="info-value" data-tooltip={formatCurrency(totalRaised)}>
          {formatCurrency(totalRaised)}
        </div>
      </div>
    </section>
  );
};

export default RequestInfoDashboard;