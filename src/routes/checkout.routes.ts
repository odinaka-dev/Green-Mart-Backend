import { Router } from "express";
import { checkoutController } from "../controller/checkout.controller";

const router = Router();

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Guest checkout (public)
 *     description: |
 *       Validates the guest cart & inventory, recalculates all totals
 *       server-side, creates the order + pending payment, and returns a
 *       Flutterwave checkout link. Identify the cart via the `x-guest-id`
 *       header (or `guestId` in the body).
 *     tags: [Checkout]
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer, shippingAddress]
 *             properties:
 *               customer:
 *                 type: object
 *                 required: [fullName, email, phoneNumber]
 *                 properties:
 *                   fullName: { type: string }
 *                   email: { type: string }
 *                   phoneNumber: { type: string }
 *               shippingAddress:
 *                 type: object
 *                 required: [country, state, city, addressLine1]
 *                 properties:
 *                   country: { type: string }
 *                   state: { type: string }
 *                   city: { type: string }
 *                   addressLine1: { type: string }
 *                   addressLine2: { type: string }
 *                   postalCode: { type: string }
 *               billingAddress: { type: object, nullable: true }
 *               couponCode: { type: string }
 *               deliveryMethod: { type: string }
 *               shippingMethodId: { type: string }
 *               currency: { type: string, example: NGN }
 *               paymentMethod: { type: string }
 *     responses:
 *       201: { description: Checkout initialized, returns paymentLink }
 *       400: { description: Validation / empty cart }
 *       409: { description: Out of stock }
 */
router.post("/", checkoutController);

export default router;
