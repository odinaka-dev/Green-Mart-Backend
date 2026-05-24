import { Router } from "express";
import { verifyToken } from "../middleware/verify.middleware";
import { createOrder, getUserOrders } from "../controller/order.controller";

const router = Router();

router.post("/create-orders", verifyToken, createOrder);
router.get("/get-orders", verifyToken, getUserOrders);

export default router;
