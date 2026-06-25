import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// auth signup/signin
import passport from "passport";
import "../config/passport.js";

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: true, // 👈 changed
  sameSite: "none", // 👈 changed
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Google login/sign
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// Facebook SignUp/signin
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] }),
);

// ── SIGN UP ──
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email already registered." });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashed });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      message: "Account created successfully!",
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ── SIGN IN ──
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      message: "Login successful!",
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/signin",
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to your frontend home
    res.redirect("https://carent-snowy.vercel.app/home"); // 👈 changed
  },
);

// Facebook signup/signin
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "/signin",
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("https://carent-snowy.vercel.app/home");
  },
);

// ── SIGN OUT ──
router.post("/signout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully." });
});

export default router;
