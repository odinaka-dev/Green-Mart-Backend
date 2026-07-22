import mongoose from "mongoose";

/**
 * Immutable ledger of money movements (charges and refunds) tied to an order
 * and payment. Written after a transaction is confirmed server-side.
 */
const transactionSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    type: {
      type: String,
      enum: ["charge", "refund"],
      default: "charge",
    },
    status: {
      type: String,
      enum: ["successful", "failed"],
      default: "successful",
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    reference: { type: String, required: true }, // provider transaction id / ref
    provider: { type: String, default: "flutterwave" },
    processedAt: { type: Date, default: () => new Date() },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
