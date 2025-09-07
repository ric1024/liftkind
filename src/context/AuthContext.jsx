// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

  // ------------------------
  // State
  // ------------------------
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // ------------------------
  // Helper: set auth state + localStorage
  // ------------------------
  const setAuth = (userData, tokenData) => {
    console.log("setAuth called:", userData?.email, tokenData);
    setUser(userData);
    setToken(tokenData);
    if (userData) localStorage.setItem("user", JSON.stringify(userData));
    else localStorage.removeItem("user");
    if (tokenData) localStorage.setItem("token", tokenData);
    else localStorage.removeItem("token");
  };

  // ------------------------
  // Sync across tabs
  // ------------------------
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem("user");
      const savedToken = localStorage.getItem("token");
      setUser(savedUser ? JSON.parse(savedUser) : null);
      setToken(savedToken || null);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ------------------------
  // Fetch current user (only if no user yet)
  // ------------------------
  const fetchCurrentUser = useCallback(async () => {
    if (!token) {
      setAuth(null, null);
      setInitialLoading(false);
      return null;
    }

    try {
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuth(res.data, token);
      setInitialLoading(false);
      return res.data;
    } catch (err) {
      console.error("Fetch current user error:", err);
      setAuth(null, null);
      setInitialLoading(false);
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (!user) {
      fetchCurrentUser();
    } else {
      setInitialLoading(false);
    }
  }, []); // only run on mount

  // ------------------------
  // Register
  // ------------------------
  const register = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, { email: email.toLowerCase(), password });
      setAuth(res.data.user, res.data.token);
      setLoading(false);
      return { success: true, user: res.data.user, token: res.data.token };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  };

  // ------------------------
  // Login
  // ------------------------
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email: email.toLowerCase(), password });
      setAuth(res.data.user, res.data.token);
      setLoading(false);
      return { success: true, user: res.data.user, token: res.data.token };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  };

  // ------------------------
  // Logout
  // ------------------------
  const logout = () => {
    setAuth(null, null);
    setError(null);
  };

  // ------------------------
  // Delete Account
  // ------------------------
  const deleteAccount = async () => {
    if (!token) return false;
    try {
      await axios.delete(`${API_BASE}/auth/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
      return true;
    } catch (err) {
      console.error("Delete account error:", err);
      return false;
    }
  };

  // ------------------------
  // Forgot Password
  // ------------------------
  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password`, { email: email.toLowerCase() });
      setLoading(false);
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  };

  // ------------------------
  // Reset Password
  // ------------------------
  const resetPassword = async (resetToken, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/auth/reset-password/${resetToken}`, { password: newPassword });
      if (res.data.token && res.data.user) {
        setAuth(res.data.user, res.data.token);
      }
      setLoading(false);
      return { success: true, message: res.data.message, user: res.data.user, token: res.data.token };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  };

  // ------------------------
  // Axios interceptor to attach token
  // ------------------------
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const t = token;
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        initialLoading,
        error,
        register,
        login,
        logout,
        deleteAccount,
        fetchCurrentUser,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);