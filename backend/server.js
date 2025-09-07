// backend/server.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

// Routes
import donationRoutes from "./routes/donations.js";
import requestRoutes from "./routes/requests.js";
import stripeConnectRoutes from "./routes/stripeConnect.js";
import webhooksRoutes from "./routes/webhooks.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import contactRoutes from "./routes/contact.js";

dotenv.config({ path: path.resolve(fileURLToPath(import.meta.url), ".env") });

const app = express();
const httpServer = createServer(app);

// ------------------------
// CORS
// ------------------------
app.use(cors({ origin: process.env.CLIENT_URL }));

// ------------------------
// Serve uploaded files
// ------------------------
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ------------------------
// Stripe Webhook
// MUST be mounted BEFORE express.json()
// ------------------------
app.use("/api/webhooks/stripe", webhooksRoutes);

// ------------------------
// JSON Body Parser for all other routes
// ------------------------
app.use(express.json());

// ------------------------
// MongoDB connection
// ------------------------
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ------------------------
// API Routes
// ------------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/stripe", stripeConnectRoutes);
app.use("/api/contact", contactRoutes);

// Base route
app.get("/", (req, res) => res.send("LiftKind API is running 🚀"));

// ------------------------
// Socket.IO
// ------------------------
export const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] },
});
io.on("connection", (socket) => {
  socket.on("disconnect", () => {});
});

// ------------------------
// Start server
// ------------------------
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`)
);