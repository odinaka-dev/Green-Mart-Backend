import { Router } from "express";
import { verifyToken } from "../middleware/verify.middleware";
import {
  addToCart,
  getCart,
  removeFromCart,
} from "../controller/cart.controller";

const router = Router();

router.post("/add-cart", verifyToken, addToCart);
router.get("/get-cart", verifyToken, getCart);
router.delete("/delete-cart/:productId", verifyToken, removeFromCart);

export default router;
