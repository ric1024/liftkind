// backend/routes/stripeConnect.js
import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import Request from "../models/Request.js";
import authMiddleware from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY not set in .env");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

// ------------------------
// POST /stripe/connect-account
// Fetches Stripe Express account and returns onboarding URL (manual creation only)
// ------------------------
router.post("/connect-account", authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: "Missing requestId" });

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    // ------------------------
    // Ownership check
    // ------------------------
    if (request.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // ------------------------
    // Ensure Stripe account exists
    // ------------------------
    if (!request.stripeAccountId) {
      return res.status(400).json({
        error: "No Stripe account exists. Please create one manually first.",
      });
    }

    // ------------------------
    // Return & refresh URLs
    // ------------------------
    const returnUrl = `${process.env.CLIENT_URL}/request/${requestId}`;
    const refreshUrl = `${process.env.CLIENT_URL}/request/${requestId}`;

    // ------------------------
    // Create onboarding link
    // ------------------------
    const accountLink = await stripe.accountLinks.create({
      account: request.stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    // ------------------------
    // Respond with onboarding URL
    // ------------------------
    res.json({ url: accountLink.url });
  } catch (err) {
    console.error("💥 Stripe Connect onboarding error:", err);
    res.status(500).json({ error: "Failed to create Stripe Connect onboarding link" });
  }
});

export default router;