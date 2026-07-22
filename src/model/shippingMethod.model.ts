import mongoose from "mongoose";

/**
 * A selectable delivery option with a fixed fee. Checkout validates the
 * chosen method against this collection and uses its server-side fee — the
 * shipping fee sent by the client is never trusted.
 */
const shippingMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    fee: { type: Number, required: true, min: 0 },
    estimatedDays: { type: String, default: null }, // e.g. "2-4 business days"
    // Optional list of regions/states this method serves. Empty = everywhere.
    regions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const ShippingMethod = mongoose.model("ShippingMethod", shippingMethodSchema);
export default ShippingMethod;
