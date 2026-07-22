import mongoose from "mongoose";

/**
 * Raw inbound webhook audit log. Every webhook request is persisted here
 * (regardless of validity) for debugging and idempotency. `eventId` /
 * `txRef` are used to detect and safely ignore duplicate deliveries.
 */
const webhookLogSchema = new mongoose.Schema(
  {
    provider: { type: String, default: "flutterwave" },
    event: { type: String, default: null },
    eventId: { type: String, default: null, index: true },
    // Provider-unique identifier for the delivery, used for idempotency.
    txRef: { type: String, default: null, index: true },
    signatureValid: { type: Boolean, default: false },
    processed: { type: Boolean, default: false },
    processingError: { type: String, default: null },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    receivedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

const WebhookLog = mongoose.model("WebhookLog", webhookLogSchema);
export default WebhookLog;
