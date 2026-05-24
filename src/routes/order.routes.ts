import { Router } from "express";
import { verifyToken } from "../middleware/verify.middleware";
import { createOrder, getUserOrders } from "../controller/order.controller";

const router = Router();

router.post("/orders", verifyToken, createOrder);
router.get("/orders", verifyToken, getUserOrders);
