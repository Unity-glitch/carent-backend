import dotenv from "dotenv";
dotenv.config(); // 👈 must be first before anything else

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import "./config/passport.js"; // 👈 after dotenv
import authRoutes from "./routes/auth.js";
import https from https

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

app.use("/api/auth", authRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, "0.0.0.0", () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`),
    );
  })
  .catch((err) => console.error("❌ MongoDB error:", err));

  setInterval(() => {
  https.get("https://carent-ymkk.onrender.com/api/health").on("error", () => {});
}, 14 * 60 * 1000);

app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));

