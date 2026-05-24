import { Router } from "express";
import { verifyToken } from "../middleware/verify.middleware";
import {
  addToCart,
  getCart,
  removeFromCart,
} from "../controller/cart.controller";

const router = Router();

/**
 * @swagger
 * /api/cart/add-cart:
 *   post:
 *     summary: Add item to cart
 *     description: Adds a single product to cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "6a11fbe604161b8eeda89a54"
 *               quantity:
 *                 type: number
 *                 example: 1
 *     responses:
 *       200:
 *         description: Item added successfully
 *       400:
 *         description: Invalid request
 */
router.post("/add-cart", verifyToken, addToCart);

/**
 * @swagger
 * /api/cart/get-cart:
 *   get:
 *     summary: Get cart items
 *     description: This endpoint retrieves all items in the user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 */
router.get("/get-cart", verifyToken, getCart);

/**
 * @swagger
 * /api/cart/delete-cart/{productId}:
 *   delete:
 *     summary: Delete a product from cart
 *     description: This endpoint allows users to delete a product from cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to remove from cart
 *     responses:
 *       200:
 *         description: Item deleted from cart successfully
 *       400:
 *         description: Invalid request
 */
router.delete("/delete-cart/:productId", verifyToken, removeFromCart);
export default router;
