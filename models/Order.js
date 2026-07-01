import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    carId: { type: String, required: true },
    carName: { type: String, required: true },
    pricePerDay: { type: Number, required: true },
    pickupLocation: { type: String, required: true },
    dropoffLocation: { type: String, required: true },
    pickupDate: { type: Date, required: true },
    dropoffDate: { type: Date, required: true },
    days: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "Pending payment",
        "Payment confirmed",
        "Ready for pickup",
        "In use",
        "Completed",
        "Cancelled",
      ],
      default: "Pending payment",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    paystackReference: { type: String },
    paystackAuthorizationUrl: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    paymentConfirmedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
