import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { RequestContext } from "../context/RequestContext";
import "./SubmitRequest.css";

export default function SubmitRequest() {
  const { user } = useContext(AuthContext);
  const { refreshAll } = useContext(RequestContext);

  const [formData, setFormData] = useState({
    title: "",
    name: "",
    email: "",
    category: "",
    description: "",
    income: "",
    amount: "",
    images: [],
  });

  const [previewUrls, setPreviewUrls] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [stripeAccount, setStripeAccount] = useState(null);

  const categories = ["Food", "Bills", "Medical", "Rent", "Transportation", "Other"];

  useEffect(() => {
    if (user?.email) setFormData(prev => ({ ...prev, email: user.email }));
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      axios
        .get(`http://localhost:5001/api/requests?email=${user.email}`)
        .then(res => {
          const existing = res.data.find(r => r.stripeAccountId);
          if (existing) setStripeAccount(existing);
        })
        .catch(err => console.error("Stripe account check error:", err));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "images") {
      const newFiles = files ? Array.from(files) : [];
      const combinedFiles = [...formData.images, ...newFiles].slice(0, 3);

      for (const file of combinedFiles) {
        if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
          setErrorMessage("Only JPG and PNG images are allowed.");
          return;
        }
        if (file.size > 3 * 1024 * 1024) {
          setErrorMessage("Each file must be smaller than 3MB.");
          return;
        }
      }

      setFormData(prev => ({ ...prev, images: combinedFiles }));
      setPreviewUrls(combinedFiles.map(file => URL.createObjectURL(file)));
      setErrorMessage("");
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
    setPreviewUrls(newImages.map(file => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setShowModal(false);

    const { title, name, email, category, description, income, amount, images } = formData;

    if (!title || !name || !email || !category || !description || !income) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (income < 0) {
      setErrorMessage("Income must be a positive number.");
      return;
    }

    try {
      const form = new FormData();
      form.append("title", title);
      form.append("name", name);
      form.append("email", email);
      form.append("category", category);
      form.append("description", description);
      form.append("income", Number(income));
      form.append("amount", Number(amount) || 0);
      images.forEach(file => form.append("images", file));

      if (stripeAccount) {
        form.append("stripeAccountId", stripeAccount.stripeAccountId);
        form.append("stripeAccountReady", true);
      }

      const res = await axios.post("http://localhost:5001/api/requests", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 201) {
        setFormData({
          title: "",
          name: "",
          email: user?.email || "",
          category: "",
          description: "",
          income: "",
          amount: "",
          images: [],
        });
        setPreviewUrls([]);
        setShowModal(true);
        refreshAll();
      }
    } catch (err) {
      console.error("Submit request error:", err);
      setErrorMessage(err.response?.data?.error || "Submission failed. Please try again.");
    }
  };

  return (
    <div className="submit-request-page">
      <h2>Submit a Request</h2>
      {stripeAccount && <p className="stripe-info">Using existing Stripe account ✅</p>}

      <form className="request-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="text" name="title" placeholder="Request Title" value={formData.title} onChange={handleChange} required />
        <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required={!(user?.email)} />
        <select name="category" value={formData.category} onChange={handleChange} required>
          <option value="">Select a Category</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <textarea name="description" placeholder="Describe your situation" value={formData.description} onChange={handleChange} required />
        <input type="number" name="income" placeholder="Monthly Income" value={formData.income} onChange={handleChange} required min="0" />
        <input type="number" name="amount" placeholder="Requested Amount (optional)" value={formData.amount} onChange={handleChange} min="0" />
        <input type="file" name="images" accept=".jpg,.jpeg,.png" multiple onChange={handleChange} />

        {previewUrls.length > 0 && (
          <div className="preview-container">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="preview-image-wrapper">
                <img src={url} alt={`Preview ${idx + 1}`} className="preview-image" />
                <button type="button" onClick={() => removeImage(idx)} className="remove-image">×</button>
              </div>
            ))}
          </div>
        )}

        {errorMessage && <p className="error">{errorMessage}</p>}

        <button type="submit" className="submit-button">Submit Request</button>
      </form>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>✅ Request Submitted!</h3>
            <p>Thank you for your submission! 💛</p>
            <button onClick={() => setShowModal(false)} className="close-modal">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}