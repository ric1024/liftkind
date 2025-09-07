import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const categories = [
  "Education",
  "Housing",
  "Healthcare",
  "Food",
  "Transportation",
  "Other",
];

const RequestForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    amountNeeded: "",
    description: "",
    requesterName: "",
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3); // max 3 images
    setImages(files);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.amountNeeded) newErrors.amountNeeded = "Amount is required";
    else if (isNaN(formData.amountNeeded) || Number(formData.amountNeeded) <= 0)
      newErrors.amountNeeded = "Amount must be a positive number";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      const formPayload = new FormData();
      formPayload.append("title", formData.title);
      formPayload.append("category", formData.category);
      formPayload.append("amount", Number(formData.amountNeeded));
      formPayload.append("description", formData.description);
      formPayload.append("name", formData.requesterName.trim() || "Anonymous");
      images.forEach((file) => {
        formPayload.append("images", file);
      });

      try {
        const res = await fetch("http://localhost:5001/api/requests", {
          method: "POST",
          body: formPayload,
        });
        if (!res.ok) throw new Error("Failed to submit request");
        alert("Request submitted successfully!");
        navigate("/explore");
      } catch (err) {
        alert("Failed to submit request: " + err.message);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-6 text-[#f97316]">Submit a Funding Request</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="title" className="block font-semibold mb-1">Title*</label>
          <input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="category" className="block font-semibold mb-1">Category*</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${
              errors.category ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="amountNeeded" className="block font-semibold mb-1">Amount Needed (USD)*</label>
          <input
            id="amountNeeded"
            name="amountNeeded"
            type="number"
            value={formData.amountNeeded}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${
              errors.amountNeeded ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.amountNeeded && <p className="text-red-500 text-sm mt-1">{errors.amountNeeded}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block font-semibold mb-1">Description*</label>
          <textarea
            id="description"
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 resize-none ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        <div className="mb-6">
          <label htmlFor="requesterName" className="block font-semibold mb-1">
            Your Name{" "}
            <span className="text-sm font-normal text-gray-500">
              (optional — helps build trust, even just a first name)
            </span>
          </label>
          <input
            id="requesterName"
            name="requesterName"
            value={formData.requesterName}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="images" className="block font-semibold mb-1">
            Upload up to 3 images (optional)
          </label>
          <input
            id="images"
            name="images"  {/* <-- added this line */}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            multiple
            onChange={handleImageChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
          />
          <p className="text-sm text-gray-500 mt-1">You can upload up to 3 images.</p>
          {images.length > 0 && (
            <div className="mt-2 flex gap-3">
              {images.map((file, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${i + 1}`}
                  className="w-16 h-16 object-cover rounded border"
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-[#f97316] text-white font-semibold py-3 rounded shadow hover:bg-[#fb923c] transition"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default RequestForm;