import mongoose from "mongoose";

/**
 * Human-readable lifecycle log for an order (created, payment confirmed,
 * inventory deducted, shipped, etc). Powers order tracking / history views.
 */
const orderTimelineSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    status: { type: String, required: true }, // matches an order/payment status or a custom step
    title: { type: String, required: true },
    description: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const OrderTimeline = mongoose.model("OrderTimeline", orderTimelineSchema);
export default OrderTimeline;
