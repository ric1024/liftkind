import express from "express";
import Request from "../models/request.js";

const router = express.Router();

// GET spotlight requests — top 3 by number of donors
router.get("/", async (req, res) => {
  try {
    const spotlightRequests = await Request.aggregate([
      {
        $addFields: { donorCount: { $size: { $ifNull: ["$donations", []] } } }
      },
      { $sort: { donorCount: -1, createdAt: -1 } }, // most donors first, then newest
      { $limit: 3 }
    ]);

    res.json(spotlightRequests);
  } catch (err) {
    console.error("Spotlight fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;