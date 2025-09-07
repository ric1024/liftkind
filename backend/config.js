// backend/config.js
import dotenv from "dotenv";
dotenv.config();

export const {
  PORT,
  MONGO_URI,
  JWT_SECRET,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  CLIENT_URL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
} = process.env;