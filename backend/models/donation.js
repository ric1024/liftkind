import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
    },
    donorName: { type: String, required: true },
    donorEmail: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true } // createdAt will track donation date
);

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;