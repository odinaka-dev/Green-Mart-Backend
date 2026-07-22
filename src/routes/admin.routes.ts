import { Router } from "express";
import { authLimiter } from "../middleware/rateLimit";
import {
  adminLoginController,
  adminLogoutController,
  createAdminController,
} from "../controller/admin.controller";
import { protectAdmin } from "../middleware/admin.middleware";

const router = Router();

/**
 * @swagger
 * /api/admin/create:
 *   post:
 *     summary: Create a new admin
 *     description: |
 *       Register a new admin account. This is NOT a public signup — it requires BOTH:
 *       1. A valid admin Bearer token (only a logged-in admin may create another admin), and
 *       2. A valid `adminSecret` matching the server-side `ADMIN_SECRET` env variable.
 *
 *       To bootstrap the very first admin (when none exists yet), run the seed script:
 *       `npx ts-node src/scripts/seedAdmin.ts`
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phoneNumber
 *               - password
 *               - adminSecret
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Jane Admin"
 *               email:
 *                 type: string
 *                 example: "admin@greenmart.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "08012345678"
 *               password:
 *                 type: string
 *                 example: "StrongPass123!"
 *               adminSecret:
 *                 type: string
 *                 description: Server-side secret required to create an admin account
 *                 example: "my-super-secret"
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     admin:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           example: ADMIN
 *       400:
 *         description: Email already in use
 *       401:
 *         description: Unauthorized — missing or invalid admin token
 *       403:
 *         description: Not an admin, or invalid admin secret
 *       500:
 *         description: Server error
 */
// protectAdmin: only an authenticated ADMIN may create another admin.
// The adminSecret checked inside createAdminService remains as a second factor.
router.post("/create", authLimiter, protectAdmin, createAdminController);

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticate as an admin. Only accounts with the ADMIN role are permitted.
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@greenmart.com"
 *               password:
 *                 type: string
 *                 example: "StrongPass123!"
 *     responses:
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     admin:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           example: ADMIN
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account is not an admin
 *       500:
 *         description: Server error
 */
router.post("/login", authLimiter, adminLoginController);

/**
 * @swagger
 * /api/admin/logout:
 *   post:
 *     summary: Admin logout
 *     description: Logout the currently authenticated admin. Discard the token on the client side after calling this endpoint.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin logged out successfully
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post("/logout", protectAdmin, adminLogoutController);

export default router;
