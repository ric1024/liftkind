// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET } from "../config.js";

if (!JWT_SECRET) {
  throw new Error("❌ JWT_SECRET must be set in environment variables");
}

export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    console.log("🔹 Incoming Authorization header:", authHeader);

    if (!authHeader.startsWith("Bearer ")) {
      console.warn("⚠️ No Bearer token provided");
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.warn("⚠️ Token missing after 'Bearer '");
      return res.status(401).json({ message: "Invalid token" });
    }

    // ✅ Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("✅ Token decoded payload:", decoded);

    // ✅ Lookup user
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.warn("⚠️ User not found for decoded token");
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // attach user
    next();
  } catch (err) {
    console.error("❌ Unauthorized - JWT verification failed:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
}