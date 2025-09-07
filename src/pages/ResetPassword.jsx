import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, Link, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const { token: urlToken } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // Call backend API
      const res = await resetPassword(urlToken, newPassword);

      // The backend now returns: { message, token, user }
      if (res.token && res.user) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        setMessage(res.message || "Password reset successfully!");
        setTimeout(() => navigate("/home"), 1500); // redirect to home
      } else {
        setError(res.message || "Failed to reset password.");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message || "Server error while resetting password.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded shadow mt-20">
      <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>

      {message && <p className="text-green-600 mb-3 text-center">{message}</p>}
      {error && <p className="text-red-600 mb-3 text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block mb-1">Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Reset Password
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/login" className="text-blue-600 hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;