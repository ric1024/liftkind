// src/pages/SubmitRequest.jsx
import React, { useState } from "react";
import { useRequest } from "../context/RequestContext";
import { useToast } from "../components/Toast";
import "./SubmitRequest.css";

export default function SubmitRequest() {
  const { addRequest } = useRequest();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    category: "",
    description: "",
    income: "",
    amountNeeded: "",
    name: "",
    file: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Required fields check
    if (!formData.category || !formData.description) {
      showToast("Please fill out category and description.", "error");
      return;
    }

    // Conditional file upload required check
    if ((formData.income || formData.amountNeeded) && !formData.file) {
      showToast(
        "Please upload a file as proof when you provide income or amount needed.",
        "error"
      );
      return;
    }

    // Prepare request object
    const newRequest = {
      ...formData,
      id: Date.now(),
      approved: false,
    };

    addRequest(newRequest);
    showToast("Your request was submitted and is pending review.", "success");

    // Reset form
    setFormData({
      category: "",
      description: "",
      income: "",
      amountNeeded: "",
      name: "",
      file: null,
    });
  };

  return (
    <div className="submit-request-container">
      <h1 className="submit-title">Submit a Request</h1>
      <p className="submit-subtitle">
        Tell us what you need — your community is here to lift you. 🌻
      </p>

      <form onSubmit={handleSubmit} className="request-form">
        <label>
          Category <span className="required">*</span>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Category --</option>
            <option value="Medical">Medical</option>
            <option value="Housing">Housing</option>
            <option value="Education">Education</option>
            <option value="Food">Food</option>
            <option value="Clothing">Clothing</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Description <span className="required">*</span>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            placeholder="Share your story or what support you’re looking for..."
            required
          />
        </label>

        <label>
          Monthly Income (optional)
          <input
            type="number"
            name="income"
            value={formData.income}
            onChange={handleChange}
            placeholder="Enter your monthly income"
            min="0"
          />
        </label>

        <label>
          Amount Needed (optional)
          <input
            type="number"
            name="amountNeeded"
            value={formData.amountNeeded}
            onChange={handleChange}
            placeholder="How much money do you need?"
            min="0"
          />
        </label>

        <label>
          Your First Name (optional)
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="You can remain anonymous"
          />
        </label>

        <label>
          Upload a file{" "}
          {(formData.income || formData.amountNeeded) && (
            <span className="required">*</span>
          )}{" "}
          (optional)
          <input type="file" name="file" onChange={handleChange} />
        </label>

        <button type="submit" className="submit-btn">
          Submit Request
        </button>
      </form>
    </div>
  );
}