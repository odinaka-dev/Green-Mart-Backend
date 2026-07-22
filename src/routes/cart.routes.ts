import { Router } from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controller/cart.controller";

const router = Router();

/**
 * All cart endpoints are PUBLIC (guest checkout). Identify the cart with the
 * `x-guest-id` header returned from POST /api/guest/session.
 *
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Public guest cart. Send the guest id via the `x-guest-id` header.
 */

/**
 * @swagger
 * /api/cart/add-cart:
 *   post:
 *     summary: Add item to cart (public)
 *     tags: [Cart]
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: string }
 *               variantId: { type: string, nullable: true }
 *               quantity: { type: number, example: 1 }
 *     responses:
 *       200: { description: Item added }
 *       404: { description: Product or guest session not found }
 *       409: { description: Insufficient stock }
 */
router.post("/add-cart", addToCart);

/**
 * @swagger
 * /api/cart/get-cart:
 *   get:
 *     summary: Get cart with live pricing (public)
 *     tags: [Cart]
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cart retrieved }
 */
router.get("/get-cart", getCart);

/**
 * @swagger
 * /api/cart/update-cart:
 *   patch:
 *     summary: Update the quantity of a cart line (public)
 *     tags: [Cart]
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string }
 *               variantId: { type: string, nullable: true }
 *               quantity: { type: number, example: 2 }
 *     responses:
 *       200: { description: Cart updated }
 */
router.patch("/update-cart", updateCartItem);

/**
 * @swagger
 * /api/cart/delete-cart/{productId}:
 *   delete:
 *     summary: Remove a product from cart (public)
 *     tags: [Cart]
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: variantId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Item removed }
 */
router.delete("/delete-cart/:productId", removeFromCart);

/**
 * @swagger
 * /api/cart/clear-cart:
 *   delete:
 *     summary: Clear the cart (public)
 *     tags: [Cart]
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cart cleared }
 */
router.delete("/clear-cart", clearCart);

export default router;
