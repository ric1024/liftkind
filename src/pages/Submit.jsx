import React, { useState } from "react";
import axios from "axios";
import BackButton from "../components/BackButton"; // Added import
import "./SubmitRequest.css";

export default function SubmitRequest() {
  const [formData, setFormData] = useState({
    title: "",
    name: "",
    email: "",
    category: "",
    description: "",
    income: "",
    amount: "",
    images: [], // array of files
  });
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);

  const categories = [
    "Food",
    "Bills",
    "Medical",
    "Rent",
    "Transportation",
    "Other",
  ];

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "images") {
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      const newFiles = files ? Array.from(files) : [];

      const combinedFiles = [...formData.images, ...newFiles].slice(0, 3);

      for (const file of combinedFiles) {
        if (!validTypes.includes(file.type)) {
          setError("Only JPG and PNG images are allowed.");
          return;
        }
        if (file.size > 3 * 1024 * 1024) {
          setError("Each file must be smaller than 3MB.");
          return;
        }
      }

      setError("");
      setFormData((prev) => ({ ...prev, images: combinedFiles }));
      const urls = combinedFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData((prev) => ({ ...prev, images: newImages }));
    const newUrls = newImages.map((file) => URL.createObjectURL(file));
    setPreviewUrls(newUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { title, name, email, category, description, income, amount, images } = formData;

    if (!title || !name || !email || !category || !description || !income || !amount) {
      setError("Please fill in all required fields, including the amount requested.");
      return;
    }

    const incomeNum = Number(income);
    const amountNum = Number(amount);

    if (isNaN(incomeNum) || isNaN(amountNum)) {
      setError("Income and Amount must be valid numbers.");
      return;
    }

    try {
      const submission = new FormData();
      submission.append("title", title);
      submission.append("name", name);
      submission.append("email", email);
      submission.append("category", category);
      submission.append("description", description);
      submission.append("income", incomeNum);
      submission.append("amount", amountNum);

      images.forEach((file) => submission.append("images", file));

      const res = await axios.post("http://localhost:5001/api/requests", submission, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 200 || res.status === 201) {
        setFormData({
          title: "",
          name: "",
          email: "",
          category: "",
          description: "",
          income: "",
          amount: "",
          images: [],
        });
        setPreviewUrls([]);
        setShowModal(true);
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Submission failed. Please try again.");
      }
    }
  };

  return (
    <div className="submit-request-page">
      <h2>Submit a Request</h2>
      <form onSubmit={handleSubmit} className="request-form" encType="multipart/form-data">

        <label>Request Title*</label>
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Enter a short, clear title"
        />

        <label>Name*</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Your name"
        />

        <label>Email*</label>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="you@example.com"
        />

        <label>Category*</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label>Description*</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="Describe your need"
        />

        <label>Monthly Income*</label>
        <input
          name="income"
          type="number"
          min="0"
          value={formData.income}
          onChange={handleChange}
          required
          placeholder="Your monthly income"
        />

        <label>Amount Requested*</label>
        <input
          name="amount"
          type="number"
          min="0"
          value={formData.amount}
          onChange={handleChange}
          required
          placeholder="Amount requested"
        />

        <p
          style={{
            fontSize: "0.9rem",
            color: "white",
            marginBottom: "0.5rem",
            maxWidth: "400px",
            fontStyle: "italic",
          }}
        >
          Please do not upload sensitive documents (like bills or IDs). Only share images that show living situations or relevant conditions, as your request is publicly visible.
        </p>

        <label>Upload images (optional, JPG/PNG, max 3MB each, max 3 files)</label>
        <input
          name="images"
          type="file"
          accept=".jpg,.jpeg,.png"
          multiple
          onChange={handleChange}
        />

        {previewUrls.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <strong>Preview:</strong>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              {previewUrls.map((url, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt={`Preview ${i + 1}`}
                    style={{ maxWidth: "100px", borderRadius: "4px" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      background: "red",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      cursor: "pointer",
                      width: "20px",
                      height: "20px",
                      fontSize: "14px",
                      lineHeight: "20px",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="error" style={{ color: "red", marginTop: "10px" }}>
            {error}
          </p>
        )}

        <button type="submit">Submit Request</button>
      </form>

      {showModal && (
        <div className="modal-overlay">
          <div
            className="modal"
            style={{
              background: "#2c3e50",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 4px 15px rgba(255, 77, 77, 0.6)",
            }}
          >
            <h3 style={{ fontWeight: "bold", fontSize: "1.5rem", color: "#2a9d8f" }}>
              ✅ Request Submitted!
            </h3>
            <p style={{ marginTop: "8px", color: "#ff4d4d" }}>
              Thank you for your submission! 
            </p>
            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: "15px",
                background: "#ff4d4d",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                color: "white",
                fontWeight: "bold",
                boxShadow: "0 4px 12px rgba(255, 77, 77, 0.6)",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e63939")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ff4d4d")}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}