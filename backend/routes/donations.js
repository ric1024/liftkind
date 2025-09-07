import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import Request from "../models/Request.js";
import authMiddleware from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set in .env");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });
const PLATFORM_FEE_PERCENT = 0.05;

// ------------------------
// Create Stripe Checkout session
// ------------------------
router.post("/create-checkout-session", authMiddleware, async (req, res) => {
  try {
    const { requestId, amount, donorName, donorEmail } = req.body;
    const donor = req.user;

    if (!donor) return res.status(401).json({ error: "User not authenticated" });
    if (!requestId || !amount) return res.status(400).json({ error: "Missing requestId or amount" });

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    const donationAmount = Number(amount);
    if (isNaN(donationAmount) || donationAmount <= 0)
      return res.status(400).json({ error: "Invalid donation amount" });

    // ------------------------
    // Prevent self-donations
    // ------------------------
    const donorEmailFinal = (donorEmail || donor.email).toLowerCase();
    const ownerEmail = request.email?.toLowerCase() || "";
    if (donorEmailFinal === ownerEmail) {
      return res.status(400).json({ error: "You cannot donate to your own request." });
    }

    // Ensure requester has Stripe account
    if (!request.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: ownerEmail || "no-reply@example.com",
      });
      request.stripeAccountId = account.id;
      await request.save();
    }

    // Check Stripe account readiness
    const account = await stripe.accounts.retrieve(request.stripeAccountId);
    if (!account.capabilities?.transfers || account.capabilities.transfers !== "active") {
      const onboarding = await stripe.accountLinks.create({
        account: request.stripeAccountId,
        refresh_url: `${process.env.CLIENT_URL}/request/${requestId}`,
        return_url: `${process.env.CLIENT_URL}/request/${requestId}`,
        type: "account_onboarding",
      });

      return res.status(400).json({
        error: "Requester Stripe account is not ready to receive funds.",
        onboardingUrl: onboarding.url,
      });
    }

    // Calculate total charge including platform fee
    const totalAmountToCharge = Math.round((donationAmount / (1 - PLATFORM_FEE_PERCENT)) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `Donation to: ${request.title || "Untitled Request"}`,
            description: `Donor: ${donorName || donor.name || donor.email}`,
          },
          unit_amount: totalAmountToCharge,
        },
        quantity: 1,
      }],
      customer_email: donorEmailFinal,
      success_url: `${process.env.CLIENT_URL}/request/${requestId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/request/${requestId}?canceled=true`,
      payment_intent_data: {
        application_fee_amount: Math.round(totalAmountToCharge * PLATFORM_FEE_PERCENT),
        transfer_data: { destination: request.stripeAccountId },
      },
      metadata: {
        requestId,
        donorId: donor.id || "anonymous",
        donorName: donorName || donor.name || "Anonymous",
        donorEmail: donorEmailFinal,
        originalAmount: donationAmount,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("💥 Stripe Checkout Error:", err);
    res.status(500).json({ error: err.message || "Failed to create checkout session" });
  }
});

// ------------------------
// Donation history for logged-in user
// ------------------------
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const donorEmail = req.user.email.toLowerCase();
    const requests = await Request.find({ "donations.donorEmail": donorEmail }).lean();
    const donations = [];

    requests.forEach(reqItem => {
      reqItem.donations
        .filter(d => d.donorEmail.toLowerCase() === donorEmail)
        .forEach(d => donations.push({
          requestId: reqItem._id,
          requestTitle: reqItem.title,
          requestAmount: reqItem.amount,
          amount: d.amount,
          donatedAt: d.donatedAt,
          donorName: d.donorName,
        }));
    });

    res.json(donations);
  } catch (err) {
    console.error("💥 Failed to fetch donation history:", err);
    res.status(500).json({ error: "Failed to fetch donation history" });
  }
});

// ------------------------
// Fetch a Stripe checkout session by sessionId
// ------------------------
router.get("/checkout-session/:sessionId", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    res.json({
      donorName: session.metadata?.donorName || "Anonymous",
      donorEmail: session.metadata?.donorEmail || "anonymous@example.com",
      amount: Number(session.metadata?.originalAmount || 0),
      requestId: session.metadata?.requestId,
    });
  } catch (err) {
    console.error("💥 Failed to fetch checkout session:", err);
    res.status(500).json({ error: "Failed to fetch checkout session" });
  }
});

// ------------------------
// Total donations across all requests
// ------------------------
router.get("/total", async (req, res) => {
  try {
    const requests = await Request.find({}, { donations: 1 }).lean();
    const total = requests.reduce((sum, reqItem) => {
      return sum + (reqItem.donations?.reduce((s, d) => s + (d.amount || 0), 0) || 0);
    }, 0);

    res.json({ total });
  } catch (err) {
    console.error("💥 Failed to fetch total donations:", err);
    res.status(500).json({ error: "Failed to fetch total donations" });
  }
});

export default router;