import { Router } from "express";
import { protectAdmin } from "../middleware/admin.middleware";
import {
  trackOrderController,
  listOrdersController,
  getOrderController,
  updateOrderStatusController,
} from "../controller/order.controller";

const router = Router();

/**
 * @swagger
 * /api/order/track/{orderNumber}:
 *   get:
 *     summary: Track a guest order (public)
 *     description: Look up an order by its number. Requires the customer email as a query param for privacy.
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: email
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order found }
 *       404: { description: Order not found }
 */
router.get("/track/:orderNumber", trackOrderController);

// ─── Admin order management ───────────────────────────────────────────────────
/**
 * @swagger
 * /api/order/admin/list:
 *   get:
 *     summary: List all orders (admin)
 *     tags: [Order]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Orders fetched }
 */
router.get("/admin/list", protectAdmin, listOrdersController);
router.get("/admin/:orderId", protectAdmin, getOrderController);
router.patch("/admin/:orderId/status", protectAdmin, updateOrderStatusController);

export default router;
