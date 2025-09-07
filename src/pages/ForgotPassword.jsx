import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const res = await forgotPassword(email);
    if (res.success) {
      setMessage(res.message);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded shadow mt-20">
      <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>

      {message && <p className="text-green-600 mb-3 text-center">{message}</p>}
      {error && <p className="text-red-600 mb-3 text-center">{error}</p>}

      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div>
          <label className="block mb-1">Enter your email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="you@example.com"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Send Reset Link
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <Link to="/login" className="inline-block w-full">
          <button className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
            Back to Login
          </button>
        </Link>
        <p className="text-sm text-gray-600">
          Remember your password?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;