import { Router } from "express";
import {
  verifyPaymentController,
  webhookController,
  getPaymentStatusController,
} from "../controller/payment.controller";

const router = Router();

/**
 * @swagger
 * /api/payment/verify:
 *   get:
 *     summary: Verify a payment server-side (public callback)
 *     description: Called on the frontend redirect. Verifies against Flutterwave, never trusting the redirect result.
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: tx_ref
 *         schema: { type: string }
 *       - in: query
 *         name: transaction_id
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: Verification result }
 */
router.get("/verify", verifyPaymentController);

/**
 * @swagger
 * /api/payment/webhook:
 *   post:
 *     summary: Flutterwave webhook (provider → server)
 *     description: Verifies the `verif-hash` signature, deduplicates, then re-verifies and finalizes the order.
 *     tags: [Payment]
 *     responses:
 *       200: { description: Webhook processed }
 *       401: { description: Invalid signature }
 */
router.post("/webhook", webhookController);

/**
 * @swagger
 * /api/payment/status/{reference}:
 *   get:
 *     summary: Poll payment/order status by reference (public)
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Status }
 *       404: { description: Not found }
 */
router.get("/status/:reference", getPaymentStatusController);

export default router;
