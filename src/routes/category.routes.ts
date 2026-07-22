import { Router } from "express";
import { protectAdmin } from "../middleware/admin.middleware";
import {
  listCategories,
  createCategory,
  updateCategory,
} from "../controller/category.controller";

const router = Router();

/**
 * @swagger
 * /api/category:
 *   get:
 *     summary: List categories (public)
 *     tags: [Category]
 *     responses:
 *       200: { description: Categories fetched }
 *   post:
 *     summary: Create category (admin)
 *     tags: [Category]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       201: { description: Created }
 */
router.get("/", listCategories);
router.post("/", protectAdmin, createCategory);
router.patch("/:categoryId", protectAdmin, updateCategory);

export default router;
