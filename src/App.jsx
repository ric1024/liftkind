// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import Header from "./components/Header.jsx";

import DashboardLayout from "./components/DashboardLayout.jsx";
import Home from "./pages/Home.jsx";
import Explore from "./pages/Explore.jsx";
import Submit from "./pages/Submit.jsx";
import RequestDetail from "./pages/RequestDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import DonationHistory from "./components/DonationHistory.jsx";
import MyActivity from "./pages/MyActivity.jsx";
import Settings from "./pages/Settings.jsx";
import CancelPage from "./pages/CancelPage.jsx";
import StripeDonation from "./pages/StripeDonation.jsx";
import DonationSuccess from "./pages/DonationSuccess.jsx"; // <-- Correct import
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import "./App.css";
import "./app.dark.css";

export default function App() {
  useEffect(() => {
    document.body.classList.add("dark-mode");
    return () => document.body.classList.remove("dark-mode");
  }, []);

  return (
    <AuthProvider>
      <Header />

      <main style={{ paddingTop: "4rem" }}>
        <Routes>
          {/* Protected routes inside DashboardLayout */}
          <Route
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route path="/explore" element={<Explore />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/request/:id" element={<RequestDetail />} />
            <Route path="/donation-history" element={<DonationHistory />} />
            <Route path="/my-activity" element={<MyActivity />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />

          {/* Stripe donation cancel route */}
          <Route path="/donation-cancel" element={<CancelPage />} />

          {/* Stripe donation success route */}
          <Route path="/donation-success" element={<DonationSuccess />} /> {/* <-- fixed */}
        </Routes>
      </main>
    </AuthProvider>
  );
}