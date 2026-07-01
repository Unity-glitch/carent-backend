import express from "express";
import Order from "../models/Order.js";
import { authenticate } from "../utils/authMiddleware.js";

const router = express.Router();
const PAYSTACK_BASE = "https://api.paystack.co";
const paystackKey = process.env.PAYSTACK_SECRET_KEY;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

router.post("/initialize", authenticate, async (req, res) => {
  try {
    if (!paystackKey) {
      return res
        .status(500)
        .json({ message: "Paystack secret key is not configured." });
    }

    const {
      carId,
      carName,
      pricePerDay,
      pickupLocation,
      dropoffLocation,
      pickupDate,
      dropoffDate,
      days,
    } = req.body;

    if (
      !carId ||
      !carName ||
      !pricePerDay ||
      !pickupLocation ||
      !dropoffLocation ||
      !pickupDate ||
      !dropoffDate ||
      !days
    ) {
      return res
        .status(400)
        .json({ message: "All booking fields are required." });
    }

    const totalCost = Number(pricePerDay) * Number(days);
    if (Number.isNaN(totalCost) || totalCost <= 0) {
      return res.status(400).json({ message: "Invalid booking total." });
    }

    const order = await Order.create({
      user: req.user._id,
      carId,
      carName,
      pricePerDay,
      pickupLocation,
      dropoffLocation,
      pickupDate,
      dropoffDate,
      days,
      totalCost,
      status: "Pending payment",
      paymentStatus: "pending",
    });

    const payload = {
      email: req.user.email,
      amount: Math.round(totalCost * 100),
      callback_url: `${frontendUrl}/orders`,
      metadata: {
        orderId: order._id.toString(),
      },
    };

    const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.status) {
      order.status = "Cancelled";
      order.paymentStatus = "failed";
      await order.save();
      return res
        .status(400)
        .json({ message: data.message || "Unable to initialize payment." });
    }

    order.paystackReference = data.data.reference;
    order.paystackAuthorizationUrl = data.data.authorization_url;
    order.metadata = data.data.metadata;
    await order.save();

    return res.status(201).json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      orderId: order._id,
    });
  } catch (err) {
    console.error("Payment initialization error:", err);
    return res.status(500).json({ message: "Unable to start payment." });
  }
});

router.get("/verify", async (req, res) => {
  try {
    if (!paystackKey) {
      return res
        .status(500)
        .json({ message: "Paystack secret key is not configured." });
    }

    const reference = req.query.reference;
    if (!reference) {
      return res.status(400).json({ message: "Missing payment reference." });
    }

    const response = await fetch(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackKey}`,
        },
      },
    );

    const data = await response.json();
    if (!data.status) {
      return res
        .status(400)
        .json({ message: data.message || "Payment verification failed." });
    }

    const paymentData = data.data;
    const order =
      (paymentData.metadata?.orderId &&
        (await Order.findById(paymentData.metadata.orderId))) ||
      (await Order.findOne({ paystackReference: reference }));

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (paymentData.status === "success") {
      order.status = "Payment confirmed";
      order.paymentStatus = "success";
      order.paymentConfirmedAt = new Date();
    } else {
      order.status = "Pending payment";
      order.paymentStatus = "failed";
    }

    await order.save();

    return res.status(200).json({ order, paystack: paymentData });
  } catch (err) {
    console.error("Payment verification error:", err);
    return res.status(500).json({ message: "Unable to verify payment." });
  }
});

export default router;
