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

router.post(
  "/create-products",
  verifyToken,
  upload.fields([{ name: "productImages", maxCount: 4 }]),
  createProductController,
);
router.get("/get-products", verifyToken, getProductsController);
router.get("/get-single-product/:productId", verifyToken, getSingleProduct);

// favorites products routes
router.post("/add-favorites", verifyToken, addFavorite);
router.get("/get-favorites", verifyToken, getFavorites);
router.delete("/remove-favorites/:productId", verifyToken, removeFavorites);

export default router;
