import mongoose from "mongoose";

/**
 * Normalised record of every payment state change (initialized, verified,
 * paid, failed, refunded, webhook-received). Complements WebhookLog, which
 * stores raw inbound payloads. Useful for a payment audit trail per order.
 */
const paymentEventSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    txRef: { type: String, default: null, index: true },
    type: { type: String, required: true }, // e.g. "payment.initialized", "payment.verified"
    status: { type: String, default: null },
    source: {
      type: String,
      enum: ["system", "verification", "webhook"],
      default: "system",
    },
    message: { type: String, default: null },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

const PaymentEvent = mongoose.model("PaymentEvent", paymentEventSchema);
export default PaymentEvent;
