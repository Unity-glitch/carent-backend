// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, lowercase: true, trim: true },
    password: { type: String }, // optional now (social users have no password)
    name: { type: String },
    avatar: { type: String },
    provider: { type: String, default: "local" }, // "local", "google", "facebook"
    providerId: { type: String },
    role: { type: String, enum: ["user", "admin", "driver"], default: "user" },
    driverStatus: {
      type: String,
      enum: ["pending", "approved", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
