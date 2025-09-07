import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: "English",
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // --- Stripe Connect fields ---
    stripeAccountId: {
      type: String, // e.g. acct_123 from Stripe
    },
    stripeAccountCreated: {
      type: Boolean,
      default: false,
    },
    stripeOnboardingComplete: {
      type: Boolean,
      default: false,
    },
    payoutEnabled: {
      type: Boolean,
      default: false, // Stripe will tell us when payouts are enabled
    },
    balance: {
      type: Number,
      default: 0, // optional, if you want to track money before payout
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Prevent overwrite error in dev
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;