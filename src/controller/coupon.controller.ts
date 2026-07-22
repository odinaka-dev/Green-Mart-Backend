import { Request, Response } from "express";
import mongoose from "mongoose";
import Coupon from "../model/coupon.model";
import { applyCoupon } from "../services/checkout.service";

// ─── Public: validate a coupon against a subtotal (preview the discount) ──────
export const validateCouponController = async (req: Request, res: Response) => {
  try {
    const code = (req.body.code || req.query.code) as string;
    const subtotal = Number(req.body.subtotal ?? req.query.subtotal ?? 0);

    if (!code) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    // applyCoupon throws AppError (with statusCode) when the coupon is invalid.
    const { discount, coupon } = await applyCoupon(code, subtotal);

    return res.status(200).json({
      success: true,
      message: "Coupon is valid",
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
      },
    });
  } catch (err: any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message });
  }
};

// ─── Admin: create coupon ─────────────────────────────────────────────────────
export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { code, type, value, minSubtotal, maxDiscount, expiresAt, usageLimit } =
      req.body;

    if (!code || !type || value === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "code, type and value are required" });
    }
    if (!["percentage", "fixed"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "type must be 'percentage' or 'fixed'" });
    }

    const exists = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      type,
      value: Number(value),
      minSubtotal: Number(minSubtotal) || 0,
      maxDiscount: Number(maxDiscount) || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      usageLimit: Number(usageLimit) || 0,
    });

    return res.status(201).json({ success: true, data: coupon });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: list coupons ──────────────────────────────────────────────────────
export const listCoupons = async (_req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: coupons });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: update coupon ─────────────────────────────────────────────────────
export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const couponId = req.params.couponId as string;
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({ success: false, message: "Invalid coupon id" });
    }
    const coupon = await Coupon.findByIdAndUpdate(couponId, req.body, { new: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    return res.status(200).json({ success: true, data: coupon });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
