// src/pages/Settings.jsx
import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import "./Settings.css";

export default function Settings() {
  const { logout, deleteAccount, user } = useContext(AuthContext);
  const [message, setMessage] = useState("");
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState("");

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account?")) return;

    const success = await deleteAccount();
    if (success) {
      logout();
      window.location.href = "/";
    } else {
      setMessage("Failed to delete account.");
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus("");

    if (!contactName || !contactEmail || !contactMessage) {
      setContactStatus("Please fill out all fields.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");

      setContactStatus("Message sent successfully! We'll get back to you soon.");
      setContactMessage(""); // clear only the message
    } catch (err) {
      console.error("💥 Contact form error:", err);
      setContactStatus("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      {message && <p className="message">{message}</p>}

      <div className="setting-item">
        <p className="note">
          Deleting your account will remove your profile but preserve any donations you have made.
        </p>
      </div>

      <div className="setting-item">
        <button className="delete-btn" onClick={handleDelete}>
          Delete Account
        </button>
      </div>

      {/* ------------------------ */}
      {/* Contact / Feedback Form */}
      {/* ------------------------ */}
      <div className="setting-item contact-section">
        <h3>Contact / Feedback</h3>
        <p className="note">
          Have feedback or need support? Send us a message and we'll get back to you.
        </p>
        <form onSubmit={handleContactSubmit} className="contact-form">
          <input
            type="text"
            placeholder="Your Name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Your Email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />
          <textarea
            placeholder="Your Message"
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            rows={5}
            required
          />
          <button type="submit" className="send-btn">
            Send Message
          </button>
        </form>
        {contactStatus && <p className="contact-status">{contactStatus}</p>}
      </div>
    </div>
  );
}