import { Router } from "express";
import upload from "../config/multer";
import {
  addFavorite,
  createProductController,
  getFavorites,
  getProductsController,
  removeFavorites,
} from "../controller/product.controller";
import { verifyToken } from "../middleware/verify.middleware";

const router = Router();

router.post(
  "/create-products",
  verifyToken,
  upload.fields([{ name: "productImages", maxCount: 4 }]),
  createProductController,
);
router.get("/get-products", verifyToken, getProductsController);
router.post("/add-favorites", verifyToken, addFavorite);
router.get("/get-favorites", verifyToken, getFavorites);
router.delete("/remove-favorites/:productId", verifyToken, removeFavorites);

export default router;
