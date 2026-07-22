import { Router } from "express";
import { verifyToken } from "../middleware/verify.middleware";
import {
  addFavorite,
  getFavorites,
  removeFavorites,
} from "../controller/favorites.controller";

const router = Router();

/**
 * @swagger
 * /api/favorites/add:
 *   post:
 *     summary: Add a product to favorites
 *     description: Works for both authenticated users and guests (pass their respective JWT).
 *     tags:
 *       - Favorites
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
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "6a11fbe604161b8eeda89a54"
 *     responses:
 *       201:
 *         description: Added to favorites
 *       401:
 *         description: Unauthorized
 */
router.post("/add", verifyToken, addFavorite);

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get all favorites
 *     description: Returns all favorited products for the current user or guest.
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyToken, getFavorites);

/**
 * @swagger
 * /api/favorites/{productId}:
 *   delete:
 *     summary: Remove a product from favorites
 *     description: Removes a product from the current user's or guest's favorites.
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to remove from favorites
 *     responses:
 *       200:
 *         description: Favorite removed successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/:productId", verifyToken, removeFavorites);

export default router;
