import mongoose from "mongoose";

export const PAYMENT_RECORD_STATUS = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
] as const;

/**
 * A payment attempt against an order. One order may accumulate multiple
 * payment attempts (retries), but the tx_ref is unique per attempt.
 */
const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    txRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: { type: String, default: "flutterwave" },

    // Provider-side identifiers (populated after verification).
    providerTransactionId: { type: String, default: null },
    providerReference: { type: String, default: null }, // flw_ref

    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    customerEmail: { type: String, lowercase: true, trim: true },
    paymentMethod: { type: String, default: null },

    status: {
      type: String,
      enum: PAYMENT_RECORD_STATUS,
      default: "pending",
    },

    verifiedAt: { type: Date, default: null },
    failureReason: { type: String, default: null },

    // Raw verified payload from the provider, stored for auditing.
    providerResponse: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
