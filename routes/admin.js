import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { authenticate, adminOnly } from "../utils/authMiddleware.js";

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Create admin - allowed only when no admin exists OR when ADMIN_SETUP_KEY matches
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, setupKey } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email already registered." });

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      if (
        !process.env.ADMIN_SETUP_KEY ||
        setupKey !== process.env.ADMIN_SETUP_KEY
      ) {
        return res.status(403).json({
          message:
            "Admin already exists. Provide the correct setup key to create another admin.",
        });
      }
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      password: hashed,
      name: "admin",
      role: "admin",
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      message: "Admin account created.",
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Admin signup error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// Admin signin
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required." });

    const user = await User.findOne({ email });
    if (!user || user.role !== "admin")
      return res.status(401).json({ message: "Admin not found." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Password mismatch." });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      message: "Admin login successful.",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Admin signin error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// Protected route example: get current admin
router.get("/me", authenticate, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Admin me error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

router.get("/orders", authenticate, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (err) {
    console.error("Admin orders error:", err);
    res.status(500).json({ message: "Unable to fetch orders." });
  }
});

router.get("/customers", authenticate, adminOnly, async (req, res) => {
  try {
    const customers = await User.find({ role: "user" }).select("-password");
    res.status(200).json({ customers });
  } catch (err) {
    console.error("Admin customers error:", err);
    res.status(500).json({ message: "Unable to fetch customers." });
  }
});

router.post("/drivers", authenticate, adminOnly, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Driver email already registered." });
    }

    const hashed = await bcrypt.hash(password, 12);
    const driver = await User.create({
      name,
      email,
      password: hashed,
      role: "driver",
      provider: "local",
      driverStatus: "pending",
    });

    res.status(201).json({ message: "Driver created successfully.", driver });
  } catch (err) {
    console.error("Admin create driver error:", err);
    res.status(500).json({ message: "Unable to create driver." });
  }
});

router.patch("/drivers/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { driverStatus } = req.body;
    if (
      !driverStatus ||
      !["pending", "approved", "blocked"].includes(driverStatus)
    ) {
      return res.status(400).json({ message: "Invalid driver status." });
    }

    const driver = await User.findOne({ _id: id, role: "driver" });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }

    driver.driverStatus = driverStatus;
    await driver.save();

    res.status(200).json({ message: "Driver status updated.", driver });
  } catch (err) {
    console.error("Admin update driver error:", err);
    res.status(500).json({ message: "Unable to update driver." });
  }
});

router.get("/drivers", authenticate, adminOnly, async (req, res) => {
  try {
    const drivers = await User.find({ role: "driver" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json({ drivers });
  } catch (err) {
    console.error("Admin drivers error:", err);
    res.status(500).json({ message: "Unable to fetch drivers." });
  }
});

export default router;
