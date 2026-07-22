import { Router } from "express";
import { protectAdmin } from "../middleware/admin.middleware";
import {
  validateCouponController,
  createCoupon,
  listCoupons,
  updateCoupon,
} from "../controller/coupon.controller";

const router = Router();

/**
 * @swagger
 * /api/coupon/validate:
 *   post:
 *     summary: Validate a coupon and preview the discount (public)
 *     tags: [Coupon]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, subtotal]
 *             properties:
 *               code: { type: string }
 *               subtotal: { type: number }
 *     responses:
 *       200: { description: Valid coupon with discount }
 *       400: { description: Invalid/expired coupon }
 */
router.post("/validate", validateCouponController);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.get("/", protectAdmin, listCoupons);
router.post("/", protectAdmin, createCoupon);
router.patch("/:couponId", protectAdmin, updateCoupon);

export default router;
