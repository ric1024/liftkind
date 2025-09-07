import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Request from "../models/Request.js";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

// ------------------------
// Multer Setup for Image Uploads
// ------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ------------------------
// Helper to check Stripe account readiness
// ------------------------
async function isStripeAccountReady(accountId) {
  if (!accountId) return false;
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account.capabilities?.transfers === "active";
  } catch {
    return false;
  }
}

// ------------------------
// Create new request (handle images + Stripe)
// ------------------------
router.post("/", upload.array("images", 3), async (req, res) => {
  try {
    const { title, name, email, category, description, income, amount, userId } = req.body;

    // Map uploaded files to URLs
    const uploadedFileUrls = req.files?.map(file => `/uploads/${file.filename}`) || [];

    // Check for existing Stripe account
    const existingWithStripe = await Request.findOne({
      email,
      stripeAccountId: { $exists: true, $ne: null }
    });

    const requestData = {
      title,
      name,
      email,
      category,
      description,
      income: Number(income),
      amount: Number(amount) || 0,
      fileUrls: uploadedFileUrls,
      userId,
      stripeAccountId: existingWithStripe ? existingWithStripe.stripeAccountId : null,
      stripeAccountReady: existingWithStripe ? true : false,
    };

    const request = new Request(requestData);
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    console.error("💥 Failed to create request:", err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

// ------------------------
// Get requests by email
// ------------------------
router.get("/my-requests", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const myRequests = await Request.find({ email }).sort({ createdAt: -1 }).lean();

    const updatedRequests = await Promise.all(
      myRequests.map(async (r) => ({
        ...r,
        stripeAccountReady: await isStripeAccountReady(r.stripeAccountId),
      }))
    );

    res.json(updatedRequests);
  } catch (err) {
    console.error("💥 Failed to fetch requests:", err);
    res.status(500).json({ error: "Failed to fetch your requests" });
  }
});

// ------------------------
// Fetch all requests with pagination and category filter
// ------------------------
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 6, category } = req.query;
    const filter = category && category !== "All" ? { category } : {};

    const totalRequests = await Request.countDocuments(filter);
    const totalPages = Math.ceil(totalRequests / limit);
    const skip = (page - 1) * limit;

    const requests = await Request.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const updatedRequests = await Promise.all(
      requests.map(async (r) => ({
        ...r,
        stripeAccountReady: await isStripeAccountReady(r.stripeAccountId),
      }))
    );

    res.json({
      requests: updatedRequests,
      currentPage: Number(page),
      totalPages,
      spotlight: updatedRequests.slice(0, 3),
    });
  } catch (err) {
    console.error("💥 Failed to fetch all requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// ------------------------
// Get single request by ID
// ------------------------
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();
    if (!request) return res.status(404).json({ error: "Request not found" });

    const stripeAccountReady = await isStripeAccountReady(request.stripeAccountId);
    res.json({ ...request, stripeAccountReady });
  } catch (err) {
    console.error("💥 Failed to fetch request:", err);
    res.status(500).json({ error: "Failed to fetch request" });
  }
});

// ------------------------
// Stripe onboarding link (manual creation)
// ------------------------
router.post("/:id/stripe-account-link", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    let accountId = request.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: request.email,
        capabilities: { transfers: { requested: true } },
      });
      accountId = account.id;
      request.stripeAccountId = accountId;
      await request.save();
    }

    const origin = process.env.CLIENT_URL;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/request/${request._id}?refresh=true`,
      return_url: `${origin}/request/${request._id}?success=true`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    console.error("💥 Failed to create Stripe onboarding link:", err);
    res.status(500).json({ error: "Failed to create Stripe onboarding link" });
  }
});

export default router;