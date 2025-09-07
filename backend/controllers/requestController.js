// backend/controllers/requestController.js
import Request from "../models/request.js";
import Donation from "../models/donation.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ------------------------
// Create a new request (reuses Stripe account if one exists for the email)
// ------------------------
export const createRequest = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if there's an existing request with a Stripe account for this email
    const existingRequestWithStripe = await Request.findOne({ email, stripeAccountId: { $exists: true, $ne: null } });

    const newRequest = new Request(req.body);

    if (existingRequestWithStripe) {
      // Reuse existing Stripe account
      newRequest.stripeAccountId = existingRequestWithStripe.stripeAccountId;
      newRequest.stripeAccountReady = true;
    }

    const saved = await newRequest.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Create request error:", err);
    res.status(400).json({ error: err.message });
  }
};

// ------------------------
// Get all requests (supports optional email filter)
// ------------------------
export const getAllRequests = async (req, res) => {
  try {
    const { email } = req.query; // optional filter
    const filter = email ? { email } : {};

    const requests = await Request.find(filter);

    const requestsWithStripeReady = requests.map(r => ({
      ...r.toObject(),
      stripeAccountReady: Boolean(r.stripeAccountId),
    }));

    res.json(requestsWithStripeReady);
  } catch (err) {
    console.error("Get all requests error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------------
// Get single request by ID
// ------------------------
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    const requestWithStripeReady = {
      ...request.toObject(),
      stripeAccountReady: Boolean(request.stripeAccountId),
    };

    res.json(requestWithStripeReady);
  } catch (err) {
    console.error("Get request by ID error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------------
// Delete request
// ------------------------
export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Request.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Request not found" });
    res.json({ message: "Request deleted" });
  } catch (err) {
    console.error("Delete request error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------------
// Update request status
// ------------------------
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await Request.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: "Request not found" });
    res.json(updated);
  } catch (err) {
    console.error("Update request status error:", err);
    res.status(400).json({ error: err.message });
  }
};

// ------------------------
// Create a Stripe account (manual trigger)
// ------------------------
export const createStripeAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (request.stripeAccountId) {
      return res.status(400).json({ error: "Stripe account already exists" });
    }

    const account = await stripe.accounts.create({ type: "express" });
    request.stripeAccountId = account.id;
    request.stripeAccountReady = true;
    await request.save();

    res.json({ stripeAccountId: account.id });
  } catch (err) {
    console.error("💥 Stripe account creation error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------------
// Generate Stripe onboarding link
// ------------------------
export const createStripeAccountLink = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (!request.stripeAccountId) {
      return res.status(400).json({ error: "No Stripe account found. Please create one first." });
    }

    const accountLink = await stripe.accountLinks.create({
      account: request.stripeAccountId,
      refresh_url: `${process.env.CLIENT_URL}/request/${id}?refresh=true`,
      return_url: `${process.env.CLIENT_URL}/request/${id}?success=true`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    console.error("💥 Stripe onboarding error:", err);
    res.status(500).json({ error: err.message });
  }
};