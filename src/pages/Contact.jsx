// src/pages/Contact.jsx
import React, { useState } from "react";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(""); // success/error feedback
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);

    if (!name || !email || !message) {
      setStatus("Please fill out all fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, message }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send message");

      setStatus("✅ Message sent successfully! We'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("💥 Contact form error:", err);
      setStatus("❌ Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-gray-800 rounded-lg shadow-lg text-white space-y-6">
      <h1 className="text-3xl font-bold text-center">Contact Us</h1>
      <p className="text-center text-gray-300">
        Have feedback or need support? Send us a message and we'll get back to you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded border border-gray-400 text-gray-900"
          required
        />
        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded border border-gray-400 text-gray-900"
          required
        />
        <textarea
          placeholder="Your Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 rounded border border-gray-400 text-gray-900 h-32 resize-none"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-6 py-2 rounded font-bold text-white ${
            loading ? "bg-gray-500 cursor-not-allowed" : "bg-yellow-600 hover:bg-yellow-700"
          }`}
        >
          {loading ? "Sending..." : "Send Message"}
        </button>

        {status && (
          <p
            className={`text-center text-sm mt-2 ${
              status.startsWith("✅") ? "text-green-400" : "text-red-500"
            }`}
          >
            {status}
          </p>
        )}
      </form>
    </div>
  );
};

export default Contact;