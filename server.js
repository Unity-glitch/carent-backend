import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import "./config/passport.js";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js";
import orderRoutes from "./routes/orders.js";
import https from "https";

const app = express();

app.use(
  cors({
    origin: ["https://carent-snowy.vercel.app", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// ✅ Health route BEFORE mongoose
app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);

// ✅ Listen BEFORE mongoose so Render detects the port immediately
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Connect MongoDB after server starts
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ✅ Keep Render alive
setInterval(
  () => {
    https
      .get("https://carent-ymkk.onrender.com/api/health")
      .on("error", () => {});
  },
  14 * 60 * 1000,
);
