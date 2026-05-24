import { Router } from "express";
import { verifyToken } from "../middleware/verify.middleware";
import {
  addToCart,
  getCart,
  removeFromCart,
} from "../controller/cart.controller";

const router = Router();

router.post("/cart", verifyToken, addToCart);
router.get("/cart", verifyToken, getCart);
router.delete("/cart/:productId", verifyToken, removeFromCart);
