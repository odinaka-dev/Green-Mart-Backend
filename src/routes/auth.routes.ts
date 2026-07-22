import { authLimiter } from "../middleware/rateLimit";
import { Router } from "express";
import {
  forgotPasswordController,
  loginUserController,
  registerUserController,
  resetPassword,
  userLogoutController,
  verifyResetCode,
} from "../controller/auth.controller";
import { validate } from "../validators/auth.validate";
import { registerSchema } from "../modules/auth/auth.validation";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Create new user
 *     description: This endpoint creates an account for a user and returns a token
 *     tags:
 *       - Auth
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
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               role:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account created successfully
 *       400:
 *         description: Invalid credentials
 */
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  registerUserController,
);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: This endpoint logs in a user and returns a token
 *     tags:
 *       - Auth
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", authLimiter, loginUserController);
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: This endpoint helps users activate forgot password process
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/forgot-password", authLimiter, forgotPasswordController);
/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify otp
 *     description: This endpoint sends a 5 digit verification code to a user to confirm they own the email or Account
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/verify-otp", authLimiter, verifyResetCode);
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Rest Password
 *     description: This endpoint sends requires users to first initiate verify-otp, submit 5 digit code, before inputting their details, Frontend should pass code and email from verify into the code and email body
 *     tags:
 *      - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/reset-password", authLimiter, resetPassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout the currently authenticated user. Discard the token on the client side after calling this endpoint.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
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
 *                   example: User logged out successfully
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: User access required
 *       500:
 *         description: Server error
 */
router.post("/logout", authLimiter, userLogoutController);

export default router;
