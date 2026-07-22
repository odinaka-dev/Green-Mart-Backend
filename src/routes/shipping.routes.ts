import { Router } from "express";
import { protectAdmin } from "../middleware/admin.middleware";
import {
  listShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
} from "../controller/shipping.controller";

const router = Router();

/**
 * @swagger
 * /api/shipping:
 *   get:
 *     summary: List active shipping methods (public)
 *     tags: [Shipping]
 *     responses:
 *       200: { description: Methods fetched }
 *   post:
 *     summary: Create shipping method (admin)
 *     tags: [Shipping]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       201: { description: Created }
 */
router.get("/", listShippingMethods);
router.post("/", protectAdmin, createShippingMethod);
router.patch("/:methodId", protectAdmin, updateShippingMethod);
router.delete("/:methodId", protectAdmin, deleteShippingMethod);

export default router;
