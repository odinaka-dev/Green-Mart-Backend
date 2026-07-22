import mongoose from "mongoose";

/**
 * Discount coupon. Validated and applied server-side at checkout; the
 * resulting discount amount is always recomputed and never trusted from
 * the client.
 */
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    // For "percentage": 0–100. For "fixed": an absolute amount in `currency`.
    value: { type: Number, required: true, min: 0 },
    // Minimum cart subtotal required for the coupon to apply.
    minSubtotal: { type: Number, default: 0 },
    // Cap on the discount for percentage coupons (0 = uncapped).
    maxDiscount: { type: Number, default: 0 },
    currency: { type: String, default: "NGN" },
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
