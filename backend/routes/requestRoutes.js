// backend/routes/requests.js
import express from "express";
import Request from "../models/request.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// ------------------------
// Configure Multer
// ------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder to save images
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ------------------------
// GET all requests
// ------------------------
router.get("/", async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("💥 Error fetching requests:", err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// GET request by ID
// ------------------------
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  } catch (err) {
    console.error("💥 Error fetching request by ID:", err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// GET requests made by a specific user (by name)
// ------------------------
router.get("/my-requests", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: "Name is required to find your requests." });
    const myRequests = await Request.find({ name }).sort({ createdAt: -1 });
    res.json(myRequests);
  } catch (err) {
    console.error("💥 Error fetching my requests:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------
// POST new request with images
// ------------------------
router.post("/", upload.array("images", 3), async (req, res) => {
  try {
    const { title, name, email, category, description, income, amount } = req.body;
    const fileUrls = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    const newRequest = new Request({
      title,
      name,
      email,
      category,
      description,
      income,
      amount: amount || 0,
      fileUrls,
    });

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (err) {
    console.error("💥 Error creating request:", err);
    res.status(400).json({ error: err.message });
  }
});

// ------------------------
// UPDATE request spotlight status
// ------------------------
router.put("/:id/spotlight", async (req, res) => {
  try {
    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      { spotlight: req.body.spotlight },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error("💥 Error updating spotlight:", err);
    res.status(400).json({ error: err.message });
  }
});

export default router;