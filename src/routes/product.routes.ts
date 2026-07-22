import { Router } from "express";
import upload from "../config/multer";
import {
  createProductController,
  getProductsController,
  getSingleProduct,
  updateProductController,
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
 *     description: |
 *       Create a product with 1–4 images. Requires a valid user or guest token.
 *
 *       Array fields (`sizes`, `tags`, `availableColors`) can be sent as:
 *       - A JSON string: `["xl","xxl"]`
 *       - A comma-separated string: `xl,xxl`
 *       - Multiple form-data values with the same key
 *
 *       `tags` and `availableColors` are stored lowercase.
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
 *                 type: number
 *                 example: 25000
 *               ratings:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 example: 4.5
 *               sizes:
 *                 type: string
 *                 example: '["s","m","l","xl","xxl"]'
 *                 description: JSON array or comma-separated list of sizes
 *               tags:
 *                 type: string
 *                 example: '["male","unisex"]'
 *                 description: Collection tags — used for filtering by ?collections=
 *               availableColors:
 *                 type: string
 *                 example: '["red","blue","green"]'
 *                 description: Available colours — used for filtering by ?color=
 *               productImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 1 to 4 product images
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 product:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     productDescription:
 *                       type: string
 *                     productPrice:
 *                       type: number
 *                     ratings:
 *                       type: number
 *                     sizes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["s","m","l","xl","xxl"]
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["male","unisex"]
 *                     availableColors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["red","blue"]
 *                     productImages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           publicId:
 *                             type: string
 *       400:
 *         description: Missing or too many images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Server error
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
 *     description: |
 *       Fetch paginated products with optional search, sort, collection, and colour filters.
 *       Supports both user and guest tokens.
 *
 *       **Filter by collection (tag):** `?collections=male` — returns products whose `tags` array contains "male".
 *       Comma-separate for multiple: `?collections=male,unisex`
 *
 *       **Filter by colour:** `?color=red` — returns products whose `availableColors` array contains "red".
 *       Comma-separate for multiple: `?color=red,blue`
 *     tags:
 *       - Product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by name (case-insensitive)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc]
 *           default: newest
 *         description: Sort order
 *       - in: query
 *         name: collections
 *         schema:
 *           type: string
 *         description: Filter by tag/collection. Comma-separated for multiple. Example — `male` or `male,unisex`
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Filter by available colour. Comma-separated for multiple. Example — `red` or `red,blue`
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Products fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           productName:
 *                             type: string
 *                           productDescription:
 *                             type: string
 *                           productPrice:
 *                             type: number
 *                           ratings:
 *                             type: number
 *                           sizes:
 *                             type: array
 *                             items:
 *                               type: string
 *                           tags:
 *                             type: array
 *                             items:
 *                               type: string
 *                           availableColors:
 *                             type: array
 *                             items:
 *                               type: string
 *                           productImages:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 url:
 *                                   type: string
 *                                 publicId:
 *                                   type: string
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Server error
 */
router.get("/get-products", verifyToken, getProductsController);

/**
 * @swagger
 * /api/product/get-single-product/{productId}:
 *   get:
 *     summary: Get a single product by ID
 *     description: Fetch a specific product by its ID. Requires a valid user token.
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
 *         description: MongoDB ObjectId of the product
 *         example: "64f1c2a9b1d2c3e4f5678901"
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     productDescription:
 *                       type: string
 *                     productPrice:
 *                       type: number
 *                     productImages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           publicId:
 *                             type: string
 *       204:
 *         description: No product found
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Server error
 */
router.get("/get-single-product/:productId", verifyToken, getSingleProduct);

/**
 * @swagger
 * /api/product/edit-product/{productId}:
 *   patch:
 *     summary: Edit a product by ID
 *     description: |
 *       Update an existing product. Requires a valid user or guest token.
 *
 *       All fields are optional — only the fields you send are updated (partial update).
 *
 *       Array fields (`sizes`, `tags`, `availableColors`) can be sent as:
 *       - A JSON string: `["xl","xxl"]`
 *       - A comma-separated string: `xl,xxl`
 *       - Multiple form-data values with the same key
 *
 *       `tags` and `availableColors` are stored lowercase.
 *
 *       **Images:** If you upload 1–4 `productImages`, the existing images are
 *       replaced and removed from storage. If you send no images, the current
 *       images are kept unchanged.
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
 *         description: MongoDB ObjectId of the product
 *         example: "64f1c2a9b1d2c3e4f5678901"
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 example: "Nike Air Max"
 *               productDescription:
 *                 type: string
 *                 example: "High quality running shoes"
 *               productPrice:
 *                 type: number
 *                 example: 25000
 *               ratings:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 example: 4.5
 *               sizes:
 *                 type: string
 *                 example: '["s","m","l","xl","xxl"]'
 *                 description: JSON array or comma-separated list of sizes
 *               tags:
 *                 type: string
 *                 example: '["male","unisex"]'
 *                 description: Collection tags — used for filtering by ?collections=
 *               availableColors:
 *                 type: string
 *                 example: '["red","blue","green"]'
 *                 description: Available colours — used for filtering by ?color=
 *               productImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 1 to 4 replacement images (optional)
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product updated successfully
 *                 product:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     productDescription:
 *                       type: string
 *                     productPrice:
 *                       type: number
 *                     ratings:
 *                       type: number
 *                     sizes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["s","m","l","xl","xxl"]
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["male","unisex"]
 *                     availableColors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["red","blue"]
 *                     productImages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           publicId:
 *                             type: string
 *       400:
 *         description: Invalid product id or too many images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/edit-product/:productId",
  verifyToken,
  upload.fields([{ name: "productImages", maxCount: 4 }]),
  updateProductController,
);

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
