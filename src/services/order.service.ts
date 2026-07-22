import mongoose from "mongoose";
import Order from "../model/order.model";
import Payment from "../model/payment.model";
import Transaction from "../model/transaction.model";
import OrderTimeline from "../model/orderTimeline.model";
import PaymentEvent from "../model/paymentEvent.model";
import Coupon from "../model/coupon.model";
import Guest from "../model/guest.model";
import { deductStock } from "./inventory.service";
import { EmailService } from "./email/email.service";
import { AppError } from "../utils/apiResponse";

type Source = "verification" | "webhook";

/**
 * Fire emails without blocking the request/webhook response. Failures are
 * logged, never thrown — email is a side effect, not part of the payment
 * critical path.
 */
const sendOrderEmails = (order: any) => {
  EmailService.sendOrderConfirmationEmail({ order }).catch((e) =>
    console.error("[email] order confirmation failed:", e?.message),
  );
  EmailService.sendPaymentReceiptEmail({ order }).catch((e) =>
    console.error("[email] payment receipt failed:", e?.message),
  );
};

/**
 * Finalize a successfully-verified payment. Idempotent: safe to call multiple
 * times (webhook retries + redirect verification) — only the first call that
 * finds the order unpaid performs the state change and inventory deduction.
 *
 * `flwData` MUST come from a server-side Flutterwave verification, never the
 * frontend. Amount and currency are re-checked against the stored order.
 */
export const finalizeSuccessfulPayment = async (
  txRef: string,
  flwData: any,
  source: Source,
) => {
  const payment = await Payment.findOne({ txRef });
  if (!payment) {
    throw new AppError(`No payment found for reference ${txRef}`, 404);
  }

  const order = await Order.findById(payment.order);
  if (!order) {
    throw new AppError(`No order found for reference ${txRef}`, 404);
  }

  // Idempotency guard — already finalized.
  if (order.paymentStatus === "paid" && order.inventoryDeducted) {
    return { order, payment, alreadyProcessed: true };
  }

  // Authoritative provider checks.
  if (flwData?.status !== "successful") {
    return markPaymentFailed(
      txRef,
      `Provider reported status "${flwData?.status}"`,
      flwData,
      source,
    );
  }
  if (Number(flwData.amount) < order.grandTotal) {
    return markPaymentFailed(
      txRef,
      `Amount mismatch: paid ${flwData.amount}, expected ${order.grandTotal}`,
      flwData,
      source,
    );
  }
  if (
    flwData.currency &&
    order.currency &&
    flwData.currency.toUpperCase() !== order.currency.toUpperCase()
  ) {
    return markPaymentFailed(
      txRef,
      `Currency mismatch: paid ${flwData.currency}, expected ${order.currency}`,
      flwData,
      source,
    );
  }

  // Deduct inventory + flip statuses atomically.
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Re-read inside the transaction to re-check the idempotency guard.
      const fresh = await Order.findById(order._id).session(session);
      if (!fresh || (fresh.paymentStatus === "paid" && fresh.inventoryDeducted)) {
        return;
      }

      for (const item of fresh.items) {
        await deductStock(
          item.product,
          item.variant || null,
          item.quantity,
          session,
          item.productName,
        );
      }

      fresh.set("paymentStatus", "paid");
      fresh.set("orderStatus", "confirmed");
      fresh.set("inventoryDeducted", true);
      await fresh.save({ session });

      await Payment.updateOne(
        { _id: payment._id },
        {
          $set: {
            status: "paid",
            providerTransactionId: String(flwData.id ?? ""),
            providerReference: flwData.flw_ref || null,
            paymentMethod: flwData.payment_type || payment.paymentMethod,
            verifiedAt: new Date(),
            providerResponse: flwData,
          },
        },
        { session },
      );

      await Transaction.create(
        [
          {
            order: fresh._id,
            payment: payment._id,
            type: "charge",
            status: "successful",
            amount: Number(flwData.amount),
            currency: flwData.currency || fresh.currency,
            reference: String(flwData.id ?? txRef),
            provider: "flutterwave",
          },
        ],
        { session },
      );

      await OrderTimeline.create(
        [
          {
            order: fresh._id,
            status: "confirmed",
            title: "Payment confirmed",
            description: `Payment verified via ${source}. Inventory deducted and order confirmed.`,
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  // Post-commit side effects (non-critical, outside the transaction).
  if (order.couponCode) {
    await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
  }
  const guestId = (order.metadata as any)?.guestId;
  if (guestId) {
    await Guest.updateOne({ guestId }, { $set: { cart: [] } });
  }

  await PaymentEvent.create({
    order: order._id,
    payment: payment._id,
    txRef,
    type: "payment.verified",
    status: "paid",
    source,
    payload: flwData,
  });

  const finalOrder = await Order.findById(order._id);
  sendOrderEmails(finalOrder);

  return { order: finalOrder, payment, alreadyProcessed: false };
};

/**
 * Mark a payment/order as failed. Inventory is left untouched so the customer
 * can retry payment against the same order.
 */
export const markPaymentFailed = async (
  txRef: string,
  reason: string,
  flwData: any,
  source: Source,
) => {
  const payment = await Payment.findOne({ txRef });
  const order = payment ? await Order.findById(payment.order) : null;

  if (payment && payment.status !== "paid") {
    payment.set("status", "failed");
    payment.set("failureReason", reason);
    payment.set("providerResponse", flwData || payment.providerResponse);
    await payment.save();
  }

  if (order && order.paymentStatus !== "paid") {
    order.set("paymentStatus", "failed");
    await order.save();

    await OrderTimeline.create({
      order: order._id,
      status: "failed",
      title: "Payment failed",
      description: reason,
    });

    await PaymentEvent.create({
      order: order._id,
      payment: payment?._id,
      txRef,
      type: "payment.failed",
      status: "failed",
      source,
      message: reason,
      payload: flwData,
    });

    // Optional retry email.
    EmailService.sendPaymentFailedEmail({ order }).catch((e) =>
      console.error("[email] payment failed notice failed:", e?.message),
    );
  }

  return { order, payment, failed: true, reason };
};
