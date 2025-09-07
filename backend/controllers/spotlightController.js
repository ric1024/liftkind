// backend/controllers/spotlightController.js
import Request from "../models/request.js";

/**
 * Get spotlight requests.
 * Criteria: requests with the highest number of unique donors.
 * Returns top N requests (default 3)
 */
export const getSpotlightRequests = async (req, res) => {
  try {
    const topN = Number(req.query.top) || 3; // optionally pass ?top=5

    // Fetch all requests and compute unique donor count
    const requests = await Request.find().lean(); // lean() for plain JS objects
    requests.forEach(req => {
      req.donorCount = new Set(req.donations.map(d => d.donorEmail)).size;
    });

    // Sort by donorCount descending
    const sortedRequests = requests.sort((a, b) => b.donorCount - a.donorCount);

    // Optionally, mark topN as spotlight in DB
    const topRequests = sortedRequests.slice(0, topN);

    // Reset spotlight flags for all requests
    await Request.updateMany({ spotlight: true }, { $set: { spotlight: false } });

    // Set spotlight for top requests
    const topIds = topRequests.map(r => r._id);
    await Request.updateMany({ _id: { $in: topIds } }, { $set: { spotlight: true } });

    res.json(topRequests);
  } catch (err) {
    console.error("Error fetching spotlight requests:", err);
    res.status(500).json({ error: "Server error" });
  }
};