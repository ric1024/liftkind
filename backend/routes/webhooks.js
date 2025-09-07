// backend/routes/webhooks.js
import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import Request from "../models/Request.js";

dotenv.config();
const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set in .env");
if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET not set in .env");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

// ------------------------
// Stripe Webhook Endpoint
// ------------------------
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("💥 Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "payment_intent.succeeded": {
        let session = event.data.object;

        // If payment_intent, fetch its checkout session
        if (event.type === "payment_intent.succeeded") {
          const paymentIntentId = session.id;
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: paymentIntentId,
            limit: 1,
          });
          session = sessions.data[0];
          if (!session) {
            console.warn("⚠️ No checkout session found for payment intent", paymentIntentId);
            break;
          }
        }

        const requestId = session.metadata?.requestId;
        const sessionId = session.id;
        const donorEmail = session.metadata?.donorEmail?.toLowerCase();
        const donorName = session.metadata?.donorName || "Anonymous";
        const donorId = session.metadata?.donorId || "anonymous";
        const amount = Number(session.metadata?.originalAmount || 0);

        if (!requestId || amount <= 0 || !donorEmail) {
          console.warn("⚠️ Missing webhook data:", { requestId, amount, donorEmail });
          break;
        }

        const request = await Request.findById(requestId);
        if (!request) {
          console.warn("⚠️ Request not found:", requestId);
          break;
        }

        // Prevent self-donations
        if (donorEmail === request.email?.toLowerCase()) {
          console.warn(`⚠️ Self-donation ignored: ${donorEmail} -> ${requestId}`);
          break;
        }

        // Prevent duplicate donations
        if (request.donations.find((d) => d.sessionId === sessionId)) {
          console.log(`⚠️ Duplicate donation ignored for session ${sessionId}`);
          break;
        }

        // Record donation
        request.donations.push({
          sessionId,
          donorId,
          donorName,
          donorEmail,
          amount,
          donatedAt: new Date(),
        });

        // Update total raised
        request.amountRaised = request.donations.reduce((sum, d) => sum + (d.amount || 0), 0);

        await request.save();
        console.log(`✅ Donation recorded for request ${requestId} - $${amount}`);
        break;
      }

      case "account.updated": {
        const account = event.data.object;
        const request = await Request.findOne({ stripeAccountId: account.id });
        if (request && account.charges_enabled && !request.stripeAccountReady) {
          request.stripeAccountReady = true;
          await request.save();
          console.log(`✅ Stripe account ready for request ${request._id}`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("💥 Error processing webhook:", err);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

export default router;