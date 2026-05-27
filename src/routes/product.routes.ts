import { Router } from "express";
import upload from "../config/multer";
import {
  createProductController,
  getProductsController,
  getSingleProduct,
} from "../controller/product.controller";
import {
  addFavorite,
  getFavorites,
  removeFavorites,
} from "../controller/favorites.controller";
import { verifyToken } from "../middleware/verify.middleware";

const router = Router();

/**
 * @swagger
 * /api/product/create-products:
 *   post:
 *     summary: Create a new product
 *     description: Create a product with 1–4 images upload
 *     tags:
 *       - Product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - productDescription
 *               - productPrice
 *               - productImages
 *             properties:
 *               productName:
 *                 type: string
 *                 example: "Nike Air Max"
 *               productDescription:
 *                 type: string
 *                 example: "High quality running shoes"
 *               productPrice:
 *                 type: string
 *                 example: "25000"
 *               productImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid request
 */

router.post(
  "/create-products",
  verifyToken,
  upload.fields([{ name: "productImages", maxCount: 4 }]),
  createProductController,
);

/**
 * @swagger
 * /api/product/get-products:
 *   get:
 *     summary: Get all products
 *     description: Fetch all available products
 *     tags:
 *       - Product
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/get-products", verifyToken, getProductsController);

/**
 * @swagger
 * /api/product/get-single-product/{productId}:
 *   get:
 *     summary: Get single product
 *     description: Fetch a single product by ID
 *     tags:
 *       - Product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *       404:
 *         description: Product not found
 */
router.get("/get-single-product/:productId", verifyToken, getSingleProduct);

// // favorites products routes
// /**
//  * @swagger
//  * /api/product/add-favorites:
//  *   post:
//  *     summary: Add product to favorites
//  *     description: Add a product to user's favorites list
//  *     tags:
//  *       - Favorites
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - productId
//  *             properties:
//  *               productId:
//  *                 type: string
//  *                 example: "64f1c2a9b1d2c3e4f5678901"
//  *     responses:
//  *       200:
//  *         description: Added to favorites
//  *       400:
//  *         description: Invalid request
//  */
// router.post("/add-favorites", verifyToken, addFavorite);

// /**
//  * @swagger
//  * /api/product/get-favorites:
//  *   get:
//  *     summary: Get user favorites
//  *     description: Fetch all favorite products of a user
//  *     tags:
//  *       - Favorites
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Favorites fetched successfully
//  *       401:
//  *         description: Unauthorized
//  */
// router.get("/get-favorites", verifyToken, getFavorites);

// /**
//  * @swagger
//  * /api/product/remove-favorites/{productId}:
//  *   delete:
//  *     summary: Remove product from favorites
//  *     description: Remove a product from user's favorites list
//  *     tags:
//  *       - Favorites
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: productId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Product ID
//  *     responses:
//  *       200:
//  *         description: Removed from favorites
//  *       404:
//  *         description: Product not found
//  */
// router.delete("/remove-favorites/:productId", verifyToken, removeFavorites);

export default router;
