import { Request, Response } from "express";
import Order from "../model/order.model";
import Payment from "../model/payment.model";
import WebhookLog from "../model/webhookLog.model";
import { FlutterwavePaymentService } from "../services/payment/flutterwave.service";
import {
  finalizeSuccessfulPayment,
  markPaymentFailed,
} from "../services/order.service";

/**
 * GET /api/payment/verify
 * Called on the frontend redirect callback. We DO NOT trust the redirect —
 * we verify the transaction server-side against Flutterwave, then finalize.
 *
 * Query: ?tx_ref=...&transaction_id=...&status=...
 */
export const verifyPaymentController = async (req: Request, res: Response) => {
  try {
    const txRef = (req.query.tx_ref as string) || (req.query.txRef as string);
    const transactionId =
      (req.query.transaction_id as string) || (req.query.id as string);
    const redirectStatus = (req.query.status as string) || "";

    if (!txRef && !transactionId) {
      return res.status(400).json({
        success: false,
        message: "A transaction reference or id is required",
      });
    }

    // Customer cancelled at the provider — mark failed, keep order for retry.
    if (redirectStatus && redirectStatus.toLowerCase() === "cancelled") {
      const result = await markPaymentFailed(
        txRef,
        "Payment cancelled by customer",
        { status: "cancelled" },
        "verification",
      );
      return res.status(200).json({
        success: false,
        message: "Payment was cancelled",
        data: { orderNumber: result.order?.orderNumber, status: "cancelled" },
      });
    }

    // Authoritative server-side verification.
    const flwData = transactionId
      ? await FlutterwavePaymentService.verifyTransactionById(transactionId)
      : await FlutterwavePaymentService.verifyByReference(txRef);

    const reference = flwData?.tx_ref || txRef;
    const result = await finalizeSuccessfulPayment(reference, flwData, "verification");

    if ((result as any).failed) {
      return res.status(200).json({
        success: false,
        message: "Payment verification failed",
        data: {
          orderNumber: (result as any).order?.orderNumber,
          reason: (result as any).reason,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        orderNumber: result.order?.orderNumber,
        orderStatus: result.order?.orderStatus,
        paymentStatus: result.order?.paymentStatus,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Payment verification failed",
    });
  }
};

/**
 * POST /api/payment/webhook
 * Primary mechanism for updating payment status. Verifies the Flutterwave
 * `verif-hash` signature, logs the raw payload, deduplicates retries, then
 * re-verifies the transaction server-side before finalizing.
 *
 * Always returns 200 quickly so Flutterwave does not needlessly retry once we
 * have safely recorded the event.
 */
export const webhookController = async (req: Request, res: Response) => {
  const signature = req.headers["verif-hash"] as string | undefined;
  const payload = req.body || {};
  const data = payload.data || {};
  const txRef: string | null = data.tx_ref || null;
  const eventId = data.id ? String(data.id) : null;

  // Always persist the raw webhook for auditing.
  const log = await WebhookLog.create({
    provider: "flutterwave",
    event: payload.event || payload["event.type"] || null,
    eventId,
    txRef,
    signatureValid: false,
    processed: false,
    payload,
  });

  try {
    // 1. Verify signature.
    if (!FlutterwavePaymentService.verifyWebhookSignature(signature)) {
      await WebhookLog.updateOne(
        { _id: log._id },
        { $set: { processingError: "Invalid signature" } },
      );
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }
    await WebhookLog.updateOne({ _id: log._id }, { $set: { signatureValid: true } });

    if (!txRef) {
      await WebhookLog.updateOne(
        { _id: log._id },
        { $set: { processingError: "Missing tx_ref" } },
      );
      return res.status(200).json({ success: true, message: "Ignored: no tx_ref" });
    }

    // 2. Idempotency — if this exact delivery was already processed, ignore.
    if (eventId) {
      const duplicate = await WebhookLog.findOne({
        eventId,
        processed: true,
        _id: { $ne: log._id },
      });
      if (duplicate) {
        await WebhookLog.updateOne(
          { _id: log._id },
          { $set: { processed: true, processingError: "Duplicate delivery" } },
        );
        return res.status(200).json({ success: true, message: "Duplicate ignored" });
      }
    }

    // 3. Never trust the webhook body — re-verify server-side.
    const flwData = eventId
      ? await FlutterwavePaymentService.verifyTransactionById(eventId)
      : await FlutterwavePaymentService.verifyByReference(txRef);

    if (flwData?.status === "successful") {
      await finalizeSuccessfulPayment(flwData.tx_ref || txRef, flwData, "webhook");
    } else {
      await markPaymentFailed(
        flwData?.tx_ref || txRef,
        `Provider status: ${flwData?.status || "unknown"}`,
        flwData,
        "webhook",
      );
    }

    await WebhookLog.updateOne({ _id: log._id }, { $set: { processed: true } });
    return res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (err: any) {
    await WebhookLog.updateOne(
      { _id: log._id },
      { $set: { processingError: err.message } },
    );
    // Return 200 so we don't trigger endless retries for a persistent error,
    // but the failure is recorded on the webhook log for investigation.
    return res.status(200).json({ success: false, message: "Webhook logged with error" });
  }
};

/**
 * GET /api/payment/status/:reference
 * Lightweight public status lookup by tx_ref (for the frontend to poll while
 * awaiting the webhook).
 */
export const getPaymentStatusController = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const payment = await Payment.findOne({ txRef: reference });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    const order = await Order.findById(payment.order).select(
      "orderNumber orderStatus paymentStatus grandTotal currency",
    );

    return res.status(200).json({
      success: true,
      data: {
        reference,
        paymentStatus: payment.status,
        order,
      },
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: err.message });
  }
};
