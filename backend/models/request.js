// backend/models/Request.js
import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
  donorName: { type: String, default: "Anonymous" },
  donorEmail: { type: String },
  amount: { type: Number, required: true },
  donatedAt: { type: Date, default: Date.now },
  sessionId: { type: String },
});

const requestSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    name: { type: String, default: "Anonymous" },
    email: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    income: { type: Number, required: true },
    amount: { type: Number, required: true, default: 0 },
    amountRaised: { type: Number, default: 0 },
    fileUrls: { type: [String], default: [] },
    spotlight: { type: Boolean, default: false },
    donations: [donationSchema],

    // Stripe Connect info
    stripeAccountId: { type: String, default: null },
    stripeAccountReady: { type: Boolean, default: false }, // ✅ new field
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Virtual field to count unique donors
requestSchema.virtual("donorCount").get(function () {
  const uniqueDonors = new Set(this.donations.map((d) => d.donorEmail));
  return uniqueDonors.size;
});

// Include virtuals in JSON
requestSchema.set("toJSON", { virtuals: true });
requestSchema.set("toObject", { virtuals: true });

const Request = mongoose.models.Request || mongoose.model("Request", requestSchema);

export default Request;