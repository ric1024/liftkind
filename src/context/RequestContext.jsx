// src/context/RequestContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";

export const RequestContext = createContext();

export const RequestProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);
  const [spotlight, setSpotlight] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [totalDonations, setTotalDonations] = useState(0);

  const apiUrl = "http://localhost:5001/api";
  const socketUrl = "http://localhost:5001";
  const pageLimit = 6;

  // ------------------------
  // Fetch total donations
  // ------------------------
  const fetchTotalDonations = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/donations/total`);
      if (!res.ok) throw new Error("Failed to fetch total donations");
      const data = await res.json();
      setTotalDonations(data.total || 0);
    } catch (err) {
      console.error("Fetch total donations error:", err);
      setTotalDonations(0);
    }
  }, [apiUrl]);

  // ------------------------
  // Fetch requests with pagination & category
  // ------------------------
  const fetchRequests = useCallback(
    async (page = 1, category = categoryFilter) => {
      setLoading(true);
      try {
        const res = await fetch(
          `${apiUrl}/requests?page=${page}&limit=${pageLimit}&category=${category}`
        );
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();

        setSpotlight(data.spotlight || []);
        setRequests(data.requests || []);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Fetch requests error:", err);
        setRequests([]);
        setSpotlight([]);
        setCurrentPage(1);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, categoryFilter]
  );

  // ------------------------
  // Add a new request
  // ------------------------
  const addRequest = async (newRequest) => {
    try {
      const res = await fetch(`${apiUrl}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });
      if (!res.ok) throw new Error("Failed to submit request");
      const data = await res.json();

      await refreshAll();
      return data;
    } catch (err) {
      console.error("Add request error:", err);
      throw err;
    }
  };

  // ------------------------
  // Refresh both requests + donations
  // ------------------------
  const refreshAll = useCallback(async () => {
    await Promise.all([fetchRequests(currentPage, categoryFilter), fetchTotalDonations()]);
  }, [fetchRequests, fetchTotalDonations, currentPage, categoryFilter]);

  // ------------------------
  // Handle category change
  // ------------------------
  const handleCategoryChange = (category) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  // ------------------------
  // Socket.IO updates
  // ------------------------
  useEffect(() => {
    const socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("✅ Connected to Socket.IO server");
    });

    socket.on("donationUpdate", (updatedRequest) => {
      setRequests((prev) =>
        prev.map((req) =>
          req._id === updatedRequest._id
            ? { ...req, amountRaised: updatedRequest.amountRaised, donations: updatedRequest.donations }
            : req
        )
      );

      fetchTotalDonations();
    });

    return () => socket.disconnect();
  }, [socketUrl, fetchTotalDonations]);

  // ------------------------
  // Initial fetch & refresh on page/filter change
  // ------------------------
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <RequestContext.Provider
      value={{
        requests,
        spotlight,
        loading,
        currentPage,
        totalPages,
        categoryFilter,
        setCurrentPage,
        setCategoryFilter: handleCategoryChange,
        fetchRequests,
        fetchTotalDonations,
        addRequest,
        totalDonations,
        refreshAll,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};