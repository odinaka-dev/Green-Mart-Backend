import mongoose from "mongoose";
import { addressSchema } from "./address.model";

export const ORDER_STATUS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUS = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
] as const;

// Snapshot of each purchased line at the time of ordering. Prices are frozen
// here so historical orders are never affected by later product price changes.
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      default: null,
    },
    productName: { type: String, required: true },
    image: { type: String, default: "" },
    attributes: {
      size: { type: String, default: null },
      color: { type: String, default: null },
    },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Optional — set only when a logged-in user places the order. Guest orders
    // store all customer details directly on the order (below).
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Guest customer information.
    customer: {
      fullName: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phoneNumber: { type: String, required: true },
    },

    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema, default: null },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v: any[]) => v.length > 0,
        message: "Order must contain at least one item",
      },
    },

    // Money — every value is recalculated server-side, never trusted from the client.
    subtotal: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    currency: { type: String, default: "NGN" },

    couponCode: { type: String, default: null },

    deliveryMethod: { type: String, default: null },
    shippingMethod: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShippingMethod",
        default: null,
      },
      name: { type: String, default: null },
      fee: { type: Number, default: 0 },
    },

    orderStatus: {
      type: String,
      enum: ORDER_STATUS,
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "pending",
    },

    paymentReference: { type: String, index: true, default: null }, // tx_ref
    paymentProvider: { type: String, default: "flutterwave" },

    // Idempotency guard — ensures stock is deducted exactly once per order.
    inventoryDeducted: { type: Boolean, default: false },

    // Free-form provider / channel metadata.
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
