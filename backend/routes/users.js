// backend/routes/users.js
import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ------------------------
// Get current user
// ------------------------
router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      _id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      deleted: user.deleted || false,
    });
  } catch (err) {
    console.error("Fetch current user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------------
// Delete / anonymize current user
// ------------------------
router.delete("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Anonymize user
    user.email = `deleted_${user._id}_${Date.now()}@anon.com`;
    user.deleted = true;
    await user.save();

    // Donations and other related data remain, so history is preserved
    res.json({ message: "Account successfully deleted." });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;