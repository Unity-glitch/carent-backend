import express from "express";
import Order from "../models/Order.js";
import { authenticate } from "../utils/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ orders });
  } catch (err) {
    console.error("Order list error:", err);
    res.status(500).json({ message: "Unable to fetch orders." });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    res.status(200).json({ order });
  } catch (err) {
    console.error("Order detail error:", err);
    res.status(500).json({ message: "Unable to fetch order." });
  }
});

export default router;
